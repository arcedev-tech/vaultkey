import { useState } from "react";
import { generatePassword } from "../lib/crypto";
import { Input, Button, Modal, getCategoryConfig } from "../components/UI";

const CATEGORIES = ["general", "email", "banking", "social", "work", "shopping", "gaming"];

export default function PasswordForm({ entry, onSave, onClose }) {
  const [name, setName] = useState(entry?.name || "");
  const [username, setUsername] = useState(entry?.username || "");
  const [password, setPassword] = useState(entry?.password || "");
  const [url, setUrl] = useState(entry?.url || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [category, setCategory] = useState(entry?.category || "general");
  const [loading, setLoading] = useState(false);
  const [genLength, setGenLength] = useState(20);
  const [genOptions, setGenOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [showGenerator, setShowGenerator] = useState(false);

  function handleGenerate() {
    setPassword(generatePassword(genLength, genOptions));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !username || !password) return;
    setLoading(true);
    await onSave({ name, username, password, url, notes, category, id: entry?.id });
    setLoading(false);
  }

  return (
    <Modal title={entry ? "Editar contraseña" : "Nueva contraseña"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Gmail personal"
          required
        />

        {/* Category selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 6,
          }}>
            Categoría
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => {
              const config = getCategoryConfig(cat);
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: `1.5px solid ${active ? config.color : "var(--border)"}`,
                    background: active ? config.color + "18" : "transparent",
                    color: active ? config.color : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s",
                  }}
                >
                  {config.icon} {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Usuario / Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="usuario@email.com"
          required
        />

        <div style={{ position: "relative" }}>
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
          />
          <button
            type="button"
            onClick={() => setShowGenerator(!showGenerator)}
            style={{
              position: "absolute",
              right: 40,
              top: 30,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              padding: 4,
              color: "var(--accent)",
            }}
            title="Generar contraseña"
          >
            🎲
          </button>
        </div>

        {/* Password generator */}
        {showGenerator && (
          <div style={{
            background: "var(--bg)",
            borderRadius: "var(--radius-sm)",
            padding: 14,
            marginBottom: 16,
            border: "1.5px solid var(--border)",
            animation: "slideDown 0.2s ease",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Generador</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{genLength} chars</span>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {[
                { key: "uppercase", label: "ABC" },
                { key: "lowercase", label: "abc" },
                { key: "numbers", label: "123" },
                { key: "symbols", label: "#$%" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setGenOptions(prev => ({ ...prev, [key]: !prev[key] }))}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1.5px solid ${genOptions[key] ? "var(--accent)" : "var(--border)"}`,
                    background: genOptions[key] ? "var(--accent-light)" : "transparent",
                    color: genOptions[key] ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <Button type="button" onClick={handleGenerate} variant="secondary" style={{ width: "100%", fontSize: 13 }}>
              🎲 Generar
            </Button>
          </div>
        )}

        <Input
          label="URL (opcional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />

        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 6,
          }}>
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 14,
              resize: "none",
              outline: "none",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} style={{ flex: 1 }}>
            {entry ? "Guardar cambios" : "Añadir"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
