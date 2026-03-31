import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { encryptField, decryptField } from "../lib/crypto";
import { useAuth } from "../context/AuthContext";
import { Button, Toast, Modal, getCategoryConfig } from "../components/UI";
import PasswordCard from "../components/PasswordCard";
import PasswordForm from "../components/PasswordForm";

const CATEGORIES = ["all", "general", "email", "banking", "social", "work", "shopping", "gaming"];

export default function Vault() {
  const { user, encryptionKey, signOut } = useAuth();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [toast, setToast] = useState(null);

  // Load and decrypt all passwords
  const loadPasswords = useCallback(async () => {
    if (!user || !encryptionKey) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("passwords")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading passwords:", error);
      setLoading(false);
      return;
    }

    // Decrypt all entries
    const decrypted = await Promise.all(
      (data || []).map(async (row) => {
        try {
          return {
            id: row.id,
            name: await decryptField(row.name_encrypted, encryptionKey),
            username: await decryptField(row.username_encrypted, encryptionKey),
            password: await decryptField(row.password_encrypted, encryptionKey),
            url: await decryptField(row.url_encrypted, encryptionKey),
            notes: await decryptField(row.notes_encrypted, encryptionKey),
            category: row.category,
            created_at: row.created_at,
          };
        } catch {
          return null;
        }
      })
    );

    setPasswords(decrypted.filter(Boolean));
    setLoading(false);
  }, [user, encryptionKey]);

  useEffect(() => {
    loadPasswords();
  }, [loadPasswords]);

  // Save (add or edit) a password entry
  async function handleSave(entry) {
    const encrypted = {
      user_id: user.id,
      name_encrypted: await encryptField(entry.name, encryptionKey),
      username_encrypted: await encryptField(entry.username, encryptionKey),
      password_encrypted: await encryptField(entry.password, encryptionKey),
      url_encrypted: entry.url ? await encryptField(entry.url, encryptionKey) : null,
      notes_encrypted: entry.notes ? await encryptField(entry.notes, encryptionKey) : null,
      category: entry.category,
      updated_at: new Date().toISOString(),
    };

    if (entry.id) {
      // Update
      const { error } = await supabase
        .from("passwords")
        .update(encrypted)
        .eq("id", entry.id);

      if (error) {
        setToast({ message: "Error al guardar", type: "error" });
        return;
      }
      setToast({ message: "Contraseña actualizada", type: "success" });
    } else {
      // Insert
      const { error } = await supabase
        .from("passwords")
        .insert(encrypted);

      if (error) {
        setToast({ message: "Error al añadir", type: "error" });
        return;
      }
      setToast({ message: "Contraseña añadida", type: "success" });
    }

    setShowForm(false);
    setEditEntry(null);
    await loadPasswords();
  }

  // Delete a password entry
  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("passwords")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      setToast({ message: "Error al eliminar", type: "error" });
    } else {
      setToast({ message: `"${deleteTarget.name}" eliminado`, type: "success" });
    }

    setDeleteTarget(null);
    await loadPasswords();
  }

  // Filter passwords
  const filtered = passwords.filter((p) => {
    const matchSearch = search
      ? p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.username.toLowerCase().includes(search.toLowerCase()) ||
        (p.url && p.url.toLowerCase().includes(search.toLowerCase()))
      : true;

    const matchCategory = activeCategory === "all" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div style={{
      maxWidth: 600,
      margin: "0 auto",
      padding: "24px 16px 40px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        animation: "fadeIn 0.4s ease",
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
            🔐 VaultKey
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {passwords.length} contraseña{passwords.length !== 1 ? "s" : ""} guardada{passwords.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => { setEditEntry(null); setShowForm(true); }}>
            + Nueva
          </Button>
          <Button variant="ghost" onClick={signOut} style={{ fontSize: 13 }}>
            Salir
          </Button>
        </div>
      </div>

      {/* Search */}
      <div style={{
        position: "relative",
        marginBottom: 16,
        animation: "slideUp 0.4s ease",
      }}>
        <span style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16,
          color: "var(--text-secondary)",
        }}>
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contraseñas..."
          style={{
            width: "100%",
            padding: "12px 14px 12px 42px",
            borderRadius: "var(--radius)",
            border: "1.5px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
            boxShadow: "var(--shadow-sm)",
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
          onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
      </div>

      {/* Category filter */}
      <div style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        paddingBottom: 8,
        marginBottom: 20,
        WebkitOverflowScrolling: "touch",
        animation: "slideUp 0.45s ease",
      }}>
        {CATEGORIES.map((cat) => {
          const isAll = cat === "all";
          const config = isAll ? { label: "Todas", icon: "📦", color: "var(--accent)" } : getCategoryConfig(cat);
          const active = activeCategory === cat;
          const count = isAll ? passwords.length : passwords.filter((p) => p.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1.5px solid ${active ? config.color : "var(--border)"}`,
                background: active ? (isAll ? "var(--accent-light)" : config.color + "15") : "var(--card)",
                color: active ? config.color : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s",
              }}
            >
              {config.icon} {config.label}
              {count > 0 && (
                <span style={{
                  background: active ? config.color + "25" : "var(--bg)",
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontSize: 10,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Password list */}
      {loading ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          color: "var(--text-secondary)",
        }}>
          <div style={{
            width: 32,
            height: 32,
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            margin: "0 auto 12px",
          }} />
          Cargando bóveda...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          color: "var(--text-secondary)",
          animation: "fadeIn 0.4s ease",
        }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>
            {search || activeCategory !== "all" ? "🔍" : "🔒"}
          </span>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            {search || activeCategory !== "all" ? "Sin resultados" : "Tu bóveda está vacía"}
          </p>
          <p style={{ fontSize: 13 }}>
            {search || activeCategory !== "all"
              ? "Prueba con otros términos de búsqueda"
              : "Añade tu primera contraseña para empezar"}
          </p>
          {!search && activeCategory === "all" && (
            <Button onClick={() => setShowForm(true)} style={{ marginTop: 16 }}>
              + Añadir contraseña
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((entry) => (
            <PasswordCard
              key={entry.id}
              entry={entry}
              onEdit={() => { setEditEntry(entry); setShowForm(true); }}
              onDelete={() => setDeleteTarget(entry)}
              onCopy={(field) => setToast({
                message: field === "pass" ? "Contraseña copiada" : "Usuario copiado",
                type: "info",
              })}
            />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <PasswordForm
          entry={editEntry}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal title="Eliminar contraseña" onClose={() => setDeleteTarget(null)}>
          <p style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            marginBottom: 20,
          }}>
            ¿Seguro que quieres eliminar <strong>"{deleteTarget.name}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} style={{ flex: 1 }}>
              Eliminar
            </Button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
