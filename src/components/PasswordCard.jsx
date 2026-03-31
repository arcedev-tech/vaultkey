import { useState } from "react";
import { CategoryBadge } from "./UI";

export default function PasswordCard({ entry, onEdit, onDelete, onCopy }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(null);

  function handleCopy(field, value) {
    navigator.clipboard.writeText(value);
    setCopied(field);
    onCopy?.(field);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={{
      background: "var(--card)",
      borderRadius: "var(--radius)",
      padding: "16px 18px",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid var(--border)",
      transition: "box-shadow 0.2s, transform 0.2s",
      animation: "slideUp 0.3s ease",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
      }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            {entry.name}
          </h3>
          <CategoryBadge category={entry.category} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={onEdit}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              padding: 6,
              borderRadius: 6,
              color: "var(--text-secondary)",
              transition: "background 0.15s",
            }}
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              padding: 6,
              borderRadius: 6,
              color: "var(--text-secondary)",
              transition: "background 0.15s",
            }}
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Username */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>USUARIO</span>
          <p style={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {entry.username}
          </p>
        </div>
        <button
          onClick={() => handleCopy("user", entry.username)}
          style={{
            background: copied === "user" ? "var(--success-light)" : "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: copied === "user" ? "var(--success)" : "var(--text-secondary)",
            transition: "all 0.15s",
            flexShrink: 0,
            marginLeft: 10,
          }}
        >
          {copied === "user" ? "✓" : "📋"}
        </button>
      </div>

      {/* Password */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>CONTRASEÑA</span>
          <p style={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {showPassword ? entry.password : "••••••••••••"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 10 }}>
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
          <button
            onClick={() => handleCopy("pass", entry.password)}
            style={{
              background: copied === "pass" ? "var(--success-light)" : "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: copied === "pass" ? "var(--success)" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {copied === "pass" ? "✓" : "📋"}
          </button>
        </div>
      </div>

      {/* URL */}
      {entry.url && (
        <div style={{
          padding: "8px 0",
          borderTop: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>URL</span>
          <a
            href={entry.url.startsWith("http") ? entry.url : `https://${entry.url}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              fontSize: 13,
              color: "var(--accent)",
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.url}
          </a>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div style={{
          padding: "8px 0",
          borderTop: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>NOTAS</span>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4, marginTop: 2 }}>
            {entry.notes}
          </p>
        </div>
      )}
    </div>
  );
}
