import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Bell, 
  LogOut, 
  Layers, 
  BookOpen, 
  FileText, 
  Award, 
  Mail, 
  Smartphone, 
  X, 
  CalendarDays,
  User as UserIcon,
  Users,
  ShieldAlert,
  GraduationCap,
  School,
  UserCheck,
  Lock,
  MessageSquare,
  Send,
  Bot
} from 'lucide-react';

export default function Dashboard({ username, isStaff, onLogout, backendUrl, authHeader }) {
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  
  // Navigation tabs: 'dashboard', 'students', 'events', 'notifications', 'chatbot'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState(null); // Admin filter for student events
  
  // Event Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    event_type: 'examen',
    user_id: '' // Target student ID for Admin creation
  });

  // Student Profile CRUD Modal states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudentProfile, setEditingStudentProfile] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    matricule: '',
    sexe: 'M',
    universite: '',
    faculte: '',
    departement: '',
    password: ''
  });

  // Chatbot Assistant Widget states
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'bot', 
      text: "Bonjour ! 👋 Je suis **ScolarBot**, votre assistant universitaire.\n\nDemandez-moi par exemple :\n- *« Quand est mon examen de réseaux ? »*\n- *« Planifie une soutenance de projet pour le 15 juin à 10h »*\n- *« Quels sont mes prochains examens ? »*" 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    examen: 0,
    inscription: 0,
    soutenance: 0,
    studentsCount: 0,
    notificationsCount: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const requests = [
        axios.get(`${backendUrl}/api/events/`, { headers: authHeader }),
        axios.get(`${backendUrl}/api/notifications/`, { headers: authHeader })
      ];
      
      if (isStaff) {
        requests.push(axios.get(`${backendUrl}/api/students/`, { headers: authHeader }));
      }
      
      const results = await Promise.all(requests);
      setEvents(results[0].data);
      setNotifications(results[1].data);
      if (isStaff && results[2]) {
        setStudents(results[2].data);
      }
      updateStats(results[0].data, results[1].data, isStaff ? results[2].data.length : 0);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchSilentData();
    }, 8000);
    return () => clearInterval(interval);
  }, [isStaff]);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'chatbot') {
      scrollToBottom();
    }
  }, [chatMessages, chatLoading, activeTab]);

  const fetchSilentData = async () => {
    try {
      const requests = [
        axios.get(`${backendUrl}/api/events/`, { headers: authHeader }),
        axios.get(`${backendUrl}/api/notifications/`, { headers: authHeader })
      ];
      if (isStaff) {
        requests.push(axios.get(`${backendUrl}/api/students/`, { headers: authHeader }));
      }
      const results = await Promise.all(requests);
      setEvents(results[0].data);
      setNotifications(results[1].data);
      if (isStaff && results[2]) {
        setStudents(results[2].data);
      }
      updateStats(results[0].data, results[1].data, isStaff ? results[2].data.length : 0);
    } catch (err) {
      console.error("Silent fetch error:", err);
    }
  };

  const updateStats = (eventList, notifList, studentCount) => {
    const newStats = { 
      total: eventList.length, 
      examen: 0, 
      inscription: 0, 
      soutenance: 0,
      studentsCount: studentCount,
      notificationsCount: notifList.length
    };
    eventList.forEach(e => {
      if (newStats[e.event_type] !== undefined) {
        newStats[e.event_type]++;
      }
    });
    setStats(newStats);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Chatbot Send Message Handler
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/chat/`, {
        message: userText
      }, { headers: authHeader });

      setChatMessages(prev => [...prev, { sender: 'bot', text: response.data.response }]);

      // Trigger automatic UI refresh if an event or notification was created via NLP
      if (response.data.action === 'event_created' || response.data.action === 'notification_created') {
        fetchSilentData();
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { sender: 'bot', text: "⚠️ Désolé, l'assistant est temporairement indisponible. Veuillez vérifier votre connexion." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Simple Markdown Helper
  const formatBotResponse = (text) => {
    return text.split('\n').map((line, idx) => {
      let formatted = line;
      // Bold formatter **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic formatter *text*
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Inline code `code`
      formatted = formatted.replace(/`/g, ''); // Clean inline code tags simply
      
      if (line.startsWith('- ')) {
        return <li key={idx} dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} style={{ marginLeft: '16px', listStyleType: 'disc', margin: '4px 0' }} />;
      }
      return <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} style={{ margin: '4px 0' }} />;
    });
  };

  // Event Modal Handlers
  const handleOpenAddModal = (preselectedStudentId = null) => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      event_type: 'examen',
      user_id: preselectedStudentId || (students.length > 0 ? students[0].id : '')
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    const localDate = new Date(event.date);
    const tzOffset = localDate.getTimezoneOffset() * 60000;
    const formattedDate = new Date(localDate.getTime() - tzOffset).toISOString().slice(0, 16);
    
    const student = students.find(s => s.username === event.user);
    
    setFormData({
      title: event.title,
      description: event.description || '',
      date: formattedDate,
      event_type: event.event_type,
      user_id: student ? student.id : ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      try {
        await axios.delete(`${backendUrl}/api/events/${id}/`, { headers: authHeader });
        const updated = events.filter(e => e.id !== id);
        setEvents(updated);
        updateStats(updated, notifications, students.length);
      } catch (err) {
        console.error("Error deleting event:", err);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const isoDate = new Date(formData.date).toISOString();
      const payload = { 
        title: formData.title,
        description: formData.description,
        date: isoDate,
        event_type: formData.event_type
      };

      if (isStaff && formData.user_id) {
        payload.user_id = parseInt(formData.user_id);
      }

      if (editingEvent) {
        const res = await axios.put(`${backendUrl}/api/events/${editingEvent.id}/`, payload, { headers: authHeader });
        const updated = events.map(e => e.id === editingEvent.id ? res.data : e);
        setEvents(updated);
        updateStats(updated, notifications, students.length);
      } else {
        const res = await axios.post(`${backendUrl}/api/events/`, payload, { headers: authHeader });
        const updated = [...events, res.data];
        setEvents(updated);
        updateStats(updated, notifications, students.length);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Erreur lors de l'enregistrement de l'événement.");
    }
  };

  // Student CRUD Modal Handlers
  const handleOpenAddStudentModal = () => {
    setEditingStudentProfile(null);
    setStudentFormData({
      email: '',
      nom: '',
      prenom: '',
      matricule: '',
      sexe: 'M',
      universite: '',
      faculte: '',
      departement: '',
      password: ''
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudentModal = (student) => {
    setEditingStudentProfile(student);
    setStudentFormData({
      email: student.email || '',
      nom: student.nom || '',
      prenom: student.prenom || '',
      matricule: student.matricule || student.username || '',
      sexe: student.sexe || 'M',
      universite: student.universite || '',
      faculte: student.faculte || '',
      departement: student.departement || '',
      password: '' // Optional for edits
    });
    setIsStudentModalOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet étudiant et TOUS ses événements / notifications associés ? Cette action est irréversible.")) {
      try {
        await axios.delete(`${backendUrl}/api/students/${studentId}/`, { headers: authHeader });
        const updated = students.filter(s => s.id !== studentId);
        setStudents(updated);
        fetchSilentData();
      } catch (err) {
        console.error("Error deleting student:", err);
        alert("Erreur lors de la suppression de l'étudiant.");
      }
    }
  };

  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: studentFormData.email.trim(),
        nom: studentFormData.nom.trim(),
        prenom: studentFormData.prenom.trim(),
        matricule: studentFormData.matricule.trim(),
        sexe: studentFormData.sexe,
        universite: studentFormData.universite.trim(),
        faculte: studentFormData.faculte.trim(),
        departement: studentFormData.departement.trim()
      };
      
      if (studentFormData.password) {
        payload.password = studentFormData.password;
      }

      if (editingStudentProfile) {
        const res = await axios.put(`${backendUrl}/api/students/${editingStudentProfile.id}/`, payload, { headers: authHeader });
        const updated = students.map(s => s.id === editingStudentProfile.id ? res.data : s);
        setStudents(updated);
      } else {
        const res = await axios.post(`${backendUrl}/api/students/`, payload, { headers: authHeader });
        setStudents([...students, res.data]);
      }
      setIsStudentModalOpen(false);
      fetchSilentData();
    } catch (err) {
      console.error("Error saving student:", err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        const msgs = Object.keys(data).map(k => `${k} : ${Array.isArray(data[k]) ? data[k].join(' ') : data[k]}`);
        alert("Erreur : " + msgs.join(' \n '));
      } else {
        alert("Erreur lors de l'enregistrement de l'étudiant.");
      }
    }
  };

  const handleViewStudentEvents = (studentId) => {
    setSelectedStudentId(studentId);
    setActiveTab('events');
  };

  const filteredEvents = events.filter(e => {
    const matchesType = filterType === 'all' || e.event_type === filterType;
    if (isStaff && selectedStudentId) {
      const targetStudent = students.find(s => s.id === selectedStudentId);
      const matchesStudent = targetStudent ? e.user === targetStudent.username : true;
      return matchesType && matchesStudent;
    }
    return matchesType;
  });

  const formatFrenchDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString('fr-FR', options);
  };

  const formatShortDate = (dateStr) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Left: Navigation */}
      <aside className="sidebar-left">
        <div className="sidebar-logo">
          <CalendarDays className="sidebar-logo-icon" />
          <h2>ReminderBot</h2>
        </div>
        
        <div className="user-profile-badge">
          <div className="user-avatar" style={{ background: isStaff ? 'rgba(99, 102, 241, 0.2)' : 'rgba(236, 72, 153, 0.2)', color: isStaff ? 'var(--color-accent)' : 'var(--color-examen)' }}>
            {isStaff ? 'AD' : username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{username}</span>
            <span className="user-role">{isStaff ? 'Administrateur' : 'Étudiant'}</span>
          </div>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSelectedStudentId(null); }}>
            <Layers className="nav-icon" />
            <span>{isStaff ? 'Statistiques' : 'Mon Espace'}</span>
          </li>
          
          {isStaff && (
            <li className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
              <Users className="nav-icon" />
              <span>Gestion Étudiants</span>
            </li>
          )}
          
          <li className={`nav-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            <BookOpen className="nav-icon" />
            <span>{isStaff ? 'Toutes les Échéances' : 'Mes Échéances'}</span>
          </li>

          <li className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <Bell className="nav-icon" />
            <span>{isStaff ? 'Alertes Système' : 'Mes Alertes'}</span>
          </li>

          {/* Chatbot Tab for Students in Left Sidebar */}
          {!isStaff && (
            <li className={`nav-item ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}>
              <MessageSquare className="nav-icon" />
              <span>ScolarBot AI</span>
            </li>
          )}
        </ul>

        <button className="btn-primary logout-btn" onClick={onLogout}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ gridColumn: isStaff ? 'span 2' : 'span 1' }}>
        <header className="main-header">
          <div>
            <h1>
              {activeTab === 'chatbot' ? 'Assistant ScolarBot AI' : isStaff ? 'Espace Administrateur' : 'Tableau de bord académique'}
            </h1>
            <p>
              {activeTab === 'chatbot' 
                ? 'Posez vos questions académiques en direct et gérez vos alertes de scolarité.'
                : isStaff 
                ? "Panneau de supervision. Suivez les étudiants et organisez les échéances de la faculté."
                : `Bonjour ${username}, gérez vos échéances et restez notifié en temps réel.`}
            </p>
          </div>
          
          {((!isStaff && activeTab !== 'chatbot') || activeTab === 'events') && (
            <button className="btn-primary btn-add" onClick={() => handleOpenAddModal(selectedStudentId)}>
              <Plus size={18} />
              Ajouter un événement
            </button>
          )}
        </header>

        {/* Tab content 1: Dashboard / Stats */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Grid */}
            <section className="stats-grid">
              {isStaff ? (
                <>
                  <div className="stat-card glass-panel" style={{ borderLeft: '3px solid var(--color-accent)' }}>
                    <div className="stat-icon-wrapper total"><Users size={22} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.studentsCount}</span>
                      <span className="stat-label">Étudiants Inscrits</span>
                    </div>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderLeft: '3px solid var(--color-inscription)' }}>
                    <div className="stat-icon-wrapper inscription"><Calendar size={22} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.total}</span>
                      <span className="stat-label">Échéances Créées</span>
                    </div>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderLeft: '3px solid var(--color-soutenance)' }}>
                    <div className="stat-icon-wrapper soutenance"><Bell size={22} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.notificationsCount}</span>
                      <span className="stat-label">Rappels Émis</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper total"><Calendar size={22} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.total}</span>
                      <span className="stat-label">Mes échéances</span>
                    </div>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderLeft: '3px solid var(--color-examen)' }}>
                    <div className="stat-icon-wrapper examen"><BookOpen size={22} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.examen}</span>
                      <span className="stat-label">Examens</span>
                    </div>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderLeft: '3px solid var(--color-inscription)' }}>
                    <div className="stat-icon-wrapper inscription"><FileText size={22} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.inscription}</span>
                      <span className="stat-label">Inscriptions</span>
                    </div>
                  </div>
                  <div className="stat-card glass-panel" style={{ borderLeft: '3px solid var(--color-soutenance)' }}>
                    <div className="stat-icon-wrapper soutenance"><Award size={22} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.soutenance}</span>
                      <span className="stat-label">Soutenances</span>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Split dashboard view */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: !isStaff ? '1.1fr 1fr' : '2fr 1fr', gap: '24px' }}>
              {/* Column 1: Prochaines Échéances & Frise Chronologique pour l'étudiant */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Recent Events */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div className="card-header">
                    <h2>{isStaff ? 'Échéances Récentes' : 'Mes Prochaines Échéances'}</h2>
                    <button className="btn-tab-action" onClick={() => setActiveTab('events')}>
                      Voir tout
                    </button>
                  </div>
                  {events.length === 0 ? (
                    <div className="empty-state">
                      <CalendarDays className="empty-state-icon" />
                      <p>Aucun événement planifié.</p>
                    </div>
                  ) : (
                    <div className="events-list">
                      {events.slice(0, 3).map(event => (
                        <div key={event.id} className="event-item glass-panel">
                          <div className={`event-type-indicator ${event.event_type}`} />
                          <div className="event-details">
                            <div className="event-title-row">
                              <span className="event-title">{event.title}</span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {isStaff && (
                                  <span className="event-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                                    Pour : {event.user}
                                  </span>
                                )}
                                <span className={`event-badge ${event.event_type}`}>{event.event_type}</span>
                              </div>
                            </div>
                            <div className="event-time">
                              <Clock size={13} />
                              <span>{formatFrenchDate(event.date)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timeline */}
                {!isStaff && (
                  <div className="glass-panel calendar-panel" style={{ padding: '24px' }}>
                    <div className="card-header">
                      <h2>Frise Chronologique</h2>
                    </div>
                    {events.length === 0 ? (
                      <div className="empty-state">
                        <p>Aucun événement futur.</p>
                      </div>
                    ) : (
                      <div className="timeline-container">
                        {events
                          .filter(e => new Date(e.date) >= new Date())
                          .slice(0, 3)
                          .map(event => (
                            <div key={event.id} className={`timeline-node ${event.event_type}`}>
                              <div className="timeline-date">{formatShortDate(event.date)}</div>
                              <div className="timeline-content">
                                <div className="timeline-title">{event.title}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Column 2: Timeline (Admin) or Chatbot (Student) */}
              {isStaff ? (
                <div className="glass-panel calendar-panel" style={{ padding: '24px' }}>
                  <div className="card-header">
                    <h2>Frise Chronologique</h2>
                  </div>
                  {events.length === 0 ? (
                    <div className="empty-state">
                      <p>Aucun événement futur.</p>
                    </div>
                  ) : (
                    <div className="timeline-container">
                      {events
                        .filter(e => new Date(e.date) >= new Date())
                        .slice(0, 3)
                        .map(event => (
                          <div key={event.id} className={`timeline-node ${event.event_type}`}>
                            <div className="timeline-date">{formatShortDate(event.date)}</div>
                            <div className="timeline-content">
                              <div className="timeline-title">{event.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Étudiant : {event.user}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Dashboard-integrated chatbot */
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}>
                  <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Bot size={22} style={{ color: 'var(--color-accent)' }} />
                      <div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Assistant ScolarBot</h2>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
                          En ligne
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="chat-messages-container" style={{ flex: 1, maxHeight: '350px', minHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`chat-bubble ${msg.sender}`} style={{ marginBottom: '8px' }}>
                        {msg.sender === 'bot' ? formatBotResponse(msg.text) : msg.text}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="chatbot-typing-bubble">
                        <span className="chatbot-typing-dot"></span>
                        <span className="chatbot-typing-dot"></span>
                        <span className="chatbot-typing-dot"></span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <form className="chatbot-input-form" onSubmit={handleSendChatMessage} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                    <input 
                      type="text" 
                      className="chatbot-input" 
                      placeholder="Posez une question ou planifiez..." 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      style={{ padding: '10px 14px' }}
                    />
                    <button type="submit" className="chatbot-send-btn" disabled={chatLoading || !chatInput.trim()} style={{ width: '40px', height: '40px' }}>
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab content 2: Student list (Admin only) */}
        {isStaff && activeTab === 'students' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="card-header">
              <h2>Comptes Étudiants enregistrés</h2>
              <button className="btn-primary btn-add" onClick={handleOpenAddStudentModal} style={{ width: 'auto' }}>
                <Plus size={18} />
                Créer un Étudiant
              </button>
            </div>
            {students.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-state-icon" />
                <p>Aucun étudiant inscrit sur la plateforme.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Nom Complet</th>
                      <th>Sexe</th>
                      <th>E-mail</th>
                      <th>Scolarité (Univ / Fac / Dép)</th>
                      <th>Actions de gestion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(std => (
                      <tr key={std.id}>
                        <td><strong style={{ color: 'var(--text-primary)' }}>{std.matricule || std.username}</strong></td>
                        <td>{std.prenom && std.nom ? `${std.prenom} ${std.nom}` : 'Administrateur'}</td>
                        <td>{std.sexe === 'M' ? 'Masculin' : std.sexe === 'F' ? 'Féminin' : '-'}</td>
                        <td>{std.email}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {std.universite ? `${std.universite} — ${std.faculte} (${std.departement})` : 'N/A'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-tab-action" onClick={() => handleOpenAddModal(std.id)} title="Planifier Échéance">
                              <Plus size={14} /> Planifier
                            </button>
                            <button className="btn-tab-action" onClick={() => handleViewStudentEvents(std.id)} title="Voir Calendrier">
                              <BookOpen size={14} /> Calendrier
                            </button>
                            <button className="btn-tab-action" onClick={() => handleOpenEditStudentModal(std)} title="Modifier Étudiant">
                              <Edit3 size={14} />
                            </button>
                            <button className="btn-tab-action" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }} onClick={() => handleDeleteStudent(std.id)} title="Supprimer Étudiant">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab content 3: Events CRUD List */}
        {activeTab === 'events' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Liste des Échéances</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select 
                  className="form-input" 
                  style={{ padding: '6px 12px 6px 12px', width: 'auto', fontSize: '0.85rem' }}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tous les types</option>
                  <option value="examen">Examens</option>
                  <option value="inscription">Inscriptions</option>
                  <option value="soutenance">Soutenances</option>
                </select>
                
                {isStaff && selectedStudentId && (
                  <button className="btn-tab-action" onClick={() => setSelectedStudentId(null)} style={{ borderColor: 'var(--color-examen)', color: 'var(--color-examen)' }}>
                    Effacer filtre étudiant (x)
                  </button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <span className="spinner"></span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <CalendarDays className="empty-state-icon" />
                <p>Aucune échéance ne correspond à la sélection.</p>
              </div>
            ) : (
              <div className="events-list">
                {filteredEvents.map(event => (
                  <div key={event.id} className="event-item glass-panel">
                    <div className={`event-type-indicator ${event.event_type}`} />
                    <div className="event-details">
                      <div className="event-title-row">
                        <span className="event-title">{event.title}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {isStaff && (
                            <span className="event-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                              Étudiant : {event.user}
                            </span>
                          )}
                          <span className={`event-badge ${event.event_type}`}>{event.event_type}</span>
                        </div>
                      </div>
                      <p className="event-desc">{event.description || 'Aucune description fournie'}</p>
                      <div className="event-time">
                        <Clock size={14} />
                        <span>{formatFrenchDate(event.date)}</span>
                      </div>
                    </div>
                    <div className="event-actions">
                      <button className="btn-action-icon" onClick={() => handleOpenEditModal(event)} title="Modifier">
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-action-icon delete" onClick={() => handleDeleteEvent(event.id)} title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab content 4: Notifications log */}
        {activeTab === 'notifications' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div className="card-header">
              <h2>Historique des Rappels et Notifications</h2>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell className="empty-state-icon" />
                <p>Aucune notification n'a encore été générée par le système.</p>
              </div>
            ) : (
              <div className="notifs-list">
                {notifications.map(notif => (
                  <div key={notif.id} className="notif-item" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px' }}>
                    <span className={`notif-icon ${notif.channel}`} style={{ fontSize: '1.4rem' }}>
                      {notif.channel === 'email' ? <Mail size={20} /> : <Smartphone size={20} />}
                    </span>
                    <div className="notif-text">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                          Destinataire : {notif.recipient_username}
                        </span>
                        <span className="notif-time">{formatFrenchDate(notif.created_at)}</span>
                      </div>
                      <p className="notif-msg" style={{ fontSize: '0.9rem' }}>{notif.message}</p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <span className={`event-badge ${notif.event_type}`} style={{ fontSize: '0.65rem' }}>{notif.event_type}</span>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          background: notif.status === 'sent' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: notif.status === 'sent' ? 'var(--color-success)' : 'var(--color-failed)'
                        }}>
                          {notif.status === 'sent' ? 'Envoyé avec succès' : 'Échec'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab content 5: Full-Page Chatbot (From Sidebar) */}
        {!isStaff && activeTab === 'chatbot' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '520px' }}>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  background: 'rgba(99, 102, 241, 0.15)', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--color-accent)'
                }}>
                  <Bot size={26} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>ScolarBot AI</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 6px var(--color-success)' }}></span>
                    Opérationnel (En ligne)
                  </span>
                </div>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="chat-messages-container" style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '20px' }}>
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-bubble ${msg.sender}`} style={{ 
                  marginBottom: '12px', 
                  maxWidth: '75%', 
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontSize: '0.92rem'
                }}>
                  {msg.sender === 'bot' ? formatBotResponse(msg.text) : msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="chatbot-typing-bubble" style={{ padding: '10px 16px' }}>
                  <span className="chatbot-typing-dot"></span>
                  <span className="chatbot-typing-dot"></span>
                  <span className="chatbot-typing-dot"></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Form Input Footer */}
            <form className="chatbot-input-form" onSubmit={handleSendChatMessage} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <input 
                type="text" 
                className="chatbot-input" 
                placeholder="Discutez avec ScolarBot AI (ex: Quels sont mes examens ?)..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
                style={{ padding: '12px 16px', borderRadius: '10px', fontSize: '0.9rem' }}
              />
              <button type="submit" className="chatbot-send-btn" disabled={chatLoading || !chatInput.trim()} style={{ width: '46px', height: '46px', borderRadius: '10px' }}>
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Sidebar Right: Notification Center (Student Only) */}
      {!isStaff && (
        <aside className="sidebar-right">
          <h3>
            <Bell size={20} />
            <span>Centre d'Alertes</span>
            {notifications.filter(n => n.status === 'sent').length > 0 && (
              <span className="notif-badge-count">
                {notifications.filter(n => n.status === 'sent').length}
              </span>
            )}
          </h3>

          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>Aucune alerte reçue.</p>
            </div>
          ) : (
            <div className="notifs-list">
              {notifications.slice(0, 6).map(notif => (
                <div key={notif.id} className="notif-item">
                  <span className={`notif-icon ${notif.channel}`}>
                    {notif.channel === 'email' ? <Mail size={16} /> : <Smartphone size={16} />}
                  </span>
                  <div className="notif-text">
                    <p className="notif-msg">{notif.message}</p>
                    <span className="notif-time">{formatShortDate(notif.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>{editingEvent ? 'Modifier l\'Échéance' : 'Ajouter une Échéance'}</h2>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              {/* Admin selection dropdown */}
              {isStaff && (
                <div className="form-group">
                  <label className="form-label">Assigner à l'étudiant</label>
                  <select 
                    className="form-input" 
                    style={{ paddingLeft: '16px' }}
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                  >
                    {students.map(std => (
                      <option key={std.id} value={std.id}>{std.prenom} {std.nom} ({std.matricule || std.username})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Titre de l'événement</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '16px' }}
                  placeholder="Ex: Examen Final d'Algorithmique" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input" 
                  style={{ paddingLeft: '16px', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Ex: Chapitre 1 à 5. Calculatrices interdites." 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date & Heure</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    style={{ paddingLeft: '16px' }}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type d'événement</label>
                  <select 
                    className="form-input" 
                    style={{ paddingLeft: '16px' }}
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  >
                    <option value="examen">Examen</option>
                    <option value="inscription">Inscription</option>
                    <option value="soutenance">Soutenance</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student CRUD Modal (Admin Only) */}
      {isStudentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingStudentProfile ? "Modifier le Profil Étudiant" : "Créer un Nouveau Compte Étudiant"}</h2>
              <button className="btn-close" onClick={() => setIsStudentModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleStudentFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><UserIcon size={18} /></span>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="DIALLO" 
                      value={studentFormData.nom}
                      onChange={(e) => setStudentFormData({ ...studentFormData, nom: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><UserIcon size={18} /></span>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Mamadou Samba" 
                      value={studentFormData.prenom}
                      onChange={(e) => setStudentFormData({ ...studentFormData, prenom: e.target.value })}
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">N° Matricule</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><UserCheck size={18} /></span>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: 24E567" 
                      value={studentFormData.matricule}
                      onChange={(e) => setStudentFormData({ ...studentFormData, matricule: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sexe</label>
                  <select 
                    className="form-input" 
                    style={{ paddingLeft: '16px' }}
                    value={studentFormData.sexe}
                    onChange={(e) => setStudentFormData({ ...studentFormData, sexe: e.target.value })}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Université</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><School size={18} /></span>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: UGANC" 
                      value={studentFormData.universite}
                      onChange={(e) => setStudentFormData({ ...studentFormData, universite: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Faculté</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><GraduationCap size={18} /></span>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: FDS" 
                      value={studentFormData.faculte}
                      onChange={(e) => setStudentFormData({ ...studentFormData, faculte: e.target.value })}
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Département</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><BookOpen size={18} /></span>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: Informatique" 
                      value={studentFormData.departement}
                      onChange={(e) => setStudentFormData({ ...studentFormData, departement: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Adresse E-mail</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><Mail size={18} /></span>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Ex: mamadou@example.com" 
                      value={studentFormData.email}
                      onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mot de passe {editingStudentProfile && "(Laissez vide pour ne pas modifier)"}
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={18} /></span>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder={editingStudentProfile ? "••••••••" : "Définissez un mot de passe"} 
                    value={studentFormData.password}
                    onChange={(e) => setStudentFormData({ ...studentFormData, password: e.target.value })}
                    required={!editingStudentProfile} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsStudentModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingStudentProfile ? "Enregistrer" : "Créer l'étudiant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
