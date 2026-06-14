import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, GraduationCap, School, BookOpen, UserCheck, ArrowLeft, Phone } from 'lucide-react';
import ugancLogo from '../assets/uganc_logo.png';
import centreLogo from '../assets/centre_informatique_logo.png';
import ugancHero from '../assets/uganc_hero.png';

const DEPARTMENTS_BY_FACULTY = {
  "La Faculté des Sciences et Techniques de la Santé (FSTS)": [
    "Département de Médecine",
    "Département de Pharmacie",
    "Département d'Odontostomatologie",
    "Département des Sciences Fondamentales et Hospitalières"
  ],
  "La Faculté des Sciences": [
    "Département de Biologie",
    "Département de Chimie",
    "Département de Mathématiques",
    "Département de Physique"
  ],
  "L'Institut Polytechnique de Conakry (IPC)": [
    "Département de Génie Civil",
    "Département de Génie Électrique",
    "Département de Génie Mécanique",
    "Département de Génie Chimique / Génie des Procédés",
    "Département d'Informatique",
    "Département des Télécommunications",
    "Département de Génie Industriel et Maintenance"
  ],
  "L'Institut des Chemins de Fer": [
    "Département de Gestion et Logistique des Transports Ferroviaires",
    "Département de Maintenance du Matériel Roulant"
  ],
  "Le Centre Informatique": [
    "Département des Technologies de l'Information et Développement Web",
    "NTIC",
    "DL"
  ]
};

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
  const [telephone, setTelephone] = useState('');
  const [niveauLicence, setNiveauLicence] = useState('Licence 1');
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
          telephone: telephone.trim(),
          niveau_licence: niveauLicence,
          password
        });
        
        setSuccessMsg(`Compte étudiant créé avec succès ! Votre compte est en attente de validation par l'administrateur avant de pouvoir vous connecter.`);
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
        setTelephone('');
        setNiveauLicence('Licence 1');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.detail) {
          if (data.detail === "No active account found with the given credentials") {
            setError("Matricule/Mot de passe incorrect ou compte en attente de validation par l'administrateur.");
          } else {
            setError(data.detail);
          }
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
      {/* Left panel: Heritage UGANC */}
      <div className="auth-heritage-panel">
        <img src={ugancHero} alt="Fresque UGANC" className="auth-heritage-bg" />
        <div className="auth-heritage-overlay"></div>
        <div className="auth-heritage-content">
          <div className="auth-heritage-tag">Université Gamal Abdel Nasser</div>
          <h2 className="auth-heritage-title">
            Bâtir l'avenir par la <span className="serif-italic">science</span> et le <span className="serif-italic">savoir</span>
          </h2>
          <p className="auth-heritage-quote">
            "Le portail d'organisation académique intelligent conçu pour accompagner votre réussite au quotidien."
          </p>
          <div className="auth-heritage-footer">
            Centre Informatique UGANC &copy; 2026
          </div>
        </div>
      </div>

      {/* Right panel: Connection Form */}
      <div className="auth-form-panel">
        <div className="auth-card glass-panel" style={{ maxWidth: isLogin ? '480px' : '600px' }}>
          <button type="button" className="btn-back-home" onClick={onBackToLanding}>
            <ArrowLeft size={16} /> Retour à l'accueil
          </button>
          <div className="auth-header" style={{ marginTop: '20px' }}>
            <div className="auth-logos-container">
              <img src={centreLogo} alt="Logo Centre Informatique" className="auth-centre-logo" />
            </div>
            <h1>ReminderBot</h1>
            <p>{isLogin ? 'Connectez-vous à votre espace étudiant ou admin' : 'Inscrivez-vous pour créer votre compte étudiant'}</p>
          </div>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(214,90,98,0.12)', border: '1px solid rgba(214,90,98,0.35)', borderRadius: '8px', color: '#f87171', fontSize: '0.88rem', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div style={{ padding: '12px', background: 'rgba(63,159,127,0.12)', border: '1px solid rgba(63,159,127,0.35)', borderRadius: '8px', color: '#34d399', fontSize: '0.88rem', marginBottom: '20px' }}>
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
                    <select 
                      className="form-input" 
                      style={{ paddingLeft: '16px' }}
                      value={faculte} 
                      onChange={e => {
                        setFaculte(e.target.value);
                        setDepartement('');
                      }} 
                      required 
                    >
                      <option value="">Sélectionnez votre faculté</option>
                      <option value="La Faculté des Sciences et Techniques de la Santé (FSTS)">La Faculté des Sciences et Techniques de la Santé (FSTS)</option>
                      <option value="La Faculté des Sciences">La Faculté des Sciences</option>
                      <option value="L'Institut Polytechnique de Conakry (IPC)">L'Institut Polytechnique de Conakry (IPC)</option>
                      <option value="L'Institut des Chemins de Fer">L'Institut des Chemins de Fer</option>
                      <option value="Le Centre Informatique">Le Centre Informatique</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Département</label>
                    <select 
                      className="form-input" 
                      style={{ paddingLeft: '16px' }}
                      value={departement} 
                      onChange={e => {
                        const val = e.target.value;
                        setDepartement(val);
                        if (val && !faculte) {
                          const foundFaculty = Object.keys(DEPARTMENTS_BY_FACULTY).find(key => 
                            DEPARTMENTS_BY_FACULTY[key].includes(val)
                          );
                          if (foundFaculty) {
                            setFaculte(foundFaculty);
                          }
                        }
                      }} 
                      required 
                    >
                      <option value="">Sélectionnez votre département</option>
                      {faculte ? (
                        DEPARTMENTS_BY_FACULTY[faculte]?.map((dept, idx) => (
                          <option key={idx} value={dept}>{dept}</option>
                        ))
                      ) : (
                        Object.entries(DEPARTMENTS_BY_FACULTY).map(([facName, depts]) => (
                          <optgroup key={facName} label={facName}>
                            {depts.map((dept, idx) => (
                              <option key={idx} value={dept}>{dept}</option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </select>
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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Numéro de téléphone</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><Phone size={18} /></span>
                      <input 
                        type="tel" 
                        className="form-input" 
                        placeholder="Ex: +224 622 00 00 00" 
                        value={telephone} 
                        onChange={e => setTelephone(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Niveau de licence</label>
                    <select 
                      className="form-input" 
                      style={{ paddingLeft: '16px' }}
                      value={niveauLicence} 
                      onChange={e => setNiveauLicence(e.target.value)}
                    >
                      <option value="Licence 1">Licence 1</option>
                      <option value="Licence 2">Licence 2</option>
                      <option value="Licence 3">Licence 3</option>
                      <option value="Licence 4">Licence 4</option>
                    </select>
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



          <div className="auth-toggle">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            <button type="button" className="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}>
              {isLogin ? "Créer un compte étudiant" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
