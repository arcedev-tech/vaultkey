import { useState } from "react";
import { supabase } from "../lib/supabase";
import { unlockWithMaster, unlockWithRecovery, reEncryptWithNewMaster } from "../lib/crypto";
import { useAuth } from "../context/AuthContext";
import { Input, Button } from "../components/UI";

export default function Login({ onSwitch }) {
  const { setEncryptionKey, loadProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [recoveryStep, setRecoveryStep] = useState(1);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: masterPassword,
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      const key = await unlockWithMaster(masterPassword, profile);
      setEncryptionKey(key);
      await loadProfile(authData.user.id);
    } catch (err) {
      if (err.message?.includes("Invalid login")) {
        setError("Email o contraseña incorrectos");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.");
      } else {
        setError(err.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (recoveryStep === 1) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/vaultkey/",
        });

        if (resetError) throw resetError;

        setRecoveryStep(2);
        setError("");
      } else {
        if (newPassword.length < 8) {
          setError("La nueva contraseña debe tener al menos 8 caracteres");
          return;
        }
        if (newPassword !== confirmNew) {
          setError("Las contraseñas no coinciden");
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) throw updateError;

        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const key = await unlockWithRecovery(recoveryInput, profile);

        const newMasterData = await reEncryptWithNewMaster(newPassword, key);

        await supabase
          .from("profiles")
          .update({
            encrypted_key_by_master: newMasterData.encryptedKeyByMaster,
            master_salt: newMasterData.masterSalt,
            master_iv: newMasterData.masterIv,
          })
          .eq("id", user.id);

        setEncryptionKey(key);
        await loadProfile(user.id);
      }
    } catch (err) {
      setError(err.message || "Error en la recuperación");
    } finally {
      setLoading(false);
    }
  }

  if (showRecovery) {
    return (
      <div style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "40px 20px",
        animation: "slideUp 0.4s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            🔑 Recuperar bóveda
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 6 }}>
            {recoveryStep === 1
              ? "Introduce tu email y clave de recuperación"
              : "Revisa tu email y establece una nueva contraseña"}
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "var(--radius)",
          padding: 24,
          boxShadow: "var(--shadow-md)",
        }}>
          <form onSubmit={handleRecovery}>
            {recoveryStep === 1 ? (
              <>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                  }}>
                    Clave de recuperación (24 palabras)
                  </label>
                  <textarea
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    placeholder="Escribe tus 24 palabras..."
                    rows={3}
                    required
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', monospace",
                      resize: "none",
                      outline: "none",
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <Input
                  label="Nueva contraseña maestra"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <Input
                  label="Confirmar nueva contraseña"
                  type="password"
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                />
              </>
            )}

            {error && (
              <p style={{
                fontSize: 13,
                color: "var(--danger)",
                marginBottom: 16,
                padding: "8px 12px",
                background: "var(--danger-light)",
                borderRadius: "var(--radius-sm)",
              }}>
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} style={{ width: "100%" }}>
              {recoveryStep === 1 ? "Enviar email de recuperación" : "Establecer nueva contraseña"}
            </Button>
          </form>

          <p style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginTop: 20,
          }}>
            <button
              onClick={() => { setShowRecovery(false); setRecoveryStep(1); setError(""); }}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              ← Volver al inicio de sesión
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 440,
      margin: "0 auto",
      padding: "40px 20px",
      animation: "slideUp 0.4s ease",
    }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
          🔐 VaultKey
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 6 }}>
          Desbloquea tu bóveda
        </p>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderRadius: "var(--radius)",
        padding: 24,
        boxShadow: "var(--shadow-md)",
      }}>
        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña maestra"
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            placeholder="Tu contraseña maestra"
            required
          />

          {error && (
            <p style={{
              fontSize: 13,
              color: "var(--danger)",
              marginBottom: 16,
              padding: "8px 12px",
              background: "var(--danger-light)",
              borderRadius: "var(--radius-sm)",
            }}>
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} style={{ width: "100%" }}>
            Desbloquear
          </Button>
        </form>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginTop: 20,
          fontSize: 13,
        }}>
          <button
            onClick={() => { setShowRecovery(true); setError(""); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <p style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-secondary)",
          marginTop: 16,
        }}>
          ¿No tienes cuenta?{" "}
          <button
            onClick={onSwitch}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
}