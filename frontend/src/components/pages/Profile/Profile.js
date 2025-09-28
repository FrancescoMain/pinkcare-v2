import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login?page=authentication');
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'ADMIN': return 'Amministratore';
      case 'DOCTOR': return 'Medico';
      case 'CLINIC': return 'Clinica';
      case 'USER': return 'Utente';
      default: return role;
    }
  };

  return (
    <div className="profile-page">
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Profilo Utente</h4>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label"><strong>Nome:</strong></label>
                      <p className="form-control-plaintext">{user?.name || 'Non specificato'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label"><strong>Cognome:</strong></label>
                      <p className="form-control-plaintext">{user?.surname || 'Non specificato'}</p>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label"><strong>Email:</strong></label>
                      <p className="form-control-plaintext">{user?.email}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label"><strong>Ruolo:</strong></label>
                      <p className="form-control-plaintext">
                        <span className={`badge bg-${user?.role === 'ADMIN' ? 'danger' : 'primary'}`}>
                          {getRoleLabel(user?.role)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {user?.role === 'DOCTOR' && (
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label"><strong>Specializzazione:</strong></label>
                        <p className="form-control-plaintext">{user?.medicalTitle || 'Non specificata'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label"><strong>Data registrazione:</strong></label>
                      <p className="form-control-plaintext">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'Non disponibile'}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label"><strong>Ultimo accesso:</strong></label>
                      <p className="form-control-plaintext">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('it-IT') : 'Non disponibile'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <h6>Benvenuto in PinkCare!</h6>
                  <p className="mb-0">
                    Questa è una pagina protetta accessibile solo dopo il login.
                    Stai visualizzando le informazioni del tuo profilo utente.
                  </p>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button className="btn btn-primary" disabled>
                    Modifica Profilo
                  </button>
                  <button className="btn btn-outline-secondary" disabled>
                    Impostazioni
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button
                      className="btn btn-warning"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      Pannello Admin
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;