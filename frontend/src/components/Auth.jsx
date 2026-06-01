import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, GraduationCap, School, BookOpen, UserCheck, ArrowLeft } from 'lucide-react';

export default function Auth({ onLoginSuccess, backendUrl, onBackToLanding }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Login credentials
  const [loginMatricule, setLoginMatricule] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration credentials
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [matricule, setMatricule] = useState('');
  const [sexe, setSexe] = useState('M');
  const [universite, setUniversite] = useState('');
  const [faculte, setFaculte] = useState('');
  const [departement, setDepartement] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // Under the hood, login uses 'username' representing the matricule
        const response = await axios.post(`${backendUrl}/api/auth/login/`, {
          username: loginMatricule.trim(),
          password: loginPassword
        });
        const { access, refresh, is_staff, username: resolvedUsername } = response.data;
        onLoginSuccess(access, refresh, resolvedUsername, is_staff);
      } else {
        // Registering with all student profile fields
        await axios.post(`${backendUrl}/api/auth/register/`, {
          email: email.trim(),
          nom: nom.trim(),
          prenom: prenom.trim(),
          matricule: matricule.trim(),
          sexe,
          universite: universite.trim(),
          faculte: faculte.trim(),
          departement: departement.trim(),
          password
        });
        
        setSuccessMsg(`Compte étudiant avec le matricule "${matricule.trim()}" créé avec succès ! Connectez-vous.`);
        setIsLogin(true);
        setLoginMatricule(matricule.trim());
        setLoginPassword('');
        
        // Reset registration fields
        setEmail('');
        setNom('');
        setPrenom('');
        setMatricule('');
        setSexe('M');
        setUniversite('');
        setFaculte('');
        setDepartement('');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.detail) {
          setError(data.detail);
        } else {
          const msgs = Object.keys(data).map(k => `${k} : ${Array.isArray(data[k]) ? data[k].join(' ') : data[k]}`);
          setError(msgs.join(' — '));
        }
      } else {
        setError("Impossible de contacter le serveur. Assurez-vous que le backend Django est lancé.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel" style={{ maxWidth: isLogin ? '450px' : '650px' }}>
        <button type="button" className="btn-back-home" onClick={onBackToLanding}>
          <ArrowLeft size={16} /> Retour à l'accueil
        </button>
        <div className="auth-header" style={{ marginTop: '20px' }}>
          <h1>🎓 ReminderBot</h1>
          <p>{isLogin ? 'Connectez-vous à votre espace étudiant ou admin' : 'Inscrivez-vous pour créer votre compte étudiant'}</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', color: '#f87171', fontSize: '0.88rem', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '8px', color: '#34d399', fontSize: '0.88rem', marginBottom: '20px' }}>
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isLogin ? (
            /* Login Form */
            <>
              <div className="form-group">
                <label className="form-label">Identifiant / Matricule</label>
                <div className="input-wrapper">
                  <span className="input-icon"><UserIcon size={18} /></span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: admin ou votre Matricule" 
                    value={loginMatricule} 
                    onChange={e => setLoginMatricule(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={18} /></span>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </>
          ) : (
            /* Registration Form with fields grouped into two columns */
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><UserIcon size={18} /></span>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="DIALLO" 
                      value={nom} 
                      onChange={e => setNom(e.target.value)} 
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
                      value={prenom} 
                      onChange={e => setPrenom(e.target.value)} 
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
                      value={matricule} 
                      onChange={e => setMatricule(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sexe</label>
                  <select 
                    className="form-input" 
                    style={{ paddingLeft: '16px' }}
                    value={sexe} 
                    onChange={e => setSexe(e.target.value)}
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
                      placeholder="Ex: Université de Conakry" 
                      value={universite} 
                      onChange={e => setUniversite(e.target.value)} 
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
                      placeholder="Ex: Faculté des Sciences" 
                      value={faculte} 
                      onChange={e => setFaculte(e.target.value)} 
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
                      value={departement} 
                      onChange={e => setDepartement(e.target.value)} 
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
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Lock size={18} /></span>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Définissez un mot de passe sécurisé" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
              : isLogin ? <><LogIn size={18} /> Se connecter</> : <><UserPlus size={18} /> S'inscrire</>}
          </button>
        </form>

        {isLogin && (
          <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            👑 Admin : <strong style={{ color: 'var(--text-secondary)' }}>admin</strong> / <strong style={{ color: 'var(--text-secondary)' }}>adminpassword</strong>
          </div>
        )}

        <div className="auth-toggle">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button type="button" className="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}>
            {isLogin ? "Créer un compte étudiant" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
