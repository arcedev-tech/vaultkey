import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vault from "./pages/Vault";
import VaultTransition from "./components/VaultTransition";

function AppContent() {
  const { user, isUnlocked, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const [authMessage, setAuthMessage] = useState(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);

    const type = hashParams.get("type") || queryParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setAuthMessage({ text: "Error al confirmar. Intenta de nuevo.", type: "error" });
        } else if (type === "signup" || type === "email_change") {
          setAuthMessage({ text: "Email confirmado correctamente. Ya puedes iniciar sesión.", type: "success" });
          supabase.auth.signOut();
        } else if (type === "recovery") {
          setAuthMessage({ text: "Introduce tu clave de recuperación y tu nueva contraseña.", type: "info" });
        }
        window.history.replaceState(null, "", window.location.pathname);
      });
    }
  }, []);

  if (user && isUnlocked && !vaultReady && !showTransition) {
    setShowTransition(true);
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }} />
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Cargando VaultKey...</p>
      </div>
    );
  }

  if (showTransition) {
    return <VaultTransition onComplete={() => {
      setShowTransition(false);
      setVaultReady(true);
    }} />;
  }

  if (user && isUnlocked && vaultReady) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundImage: "url('./assets/vault-open.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}>
        <Vault />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('./assets/vault-closed.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}>
      {authMessage && (
        <div style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          padding: "12px 24px",
          borderRadius: "var(--radius-sm)",
          background: authMessage.type === "success" ? "var(--success)" : authMessage.type === "error" ? "var(--danger)" : "var(--accent)",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "var(--shadow-md)",
          animation: "slideDown 0.3s ease",
          cursor: "pointer",
        }}
          onClick={() => setAuthMessage(null)}
        >
          {authMessage.text}
        </div>
      )}
      {showRegister
        ? <Register onSwitch={() => setShowRegister(false)} />
        : <Login onSwitch={() => setShowRegister(true)} />
      }
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}