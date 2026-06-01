import React, { useState } from 'react';
import { 
  GraduationCap, 
  Bot, 
  Bell, 
  Calendar, 
  Shield, 
  Cpu, 
  ArrowRight, 
  Sparkles, 
  Send, 
  Users 
} from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  const [demoChat, setDemoChat] = useState([
    { role: 'user', text: "Quand a lieu mon prochain examen d'Algorithmique ?" },
    { role: 'bot', text: "Votre examen d'Algorithmique est prévu pour le Mardi 9 Juin à 09h00 en Salle 3. Voulez-vous que je planifie un rappel par Email ?" }
  ]);
  const [demoInput, setDemoInput] = useState('');

  const handleDemoSend = (e) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    
    const userMsg = { role: 'user', text: demoInput };
    let botMsg = { role: 'bot', text: "Désolé, ceci est une démo. Connectez-vous pour discuter réellement avec ScolarBot !" };
    
    if (demoInput.toLowerCase().includes('bonjour') || demoInput.toLowerCase().includes('salut')) {
      botMsg = { role: 'bot', text: "Bonjour ! Je suis ScolarBot. Comment puis-je vous aider dans votre organisation académique aujourd'hui ?" };
    } else if (demoInput.toLowerCase().includes('aide') || demoInput.toLowerCase().includes('help')) {
      botMsg = { role: 'bot', text: "Je peux vous donner la date de vos examens, lister les cours du jour ou configurer des notifications de rappels !" };
    }

    setDemoChat(prev => [...prev, userMsg, botMsg]);
    setDemoInput('');
  };

  return (
    <div className="landing-wrapper">
      {/* Background Ambient Glows */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      {/* Navigation Bar */}
      <header className="landing-nav glass-panel">
        <div className="nav-logo">
          <GraduationCap className="logo-icon animate-pulse" size={32} />
          <span>ReminderBot <span className="logo-badge">ScolarBot AI</span></span>
        </div>
        <nav className="nav-links-desktop">
          <a href="#features">Fonctionnalités</a>
          <a href="#demo">Démo ScolarBot</a>
          <a href="#stats">Statistiques</a>
          <a href="#architecture">Architecture</a>
        </nav>
        <button className="btn-nav-login btn-primary" onClick={onGetStarted}>
          Accéder au Portail <ArrowRight size={16} />
        </button>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <div className="hero-tag">
            <Sparkles size={14} className="tag-icon" />
            Portail Officiel UGANC
          </div>
          <h1>
            Votre assistant d'apprentissage et de <span className="gradient-text">planification</span>
          </h1>
          <p>
            Une solution moderne conçue pour l'Université Gamal Abdel Nasser de Conakry. Suivez vos cours, examens, soutenances de mémoire et recevez des alertes instantanées.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary btn-primary" onClick={onGetStarted}>
              Accéder au Portail <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn-hero-secondary btn-secondary text-center">
              En savoir plus
            </a>
          </div>
        </div>

        {/* The Phone Mockup Display (Without the UGANC card) */}
        <div className="hero-mockup">
          <div className="phone-mockup-card glass-panel" style={{ background: '#090d19' }}>
            <div className="phone-header">
              <div className="phone-logo">
                <GraduationCap size={16} className="logo-icon-small" />
                <span>ReminderBot</span>
              </div>
              <span className="phone-badge">ScolarBot AI</span>
            </div>

            <div className="phone-body">
              <div className="phone-tagline">
                <Sparkles size={10} className="tagline-icon" />
                <span>L'IA au service de votre réussite académique</span>
              </div>

              <h3 className="phone-headline">
                Ne manquez plus jamais <span className="highlight-blue">un événement académique</span>
              </h3>

              {/* Chat Widget inside Phone */}
              <div className="phone-chat-widget">
                <div className="phone-chat-header">
                  <div className="phone-bot-avatar">
                    <Bot size={12} />
                  </div>
                  <div>
                    <h5>ScolarBot Assistant</h5>
                    <span className="phone-status-online">En ligne (Mode Démo)</span>
                  </div>
                </div>

                <div className="phone-chat-messages">
                  {demoChat.map((msg, i) => (
                    <div key={i} className={`phone-msg-bubble ${msg.role}`}>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="phone-chat-footer-wrapper" onClick={e => e.stopPropagation()}>
                  <form onSubmit={handleDemoSend} className="phone-chat-footer">
                    <input 
                      type="text" 
                      placeholder="Posez une question..." 
                      value={demoInput}
                      onChange={e => setDemoInput(e.target.value)}
                    />
                    <button type="submit" className="phone-chat-send-btn">
                      <Send size={10} />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Overlapping Floating Reminder Card */}
            <div className="overlapping-reminder-card glass-panel">
              <Bell size={16} className="reminder-bell-icon" />
              <div>
                <h6>Rappel Examen</h6>
                <p>Algorithmique: dans 3 jours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Des Fonctionnalités <span className="gradient-text">Puissantes & Intuitives</span></h2>
          <p>Découvrez comment notre écosystème intelligent simplifie le suivi de votre calendrier universitaire.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-bot">
              <Bot size={24} />
            </div>
            <h3>ScolarBot AI Chatbot</h3>
            <p>Discutez avec une intelligence artificielle intégrée. Posez-lui des questions en langage naturel pour savoir quand aura lieu votre prochain devoir ou modifier vos rappels.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-bell">
              <Bell size={24} />
            </div>
            <h3>Rappels Multi-canaux</h3>
            <p>Recevez des rappels instantanés. Connecté avec SMTP (Gmail), un Bot Telegram dédié et des notifications push directement sur votre navigateur web.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-cal">
              <Calendar size={24} />
            </div>
            <h3>Calendrier Centralisé</h3>
            <p>Un tableau de bord interactif listant tous les examens, les soutenances de mémoire et les inscriptions de votre faculté, classés par département.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-shield">
              <Shield size={24} />
            </div>
            <h3>Rôles Dédiés</h3>
            <p>Accès sécurisé et distinct pour les Étudiants (suivi de leur calendrier et notifications personnalisées) et les Administrateurs (gestion et publication d'événements).</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-cpu">
              <Cpu size={24} />
            </div>
            <h3>Intégration Django & Vite</h3>
            <p>Propulsé par un backend robuste sous Django REST Framework et une interface ultra-rapide développée en React (Vite) avec design de type Glassmorphism.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-users">
              <Users size={24} />
            </div>
            <h3>Filtres par Département</h3>
            <p>Chaque étudiant accède uniquement aux cours et examens qui concernent son département académique, pour éviter toute surcharge d'informations.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stats-container glass-panel">
          <div className="stat-item">
            <h3>99.9%</h3>
            <p>Taux de délivrabilité des rappels</p>
          </div>
          <div className="stat-line"></div>
          <div className="stat-item">
            <h3>&lt; 2s</h3>
            <p>Temps de réponse de ScolarBot</p>
          </div>
          <div className="stat-line"></div>
          <div className="stat-item">
            <h3>24h/7</h3>
            <p>Disponibilité des plannings en ligne</p>
          </div>
        </div>
      </section>

      {/* Architecture Showcase */}
      <section id="architecture" className="arch-section">
        <div className="section-header">
          <h2>Architecture & <span className="gradient-text">Flux d'Informations</span></h2>
          <p>Un flux de données asynchrone conçu pour délivrer l'information de manière fiable et rapide.</p>
        </div>

        <div className="arch-flow glass-panel">
          <div className="flow-step">
            <div className="step-num">1</div>
            <h4>Interface React Vite</h4>
            <p>L'étudiant ou l'administrateur interagit avec le Dashboard ou pose une question à ScolarBot.</p>
          </div>
          <div className="flow-arrow">➜</div>
          <div className="flow-step">
            <div className="step-num">2</div>
            <h4>Backend Django REST</h4>
            <p>Le serveur traite les requêtes, interroge la base de données SQLite et exécute le module NLP ScolarBot.</p>
          </div>
          <div className="flow-arrow">➜</div>
          <div className="flow-step">
            <div className="step-num">3</div>
            <h4>Planificateur APScheduler</h4>
            <p>Un service en arrière-plan surveille les dates clés et gère la file d'attente des rappels automatiques.</p>
          </div>
          <div className="flow-arrow">➜</div>
          <div className="flow-step">
            <div className="step-num">4</div>
            <h4>Canaux de Notification</h4>
            <p>Les alertes sont envoyées instantanément par Email (SMTP), Telegram Bot API, ou Web Push.</p>
          </div>
        </div>
      </section>

      {/* Bottom Call To Action */}
      <section className="cta-section">
        <div className="cta-card glass-panel">
          <h2>Prêt à optimiser votre organisation ?</h2>
          <p>Rejoignez les étudiants de votre faculté et commencez dès aujourd'hui à utiliser ReminderBot.</p>
          <button className="btn-primary btn-cta" onClick={onGetStarted}>
            Accéder à l'application maintenant <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 ReminderBot & ScolarBot AI. Tous droits réservés.</p>
        <p className="footer-credits">Conçu avec passion pour une gestion universitaire intelligente.</p>
      </footer>
    </div>
  );
}
