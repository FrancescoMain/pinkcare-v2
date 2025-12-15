import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ScheduleApi from '../../services/scheduleApi';
import ApiService from '../../services/apiService';
import { toast } from 'react-toastify';
import './UserProfileSidebar.css';

/**
 * UserProfileSidebar - REPLICA ESATTA della sidebar sinistra del legacy (ProfileEdit)
 * Componente riutilizzabile per tutte le pagine consumer
 */
const UserProfileSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [monthlyEvents, setMonthlyEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch eventi del mese corrente
  useEffect(() => {
    const fetchMonthlyEvents = async () => {
      try {
        setEventsLoading(true);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const response = await ScheduleApi.getEvents(
          formatDate(startOfMonth),
          formatDate(endOfMonth)
        );
        setMonthlyEvents(response.events || []);
      } catch (error) {
        console.error('Error fetching monthly events:', error);
        setMonthlyEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchMonthlyEvents();
  }, []);

  // Fetch profile image
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await ApiService.get('/api/users/profile-image');
        if (response?.logo) {
          setProfileImage(response.logo);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      }
    };

    fetchProfileImage();
  }, []);

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine valido');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Immagine troppo grande. Dimensione massima: 2MB');
      return;
    }

    try {
      setUploadingImage(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;

          const response = await ApiService.post('/api/users/profile-image', {
            image: base64Image
          });

          if (response?.logo) {
            setProfileImage(response.logo);
            toast.success('Immagine profilo aggiornata!');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error(error.message || 'Errore nel caricamento immagine');
        } finally {
          setUploadingImage(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Errore nella lettura del file');
      setUploadingImage(false);
    }

    // Reset input
    event.target.value = '';
  };

  // Trigger file input click
  const handleAvatarClick = () => {
    if (!uploadingImage) {
      fileInputRef.current?.click();
    }
  };

  // Calcola età
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calcola BMI (IBM = Indice di Massa Corporea)
  const calculateBMI = (weight, height) => {
    if (!weight || !height || height <= 0) return null;
    // height è in cm, convertiamo in metri
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  // Descrizione BMI basata sul valore - REPLICA ESATTA del legacy
  // Soglie: <18.5 Sottopeso, 18.5-24.99 Normopeso, 25-29.99 Sovrappeso, >=30 Obesità
  const getBMIDescription = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return t('resourceBundle.Underweight', 'Sottopeso');
    if (bmi < 25) return t('resourceBundle.Normal_weight', 'Normopeso');
    if (bmi < 30) return t('resourceBundle.Overweight', 'Sovrappeso');
    return t('resourceBundle.Obese', 'Obesità');
  };

  // Capitalizza prima lettera
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const userAge = user?.birthday ? calculateAge(user.birthday) : null;
  // Arrotondiamo a 2 decimali per coerenza tra display e classificazione
  const rawBMI = calculateBMI(user?.weight, user?.height);
  const userBMI = rawBMI ? Math.round(rawBMI * 100) / 100 : null;

  const handleModificaStoriaClinica = () => {
    // Naviga a Consumer tab=0 (Storia Clinica)
    navigate('/consumer?tab=0');
  };

  const handleCalcolaDataParto = () => {
    // TODO: Implementare calcolo data parto (calendario mestruale?)
    navigate('/consumer?tab=5');
  };

  return (
    <div className="ui-block">
      {/* User Card - REPLICA ESATTA del legacy top-header-author */}
      <div className="top-header-author">
        {/* Avatar centrato come legacy - con icona per cambio foto */}
        <div className="widget-thumb author-thumb" onClick={handleAvatarClick}>
          <div className="avatar-container">
            <img
              src={profileImage || "/styles/olympus/assets/images/avatar.jpg"}
              alt="author"
              className="user_img"
            />
            <div className={`avatar-overlay ${uploadingImage ? 'uploading' : ''}`}>
              {uploadingImage ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-camera"></i>
              )}
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        {/* Nome e età come legacy */}
        <div className="user_info">
          <span className="h4 name">
            {capitalize(user?.name) || ''} {capitalize(user?.surname) || ''}
          </span>
          {userAge && (
            <p>ETA: <strong>{userAge} ANNI</strong></p>
          )}
        </div>
      </div>

      {/* Pulsante Modifica Storia Clinica - REPLICA ESATTA del legacy edit_anagraphic */}
      <div className="edit_anagraphic" onClick={handleModificaStoriaClinica}>
        <span>Modifica storia clinica</span>
      </div>

      {/* Eventi del mese - REPLICA ESATTA del legacy */}
      <div className="widget w-build-fav btn-wid">
        <div className="widget-thumb sched_list">
          <h6 style={{ borderBottom: '1px solid #ddd' }}>Eventi del mese</h6>
          {eventsLoading ? (
            <div className="events-loading">
              <span>Caricamento...</span>
            </div>
          ) : monthlyEvents.length === 0 ? (
            <div className="nothing-found">
              <span>No records found.</span>
            </div>
          ) : (
            <ul className="monthly-events-list">
              {monthlyEvents.slice(0, 5).map((event, index) => (
                <li key={event.id || index} className="monthly-event-item">
                  <span className="event-date">
                    {new Date(event.start).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short'
                    })}
                    <span className="event-time">
                      {new Date(event.start).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </span>
                  <span className="event-title" title={event.title}>
                    {event.title}
                  </span>
                  <span
                    className="event-color-dot"
                    style={{
                      backgroundColor: event.color?.includes('red') ? '#E12417' :
                        event.color?.includes('orange') ? '#E18A17' :
                        event.color?.includes('yellow') ? '#E1D817' :
                        event.color?.includes('green') ? '#21CD24' :
                        event.color?.includes('aquamarine') ? '#17E19E' :
                        event.color?.includes('turquoise') ? '#17D7E1' :
                        event.color?.includes('purple') ? (event.color?.includes('red-purple') ? '#8e24aa' : '#E117D4') :
                        event.color?.includes('lavander') ? '#7986cb' :
                        '#176FE1'
                    }}
                  ></span>
                </li>
              ))}
              {monthlyEvents.length > 5 && (
                <li className="monthly-event-more">
                  +{monthlyEvents.length - 5} altri eventi
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* IBM (BMI) - REPLICA ESATTA del legacy: mostrato solo se peso e altezza sono presenti */}
      {userBMI && userBMI > 0 && (
        <div className="ui-block">
          <div className="widget w-build-fav bmi-widget">
            <div className="ibm">
              <h4>{t('resourceBundle.Your_bmi_label', 'Il tuo indice di massa corporea è')}:</h4>
              <div className="bmi-value-container">
                <h3 className="bmi-value">{userBMI.toFixed(2)}</h3>
                <i className="fas fa-info-circle bmi-info-icon"></i>
                <span className="bmi-tooltip">
                  {t('resourceBundle.bmi_info', 'È un indice che ti aiuta a capire se il tuo peso è nella norma')}
                </span>
              </div>
              <h3 className="bmi-description">{getBMIDescription(userBMI)}</h3>
              <button
                className="btn btn-xs bg-outline-w"
                onClick={handleModificaStoriaClinica}
              >
                {t('resourceBundle.Recalculate', 'Ricalcola')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulsante Calcola Data Parto - REPLICA ESATTA del legacy */}
      <div className="widget w-build-fav btn-wid calcola-parto" onClick={handleCalcolaDataParto}>
        <div className="ibm">
          <h4>Calcola data parto</h4>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSidebar;
