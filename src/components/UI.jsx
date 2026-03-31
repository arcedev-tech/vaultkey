import { useState, useEffect } from "react";

// ============================================
// Input
// ============================================
export function Input({ label, error, type = "text", style, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <label style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 6,
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && showPassword ? "text" : type}
          style={{
            width: "100%",
            padding: "11px 14px",
            paddingRight: isPassword ? 44 : 14,
            borderRadius: "var(--radius-sm)",
            border: `1.5px solid ${error ? "var(--danger)" : "var(--border)"}`,
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
            fontFamily: isPassword ? "'JetBrains Mono', monospace" : "inherit",
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
          onBlur={(e) => e.target.style.borderColor = error ? "var(--danger)" : "var(--border)"}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "var(--text-secondary)",
              padding: 4,
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

// ============================================
// Button
// ============================================
export function Button({ children, variant = "primary", loading, style, ...props }) {
  const styles = {
    primary: {
      background: "var(--accent)",
      color: "white",
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: "var(--text)",
      border: "1.5px solid var(--border)",
    },
    danger: {
      background: "var(--danger)",
      color: "white",
      border: "none",
    },
    ghost: {
      background: "transparent",
      color: "var(--accent)",
      border: "none",
    },
  };

  return (
    <button
      disabled={loading}
      style={{
        padding: "11px 20px",
        borderRadius: "var(--radius-sm)",
        fontWeight: 600,
        fontSize: 14,
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.2s",
        opacity: loading ? 0.7 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...styles[variant],
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span style={{
          width: 16,
          height: 16,
          border: "2px solid currentColor",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
}

// ============================================
// Modal
// ============================================
export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          borderRadius: "var(--radius)",
          padding: 24,
          maxWidth: 480,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
          animation: "scaleIn 0.2s ease",
        }}
      >
        {title && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ============================================
// Toast
// ============================================
export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: "var(--success-light)", border: "var(--success)", icon: "✓" },
    error: { bg: "var(--danger-light)", border: "var(--danger)", icon: "✕" },
    info: { bg: "var(--accent-light)", border: "var(--accent)", icon: "ℹ" },
  };

  const c = colors[type];

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1001,
      animation: "slideUp 0.3s ease",
    }}>
      <div style={{
        background: "var(--card)",
        border: `1.5px solid ${c.border}`,
        borderRadius: "var(--radius-sm)",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "var(--shadow-md)",
        fontSize: 14,
        fontWeight: 500,
      }}>
        <span style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: c.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: c.border,
        }}>
          {c.icon}
        </span>
        {message}
      </div>
    </div>
  );
}

// ============================================
// Category Badge
// ============================================
const CATEGORY_CONFIG = {
  general: { label: "General", icon: "📁", color: "#6b7280" },
  email: { label: "Email", icon: "📧", color: "#2563eb" },
  banking: { label: "Banca", icon: "🏦", color: "#059669" },
  social: { label: "Redes", icon: "💬", color: "#8b5cf6" },
  work: { label: "Trabajo", icon: "💼", color: "#d97706" },
  shopping: { label: "Compras", icon: "🛒", color: "#ec4899" },
  gaming: { label: "Gaming", icon: "🎮", color: "#ef4444" },
};

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
}

export function CategoryBadge({ category }) {
  const config = getCategoryConfig(category);
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: config.color + "15",
      color: config.color,
    }}>
      {config.icon} {config.label}
    </span>
  );
}
