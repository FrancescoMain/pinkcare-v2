import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DoctorsApi from '../../../../services/doctorsApi';

/**
 * DoctorDetail - Componente per visualizzare i dettagli completi del medico/clinica
 * Mostra tutte le informazioni dettagliate inclusi esami e patologie trattate
 */
const DoctorDetail = ({ doctorId, onBack }) => {
  const { t } = useTranslation();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await DoctorsApi.getById(doctorId);
        setDoctor(data);
      } catch (err) {
        console.error('Error fetching doctor details:', err);
        setError(err.message || 'Errore nel caricamento dei dettagli');
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  // Costruisci URL Google Maps
  const getGoogleMapsUrl = () => {
    if (doctor?.address?.latitude && doctor?.address?.longitude) {
      return `https://www.google.com/maps/place/${doctor.address.latitude},${doctor.address.longitude}`;
    }
    if (doctor?.address?.full) {
      return `https://www.google.com/maps/place/${encodeURIComponent(doctor.address.full)}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="ui-block doctor-detail">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <span>{t('resourceBundle.Loading', 'Caricamento...')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-block doctor-detail">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button className="btn btn-secondary" onClick={onBack}>
            {t('resourceBundle.Back', 'Indietro')}
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  const googleMapsUrl = getGoogleMapsUrl();
  const avatarUrl = doctor.logo || '/styles/olympus/assets/images/avatar.jpg';

  return (
    <div className="doctor-detail">
      {/* Pulsante Indietro */}
      <div className="detail-header">
        <button className="btn btn-back" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          {t('resourceBundle.Back_to_list', 'Torna alla lista')}
        </button>
      </div>

      {/* Card principale */}
      <div className="ui-block">
        <div className="post detail-card">
          <div className="row">
            {/* Avatar e info base */}
            <div className="col col-md-3 col-sm-12">
              <div className="detail-avatar-section">
                <div className="circle_doc large">
                  <img
                    src={avatarUrl}
                    alt={doctor.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/styles/olympus/assets/images/avatar.jpg';
                    }}
                  />
                </div>
                <h3 className="doctor-name">{doctor.name}</h3>
                <span className="doctor-type">{doctor.type}</span>
                {doctor.medicalTitle && (
                  <span className="medical-title">{doctor.medicalTitle}</span>
                )}
              </div>
            </div>

            {/* Info dettagliate */}
            <div className="col col-md-9 col-sm-12">
              <div className="detail-info-section">
                {/* Descrizione */}
                {doctor.description && (
                  <div className="info-block">
                    <h5>{t('resourceBundle.Description', 'Descrizione')}</h5>
                    <p>{doctor.description}</p>
                  </div>
                )}

                {/* Contatti */}
                <div className="info-block contacts-block">
                  <h5>{t('resourceBundle.Contacts', 'Contatti')}</h5>
                  <div className="contacts-grid">
                    {doctor.email && (
                      <div className="contact-item">
                        <i className="fas fa-envelope"></i>
                        <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
                      </div>
                    )}
                    {doctor.landlinePhone && (
                      <div className="contact-item">
                        <i className="fas fa-phone"></i>
                        <a href={`tel:${doctor.landlinePhone}`}>{doctor.landlinePhone}</a>
                      </div>
                    )}
                    {doctor.mobilePhone && (
                      <div className="contact-item">
                        <i className="fas fa-mobile-alt"></i>
                        <a href={`tel:${doctor.mobilePhone}`}>{doctor.mobilePhone}</a>
                      </div>
                    )}
                    {doctor.fax && (
                      <div className="contact-item">
                        <i className="fas fa-fax"></i>
                        <span>{doctor.fax}</span>
                      </div>
                    )}
                    {doctor.website && (
                      <div className="contact-item">
                        <i className="fas fa-globe"></i>
                        <a href={doctor.website} target="_blank" rel="noopener noreferrer">
                          {doctor.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Indirizzo */}
                {doctor.address?.full && (
                  <div className="info-block address-block">
                    <h5>{t('resourceBundle.Address', 'Indirizzo')}</h5>
                    <div className="address-content">
                      <i className="fas fa-map-marker-alt"></i>
                      {googleMapsUrl ? (
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                          {doctor.address.full}
                        </a>
                      ) : (
                        <span>{doctor.address.full}</span>
                      )}
                    </div>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-maps"
                      >
                        <i className="fas fa-directions"></i>
                        {t('resourceBundle.Open_in_maps', 'Apri in Google Maps')}
                      </a>
                    )}
                  </div>
                )}

                {/* Pubblicazioni mediche */}
                {doctor.medicalPublications && (
                  <div className="info-block">
                    <h5>{t('resourceBundle.Medical_publications', 'Pubblicazioni mediche')}</h5>
                    <p>{doctor.medicalPublications}</p>
                  </div>
                )}

                {/* Strumentazione */}
                {doctor.instrumentation && (
                  <div className="info-block">
                    <h5>{t('resourceBundle.Instrumentation', 'Strumentazione')}</h5>
                    <p>{doctor.instrumentation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Esami offerti */}
      {doctor.examinations && doctor.examinations.length > 0 && (
        <div className="ui-block">
          <div className="ui-block-title">
            <h5>{t('resourceBundle.Examinations_offered', 'Esami offerti')}</h5>
          </div>
          <div className="ui-block-content">
            <div className="tags-list">
              {doctor.examinations.map((exam) => (
                <span key={exam.id} className="tag examination-tag">
                  {exam.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patologie trattate */}
      {doctor.pathologies && doctor.pathologies.length > 0 && (
        <div className="ui-block">
          <div className="ui-block-title">
            <h5>{t('resourceBundle.Pathologies_treated', 'Patologie trattate')}</h5>
          </div>
          <div className="ui-block-content">
            <div className="tags-list">
              {doctor.pathologies.map((path) => (
                <span key={path.id} className="tag pathology-tag">
                  {path.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shop link */}
      {doctor.shopLink && (
        <div className="ui-block shop-block">
          <a
            href={doctor.shopLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-shop"
          >
            <i className="fas fa-shopping-cart"></i>
            {t('resourceBundle.Visit_shop', 'Visita lo shop')}
          </a>
        </div>
      )}
    </div>
  );
};

export default DoctorDetail;
