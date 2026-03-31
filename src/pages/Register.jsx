import { useState } from "react";
import { supabase } from "../lib/supabase";
import { generateRecoveryKey, setupEncryption } from "../lib/crypto";
import { Input, Button } from "../components/UI";

export default function Register({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hint, setHint] = useState("");
  const [recoveryKey, setRecoveryKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [confirmRecovery, setConfirmRecovery] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (masterPassword.length < 8) {
      setError("La contraseña maestra debe tener al menos 8 caracteres");
      return;
    }
    if (masterPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const newRecoveryKey = generateRecoveryKey();
      setRecoveryKey(newRecoveryKey);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: masterPassword,
      });

      if (authError) throw authError;

      const encryptionData = await setupEncryption(masterPassword, newRecoveryKey);

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          encrypted_key_by_master: encryptionData.encryptedKeyByMaster,
          encrypted_key_by_recovery: encryptionData.encryptedKeyByRecovery,
          master_salt: encryptionData.masterSalt,
          recovery_salt: encryptionData.recoverySalt,
          master_iv: encryptionData.masterIv,
          recovery_iv: encryptionData.recoveryIv,
          hint: hint || null,
        });

      if (profileError) throw profileError;

      setStep(2);
    } catch (err) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleConfirmRecovery() {
    const cleaned = confirmRecovery.trim().toLowerCase();
    const original = recoveryKey.trim().toLowerCase();
    if (cleaned === original) {
      setStep(3);
    } else {
      setError("La clave de recuperación no coincide. Asegúrate de haberla copiado correctamente.");
    }
  }

  if (step === 2) {
    return (
      <div style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "40px 20px",
        animation: "slideUp 0.4s ease",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "var(--radius)",
          padding: 28,
          boxShadow: "var(--shadow-md)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 40 }}>🔑</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>
              Tu clave de recuperación
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>
              Guarda estas 24 palabras en un lugar seguro. Es la <strong>única forma</strong> de recuperar tu bóveda si olvidas la contraseña maestra.
            </p>
          </div>

          <div style={{
            background: "var(--warning)" + "10",
            border: "1.5px solid var(--warning)",
            borderRadius: "var(--radius-sm)",
            padding: 16,
            marginBottom: 20,
            fontSize: 13,
            color: "var(--warning)",
            fontWeight: 500,
            lineHeight: 1.5,
          }}>
            ⚠️ No podrás ver esta clave de nuevo. Si la pierdes y olvidas tu contraseña maestra, perderás acceso a todas tus contraseñas.
          </div>

          <div style={{
            background: "var(--bg)",
            borderRadius: "var(--radius-sm)",
            padding: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14,
            lineHeight: 2,
            wordSpacing: 8,
            textAlign: "center",
            border: "1.5px solid var(--border)",
            marginBottom: 16,
          }}>
            {recoveryKey}
          </div>

          <Button
            onClick={handleCopy}
            variant="secondary"
            style={{ width: "100%", marginBottom: 12 }}
          >
            {copied ? "✓ Copiada" : "📋 Copiar clave"}
          </Button>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
              Confirma tu clave de recuperación:
            </p>
            <textarea
              value={confirmRecovery}
              onChange={(e) => { setConfirmRecovery(e.target.value); setError(""); }}
              placeholder="Escribe las 24 palabras aquí..."
              rows={3}
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
            {error && <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>{error}</p>}
          </div>

          <Button
            onClick={handleConfirmRecovery}
            style={{ width: "100%", marginTop: 12 }}
          >
            He guardado mi clave
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div style={{
        maxWidth: 440,
        margin: "0 auto",
        padding: "40px 20px",
        animation: "slideUp 0.4s ease",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "var(--radius)",
          padding: 28,
          boxShadow: "var(--shadow-md)",
          textAlign: "center",
        }}>
          <span style={{ fontSize: 48 }}>🎉</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>
            ¡Cuenta creada!
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>
            Revisa tu email para confirmar tu cuenta y después inicia sesión.
          </p>
          <Button
            onClick={onSwitch}
            style={{ width: "100%", marginTop: 24 }}
          >
            Ir a iniciar sesión
          </Button>
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
          Crea tu bóveda segura
        </p>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderRadius: "var(--radius)",
        padding: 24,
        boxShadow: "var(--shadow-md)",
      }}>
        <form onSubmit={handleRegister}>
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
            placeholder="Mínimo 8 caracteres"
            required
          />

          <Input
            label="Confirmar contraseña maestra"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            required
          />

          <Input
            label="Pista (opcional)"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Algo que te ayude a recordarla"
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
            Crear cuenta
          </Button>
        </form>

        <p style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-secondary)",
          marginTop: 20,
        }}>
          ¿Ya tienes cuenta?{" "}
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
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}