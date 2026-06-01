import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, Calendar, Bell, LogOut, Plus, Trash2, Edit3, Clock, Mail, Smartphone, Shield, X, RefreshCw } from "lucide-react";

export default function AdminDashboard({ username, onLogout, backendUrl, authHeader }) {
  const [tab, setTab] = useState("overview");
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", event_type: "examen", user_id: "" });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [s, e, n] = await Promise.all([
        axios.get(`${backendUrl}/api/students/`, { headers: authHeader }),
        axios.get(`${backendUrl}/api/events/`, { headers: authHeader }),
        axios.get(`${backendUrl}/api/notifications/`, { headers: authHeader }),
      ]);
      setStudents(s.data); setEvents(e.data); setNotifs(n.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", date: "", event_type: "examen", user_id: students[0]?.id || "" });
    setModal(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    const d = new Date(ev.date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({ title: ev.title, description: ev.description || "", date: local, event_type: ev.event_type, user_id: "" });
    setModal(true);
  };

  const del = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    await axios.delete(`${backendUrl}/api/events/${id}/`, { headers: authHeader });
    fetchAll();
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, date: new Date(form.date).toISOString() };
    if (editing) await axios.put(`${backendUrl}/api/events/${editing.id}/`, payload, { headers: authHeader });
    else await axios.post(`${backendUrl}/api/events/`, payload, { headers: authHeader });
    setModal(false); fetchAll();
  };

  const fmt = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const badge = (t) => <span className={`event-badge ${t}`}>{t}</span>;
  const stats = { students: students.length, events: events.length, notifs: notifs.filter(n => n.status === "sent").length, upcoming: events.filter(e => new Date(e.date) > new Date()).length };

  const TABS = [
    { id: "overview", icon: <Shield size={18} />, label: "Vue d\u2019ensemble" },
    { id: "students", icon: <Users size={18} />, label: "\u00c9tudiants" },
    { id: "events", icon: <Calendar size={18} />, label: "Tous les \u00e9v\u00e9nements" },
    { id: "notifications", icon: <Bell size={18} />, label: "Notifications" },
  ];

  const STAT_CARDS = [
    { icon: <Users size={22} />, value: stats.students, label: "\u00c9tudiants inscrits", cls: "total" },
    { icon: <Calendar size={22} />, value: stats.events, label: "\u00c9v\u00e9nements totaux", cls: "inscription" },
    { icon: <Clock size={22} />, value: stats.upcoming, label: "\u00c0 venir", cls: "soutenance" },
    { icon: <Bell size={22} />, value: stats.notifs, label: "Notifications envoy\u00e9es", cls: "examen" },
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar-left">
        <div className="sidebar-logo">
          <Shield className="sidebar-logo-icon" />
          <h2>Admin Panel</h2>
        </div>
        <div className="user-profile-badge">
          <div className="user-avatar" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{username}</span>
            <span className="user-role" style={{ color: "#fbbf24" }}>Administrateur</span>
          </div>
        </div>
        <ul className="nav-menu">
          {TABS.map(t => (
            <li key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span><span>{t.label}</span>
            </li>
          ))}
        </ul>
        <button className="nav-item logout-btn" onClick={onLogout} style={{ marginTop: "auto", width: "100%" }}>
          <LogOut size={16} /> Deconnexion
        </button>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>{TABS.find(t => t.id === tab)?.label}</h1>
            <p>Bonjour {username} - Vous gerez l ensemble du systeme ReminderBot.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-secondary" onClick={fetchAll} style={{ width: "auto", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
              <RefreshCw size={16} /> Actualiser
            </button>
            {tab === "events" && (
              <button className="btn-primary" onClick={openAdd} style={{ width: "auto", padding: "8px 20px" }}>
                <Plus size={18} /> Ajouter
              </button>
            )}
          </div>
        </header>

        {tab === "overview" && (
          <>
            <section className="stats-grid">
              {STAT_CARDS.map((s, i) => (
                <div key={i} className="stat-card glass-panel">
                  <div className={`stat-icon-wrapper ${s.cls}`}>{s.icon}</div>
                  <div className="stat-info"><span className="stat-value">{s.value}</span><span className="stat-label">{s.label}</span></div>
                </div>
              ))}
            </section>
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div className="card-header"><h2>Derniers evenements du systeme</h2></div>
              {loading ? <div style={{ display: "flex", justifyContent: "center", padding: "30px" }}><span className="spinner"></span></div>
                : events.slice(0, 6).map(ev => (
                  <div key={ev.id} className="event-item glass-panel" style={{ marginBottom: "12px" }}>
                    <div className={`event-type-indicator ${ev.event_type}`} />
                    <div className="event-details">
                      <div className="event-title-row">
                        <span className="event-title">{ev.title}</span>{badge(ev.event_type)}
                        <span style={{ fontSize: "0.78rem", color: "var(--color-accent)", marginLeft: "auto" }}>Etudiant: {ev.user}</span>
                      </div>
                      <div className="event-time"><Clock size={13} /> {fmt(ev.date)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {tab === "students" && (
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div className="card-header">
              <h2>Liste des etudiants inscrits</h2>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{students.length} etudiant(s)</span>
            </div>
            {loading ? <div style={{ display: "flex", justifyContent: "center", padding: "30px" }}><span className="spinner"></span></div>
              : students.length === 0 ? <div className="empty-state"><Users size={40} /><p style={{ marginTop: "12px" }}>Aucun etudiant.</p></div>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
                      {["#", "Utilisateur", "E-mail", "Evenements", "Inscrit le"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--border-glass)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>{i + 1}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="user-avatar" style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>{s.username.charAt(0).toUpperCase()}</div>
                            <strong>{s.username}</strong>
                          </div>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{s.email || "—"}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-accent)", padding: "2px 10px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 600 }}>
                            {events.filter(ev => ev.user === s.username).length}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>{new Date(s.date_joined).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        )}

        {tab === "events" && (
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div className="card-header">
              <h2>Tous les evenements</h2>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{events.length} evenement(s)</span>
            </div>
            {loading ? <div style={{ display: "flex", justifyContent: "center", padding: "30px" }}><span className="spinner"></span></div>
              : events.length === 0 ? <div className="empty-state"><Calendar size={40} /><p style={{ marginTop: "12px" }}>Aucun evenement.</p></div>
              : <div className="events-list">
                {events.map(ev => (
                  <div key={ev.id} className="event-item glass-panel">
                    <div className={`event-type-indicator ${ev.event_type}`} />
                    <div className="event-details">
                      <div className="event-title-row">
                        <span className="event-title">{ev.title}</span>{badge(ev.event_type)}
                        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-accent)", fontWeight: 600 }}>Etudiant: {ev.user}</span>
                      </div>
                      <p className="event-desc">{ev.description || "Pas de description"}</p>
                      <div className="event-time"><Clock size={13} /> {fmt(ev.date)}</div>
                    </div>
                    <div className="event-actions">
                      <button className="btn-action-icon" onClick={() => openEdit(ev)}><Edit3 size={16} /></button>
                      <button className="btn-action-icon delete" onClick={() => del(ev.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>}
          </div>
        )}

        {tab === "notifications" && (
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div className="card-header">
              <h2>Historique des notifications</h2>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{notifs.length} notification(s)</span>
            </div>
            {loading ? <div style={{ display: "flex", justifyContent: "center", padding: "30px" }}><span className="spinner"></span></div>
              : notifs.length === 0 ? <div className="empty-state"><Bell size={40} /><p style={{ marginTop: "12px" }}>Aucune notification.</p></div>
              : <div className="notifs-list">
                {notifs.map(n => (
                  <div key={n.id} className="notif-item">
                    <span className={`notif-icon ${n.channel}`}>{n.channel === "email" ? <Mail size={16} /> : <Smartphone size={16} />}</span>
                    <div className="notif-text" style={{ flex: 1 }}>
                      <p className="notif-msg">{n.message}</p>
                      <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                        <span className="notif-time">{fmt(n.created_at)}</span>
                        <span style={{ fontSize: "0.72rem", color: n.status === "sent" ? "var(--color-success)" : "var(--color-failed)", fontWeight: 600, textTransform: "uppercase" }}>
                          {n.status}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-accent)" }}>Etudiant: {n.recipient_username}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
          </div>
        )}
      </main>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>{editing ? "Modifier l evenement" : "Creer un evenement"}</h2>
              <button className="btn-close" onClick={() => setModal(false)}><X size={22} /></button>
            </div>
            <form onSubmit={submit}>
              {!editing && (
                <div className="form-group">
                  <label className="form-label">Assigner a l etudiant</label>
                  <select className="form-input" style={{ paddingLeft: "16px" }} value={form.user_id}
                    onChange={e => setForm({ ...form, user_id: e.target.value })} required>
                    <option value="">Choisir un etudiant</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.username} ({s.email || "pas d email"})</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Titre</label>
                <input type="text" className="form-input" style={{ paddingLeft: "16px" }} placeholder="Titre de l evenement" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" style={{ paddingLeft: "16px", minHeight: "70px", resize: "vertical" }} placeholder="Details..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date et Heure</label>
                  <input type="datetime-local" className="form-input" style={{ paddingLeft: "16px" }} value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" style={{ paddingLeft: "16px" }} value={form.event_type}
                    onChange={e => setForm({ ...form, event_type: e.target.value })}>
                    <option value="examen">Examen</option>
                    <option value="inscription">Inscription</option>
                    <option value="soutenance">Soutenance</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
