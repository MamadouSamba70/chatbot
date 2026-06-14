import React, { useState, useEffect } from 'react';
import centreLogo from '../assets/centre_informatique_logo.png';
import {
  Bot,
  Bell,
  Calendar,
  Shield,
  ArrowRight,
  Send,
  Users,
  UserCheck,
  Mic,
  CheckCircle,
  Clock,
  ListChecks,
  MessageSquare,
  GraduationCap,
  Sparkles
} from 'lucide-react';

const DEMO_RESPONSES = {
  'bonjour': "Bonjour ! Je suis ScolarBot, votre assistant académique du Centre Informatique UGANC. Comment puis-je vous aider ?",
  'salut': "Salut ! Je suis prêt à vous aider. Posez-moi une question sur vos examens, votre calendrier ou la liste des étudiants NTIC !",
  'etudiant': "📋 Voici les 3 premiers étudiants NTIC enregistrés :\n1. Barry Alpha (Mat: 20210045)\n2. Bah Mamadou (Mat: 20210062)\n3. Diallo Fatoumata (Mat: 20210078)\n... et 58 autres étudiants. Connectez-vous pour voir la liste complète !",
  'ntic': "Le département NTIC (Nouvelles Technologies de l'Information et de la Communication) compte 61 étudiants en L3 enregistrés dans notre base officielle. L'administrateur peut vérifier la liste via le chatbot avant de valider un compte.",
  'examen': "📅 Prochain examen : **Algorithmique** — Mardi 9 Juin à 09h00 en Salle 3. Voulez-vous programmer un rappel ?",
  'rappel': "🔔 Rappel configuré ! Vous recevrez une notification push et un e-mail 2 jours avant votre événement.",
  'valider': "L'administrateur peut poser des questions au chatbot comme : *« Est-ce que Barry Alpha est dans la liste NTIC ? »* avant de valider ou refuser un compte étudiant.",
  'aide': "Je peux vous aider à :\n• Consulter vos dates d'examens\n• Vérifier si un étudiant est dans la liste NTIC\n• Programmer des rappels automatiques\n• Poser des questions en vocal 🎤",
};

function getBotResponse(text) {
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "Ceci est une démo. Connectez-vous pour utiliser le vrai ScolarBot avec toutes ses fonctionnalités, y compris la vérification des étudiants NTIC !";
}

export default function LandingPage({ onGetStarted }) {
  const [demoChat, setDemoChat] = useState([
    { role: 'bot', text: "Bonjour ! Je suis ScolarBot 🎓 Votre assistant du Centre Informatique UGANC. Essayez : *« examen »*, *« ntic »*, *« etudiant »* ou *« rappel »* !" }
  ]);
  const [demoInput, setDemoInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDemoSend = (e) => {
    e.preventDefault();
    if (!demoInput.trim()) return;
    const userMsg = { role: 'user', text: demoInput };
    setDemoChat(prev => [...prev, userMsg]);
    setDemoInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setDemoChat(prev => [...prev, { role: 'bot', text: getBotResponse(userMsg.text) }]);
    }, 900);
  };

  const features = [
    {
      icon: <Bot size={26} />,
      cls: 'feat-bot',
      title: 'Assistant ScolarBot Style ChatGPT',
      desc: 'Discutez en langage naturel comme avec ChatGPT. Consultez vos examens, soutenances, et programmez des rappels en quelques mots.'
    },
    {
      icon: <Mic size={26} />,
      cls: 'feat-mic',
      title: 'Saisie Vocale Intégrée',
      desc: 'Dictez vos questions à voix haute. ScolarBot transcrit automatiquement votre message pour une expérience mains-libres complète.'
    },
    {
      icon: <UserCheck size={26} />,
      cls: 'feat-shield',
      title: 'Validation Administrative NTIC',
      desc: "L'administrateur consulte la liste officielle des 61 étudiants NTIC via le chatbot avant de valider tout nouveau compte étudiant."
    },
    {
      icon: <Bell size={26} />,
      cls: 'feat-bell',
      title: 'Alertes en Temps Réel',
      desc: 'Notifications push instantanées pour vos examens et soutenances. Les nouvelles alertes apparaissent directement dans le tableau de bord.'
    },
    {
      icon: <Calendar size={26} />,
      cls: 'feat-cal',
      title: 'Calendrier Académique Intégré',
      desc: 'Tableau de bord clair avec frise chronologique, filtres par type et par étudiant pour visualiser toutes les échéances officielles.'
    },
    {
      icon: <Shield size={26} />,
      cls: 'feat-shield2',
      title: 'Espaces Rôles Sécurisés',
      desc: "Comptes étudiants soumis à validation administrative. Seuls les étudiants figurant sur la liste officielle sont acceptés dans le système."
    }
  ];

  const steps = [
    { num: '1', title: "Inscription & Vérification", desc: "L'étudiant crée son compte. L'admin interroge ScolarBot pour confirmer qu'il figure dans la liste NTIC officielle." },
    { num: '2', title: "Validation Administrative", desc: "Après vérification, l'administrateur approuve le compte depuis la section « En attente » du tableau de bord." },
    { num: '3', title: "Planification des Rappels", desc: "L'étudiant configure ses alertes. Le planificateur surveille les échéances et envoie des rappels 2 jours à l'avance." },
    { num: '4', title: "Notifications Multi-canaux", desc: "Alertes push dans le navigateur et e-mails automatiques transmis sans intervention manuelle." }
  ];

  return (
    <div className="landing-wrapper">
      {/* Navigation Bar — Fixed */}
      <header className="landing-nav glass-panel">
        <div className="nav-logo">
          <img src={centreLogo} alt="Logo Centre Informatique" className="nav-uganc-logo" style={{ height: '34px', width: 'auto' }} />
          <span style={{ fontWeight: 700 }}>ReminderBot <span className="logo-badge">ScolarBot</span></span>
        </div>
        <nav className="nav-links-desktop">
          <a href="#features">Fonctionnalités</a>
          <a href="#demo">Démo</a>
          <a href="#workflow">Workflow</a>
          <a href="#stats">Indicateurs</a>
        </nav>
        <button className="btn-nav-login btn-primary" onClick={onGetStarted}>
          Accéder au Portail <ArrowRight size={16} />
        </button>
      </header>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ paddingTop: '60px' }}>
        <div className="hero-text">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(13,71,161,0.07)', border: '1px solid rgba(13,71,161,0.15)',
            borderRadius: '20px', padding: '6px 16px', marginBottom: '20px',
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent)'
          }}>
            <Sparkles size={14} /> Centre Informatique · UGANC · Conakry
          </div>
          <h1 className="serif-title" style={{ fontSize: '2.8rem', lineHeight: 1.2, marginBottom: '20px' }}>
            Gérez votre scolarité avec <span className="serif-italic">intelligence</span> et <span className="serif-italic">simplicité</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            Plateforme académique intelligente du Centre Informatique UGANC. Suivez vos examens, validez les étudiants NTIC et recevez des alertes en temps réel.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary btn-primary" onClick={onGetStarted} style={{ width: 'auto', padding: '14px 28px', fontSize: '1rem' }}>
              Accéder au Portail <ArrowRight size={18} />
            </button>
            <a href="#demo" className="btn-hero-secondary btn-secondary text-center" style={{ width: 'auto', padding: '14px 24px' }}>
              Voir la démo interactive
            </a>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
            {[
              { icon: <Users size={16} />, text: '61 étudiants NTIC L3' },
              { icon: <CheckCircle size={16} />, text: 'Validation sécurisée' },
              { icon: <Bell size={16} />, text: 'Alertes temps réel' },
              { icon: <Mic size={16} />, text: 'Saisie vocale' }
            ].map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.85rem', color: 'var(--text-secondary)',
                background: 'rgba(13,71,161,0.04)', border: '1px solid rgba(13,71,161,0.10)',
                borderRadius: '12px', padding: '6px 14px'
              }}>
                <span style={{ color: 'var(--color-accent)' }}>{b.icon}</span> {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ── */}
      <section id="demo" style={{ padding: '80px 20px', background: 'rgba(13,71,161,0.02)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="serif-title" style={{ fontSize: '2rem', marginBottom: '10px' }}>
              Essayez <span className="serif-italic">ScolarBot</span> maintenant
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Tapez : <strong>examen</strong>, <strong>ntic</strong>, <strong>etudiant</strong>, <strong>rappel</strong> ou <strong>aide</strong></p>
          </div>

          <div className="glass-panel" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(13,71,161,0.12)', boxShadow: '0 8px 40px rgba(13,71,161,0.08)' }}>
            {/* Chat header */}
            <div style={{ padding: '16px 20px', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>ScolarBot</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
                  Assistant du Centre Informatique UGANC
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div style={{ height: '340px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8f9fb' }}>
              {demoChat.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
                  {msg.role === 'bot' && (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Bot size={16} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? 'var(--color-accent)' : 'white',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    fontSize: '0.88rem', lineHeight: 1.6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: msg.role === 'bot' ? '1px solid rgba(13,71,161,0.08)' : 'none',
                    whiteSpace: 'pre-line'
                  }}>
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(13,71,161,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                      V
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Bot size={16} />
                  </div>
                  <div style={{ background: 'white', padding: '12px 18px', borderRadius: '18px 18px 18px 4px', border: '1px solid rgba(13,71,161,0.1)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 1, 2].map(d => (
                      <span key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-accent)', opacity: 0.5, animation: `typingDot 1.2s ${d * 0.2}s infinite ease-in-out` }}></span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(13,71,161,0.08)', background: 'white' }}>
              <form onSubmit={handleDemoSend} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Posez une question à ScolarBot…"
                  value={demoInput}
                  onChange={e => setDemoInput(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: '25px', border: '1.5px solid rgba(13,71,161,0.15)',
                    outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit', background: '#f8f9fb',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(13,71,161,0.15)'}
                />
                <button type="submit" style={{ padding: '10px 18px', background: 'var(--color-accent)', border: 'none', borderRadius: '25px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                  <Send size={15} /> Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="serif-title">Toutes les <span className="serif-italic">fonctionnalités</span> en un seul endroit</h2>
          <p>Un écosystème complet conçu pour les étudiants du Centre Informatique et les administrateurs UGANC.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className={`feature-card glass-panel`}>
              <div className={`feat-icon-wrapper ${f.cls}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="stats-section">
        <div className="stats-container glass-panel">
          {[
            { val: '61', label: 'Étudiants NTIC L3 référencés' },
            { val: '< 2s', label: 'Temps de réponse du chatbot' },
            { val: '100%', label: 'Comptes validés par l\'admin' },
            { val: '24h/7', label: 'Accès continu aux plannings' }
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <div className="stat-item">
                <h3>{s.val}</h3>
                <p>{s.label}</p>
              </div>
              {i < arr.length - 1 && <div className="stat-line"></div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section id="workflow" className="arch-section">
        <div className="section-header">
          <h2 className="serif-title">Comment fonctionne <span className="serif-italic">le système</span> ?</h2>
          <p>Du compte étudiant à la notification automatique — voici le parcours complet.</p>
        </div>
        <div className="arch-flow glass-panel">
          {steps.map((s, i, arr) => (
            <React.Fragment key={i}>
              <div className="flow-step">
                <div className="step-num">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
              {i < arr.length - 1 && <div className="flow-arrow">➜</div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-card glass-panel" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <img src={centreLogo} alt="Centre Informatique" style={{ height: '52px', width: 'auto' }} />
          </div>
          <h2 className="serif-title">Prêt à rejoindre la <span className="serif-italic">plateforme ?</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '500px', margin: '12px auto 28px' }}>
            Créez votre compte étudiant NTIC ou connectez-vous en tant qu'administrateur pour gérer les validations et les alertes en temps réel.
          </p>
          <button className="btn-primary btn-cta" onClick={onGetStarted} style={{ width: 'auto', padding: '14px 32px', margin: '0 auto', fontSize: '1rem' }}>
            Accéder au Portail <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          <img src={centreLogo} alt="Centre Informatique" style={{ height: '24px', width: 'auto', opacity: 0.6 }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>ReminderBot · ScolarBot</span>
        </div>
        <p>© 2026 Université Gamal Abdel Nasser de Conakry. Tous droits réservés.</p>
        <p className="footer-credits">Développé par le Centre Informatique pour la communauté académique NTIC &amp; Centre Informatique.</p>
      </footer>
    </div>
  );
}
