import React, { useState } from 'react';
import ugancLogo from '../assets/uganc_logo.png';
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
          <img src={ugancLogo} alt="Logo UGANC" className="nav-uganc-logo" />
          <span>ReminderBot <span className="logo-badge">ScolarBot</span></span>
        </div>
        <nav className="nav-links-desktop">
          <a href="#features">Services</a>
          <a href="#demo">Démo interactive</a>
          <a href="#stats">Indicateurs</a>
          <a href="#organisation">Fonctionnement</a>
        </nav>
        <button className="btn-nav-login btn-primary" onClick={onGetStarted}>
          Accéder au Portail <ArrowRight size={16} />
        </button>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-text">
          <h1 className="serif-title">
            Votre espace d'organisation et de <span className="serif-italic">planification</span> académique
          </h1>
          <p>
            Une solution moderne et personnalisée conçue pour l'Université Gamal Abdel Nasser de Conakry. Suivez vos examens, cours, soutenances et recevez des rappels automatiques par e-mail ou Telegram.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary btn-primary" onClick={onGetStarted}>
              Accéder au Portail <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn-hero-secondary btn-secondary text-center">
              Découvrir les services
            </a>
          </div>
        </div>

        {/* The Mockup Display — UGANC card + Phone side by side */}
        <div className="hero-mockup hero-mockup-container">
          <div className="phone-mockup-card glass-panel">
            <div className="phone-header">
              <div className="phone-logo">
                <GraduationCap size={16} className="logo-icon-small" />
                <span>ReminderBot</span>
              </div>
              <span className="phone-badge">ScolarBot</span>
            </div>

            <div className="phone-body">
              <div className="phone-tagline">
                <span className="small-gold-dot"></span>
                <span>L'accompagnement au service de votre réussite</span>
              </div>

              <h3 className="phone-headline">
                Planifiez votre <span className="highlight-blue">calendrier d'études</span> simplement
              </h3>

              {/* Chat Widget inside Phone */}
              <div className="phone-chat-widget">
                <div className="phone-chat-header">
                  <div className="phone-bot-avatar">
                    <Bot size={12} />
                  </div>
                  <div>
                    <h5>ScolarBot</h5>
                    <span className="phone-status-online">Conseiller en ligne</span>
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
                <h6>Alerte Scolarité</h6>
                <p>Algorithmique : dans 3 jours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="serif-title">Des services universitaires <span className="serif-italic">clairs & intuitifs</span></h2>
          <p>Un ensemble d'outils coordonnés pour simplifier le quotidien des étudiants et du secrétariat.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-bot">
              <Bot size={24} />
            </div>
            <h3>Assistant Interactif ScolarBot</h3>
            <p>Interagissez avec l'assistant virtuel. Posez vos questions en langage naturel pour consulter vos dates d'examens ou demander une modification de vos rappels.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-bell">
              <Bell size={24} />
            </div>
            <h3>Rappels Personnalisés</h3>
            <p>Ne ratez aucune échéance. Recevez vos alertes de manière fiable par e-mail officiel, via notre canal Telegram dédié ou directement sur votre navigateur.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-cal">
              <Calendar size={24} />
            </div>
            <h3>Calendrier Intégré</h3>
            <p>Accédez à un tableau de bord clair regroupant les sessions d'examens, les soutenances de mémoire et les périodes d'inscriptions de votre faculté.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-shield">
              <Shield size={24} />
            </div>
            <h3>Espaces Sécurisés</h3>
            <p>Une distinction claire des rôles. Les étudiants gèrent leur scolarité et les administrateurs mettent à jour les calendriers officiels en toute sécurité.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-cpu">
              <Cpu size={24} />
            </div>
            <h3>Interface Réactive & Fluide</h3>
            <p>Une expérience de navigation soignée et fluide sur tous vos appareils, conçue par le Centre Informatique pour s'adapter à votre support de lecture.</p>
          </div>

          <div className="feature-card glass-panel">
            <div className="feat-icon-wrapper feat-users">
              <Users size={24} />
            </div>
            <h3>Filtres par Filière</h3>
            <p>Consultez uniquement les annonces et événements qui concernent votre faculté et votre département d'études pour éviter toute confusion.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stats-container glass-panel">
          <div className="stat-item">
            <h3>99.9%</h3>
            <p>Rappels transmis avec succès</p>
          </div>
          <div className="stat-line"></div>
          <div className="stat-item">
            <h3>&lt; 2s</h3>
            <p>Temps de réponse moyen du conseiller</p>
          </div>
          <div className="stat-line"></div>
          <div className="stat-item">
            <h3>24h/7</h3>
            <p>Accès continu aux plannings</p>
          </div>
        </div>
      </section>

      {/* Organisation Showcase */}
      <section id="organisation" className="arch-section">
        <div className="section-header">
          <h2 className="serif-title">Organisation du <span className="serif-italic">parcours d'information</span></h2>
          <p>Comment les données circulent de la scolarité jusqu'à votre écran.</p>
        </div>

        <div className="arch-flow glass-panel">
          <div className="flow-step">
            <div className="step-num">1</div>
            <h4>Espace Personnel</h4>
            <p>L'étudiant consulte son tableau de bord, configure ses alertes ou sollicite l'assistant virtuel.</p>
          </div>
          <div className="flow-arrow">➜</div>
          <div className="flow-step">
            <div className="step-num">2</div>
            <h4>Portail Universitaire</h4>
            <p>Le serveur centralise les dates clés, sécurise les dossiers étudiants et répond aux requêtes en direct.</p>
          </div>
          <div className="flow-arrow">➜</div>
          <div className="flow-step">
            <div className="step-num">3</div>
            <h4>Planificateur de Rappels</h4>
            <p>Un automate surveille les échéances importantes pour préparer les messages d'avertissement en avance.</p>
          </div>
          <div className="flow-arrow">➜</div>
          <div className="flow-step">
            <div className="step-num">4</div>
            <h4>Canaux de Transmission</h4>
            <p>Les messages de préparation sont expédiés via e-mail ou Telegram pour être consultables instantanément.</p>
          </div>
        </div>
      </section>

      {/* Bottom Call To Action */}
      <section className="cta-section">
        <div className="cta-card glass-panel">
          <h2 className="serif-title">Prêt à simplifier votre <span className="serif-italic">organisation académique ?</span></h2>
          <p>Rejoignez les étudiants de l'Université Gamal Abdel Nasser et gérez votre temps d'études efficacement.</p>
          <button className="btn-primary btn-cta" onClick={onGetStarted}>
            Accéder au portail étudiant <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 Université Gamal Abdel Nasser de Conakry. Tous droits réservés.</p>
        <p className="footer-credits">Développé par le Centre Informatique pour la communauté académique.</p>
      </footer>
    </div>
  );
}
