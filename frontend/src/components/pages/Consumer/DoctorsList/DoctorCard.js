import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';

/**
 * DoctorCard - REPLICA del layout legacy business_list.xhtml
 * Layout:
 * - Avatar a sinistra
 * - Nome medico (dal representative) grande
 * - Riga info: distanza | indirizzo | email | "Hai un codice?"
 */
const DoctorCard = ({
  doctor,
  cityName,
  onViewDetails,
  onAuthorize
}) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  // Estrae i nomi dei ruoli dall'array di oggetti ruolo
  const getRoleNames = () => {
    if (!user?.roles || !Array.isArray(user.roles)) return [];
    return user.roles.map(role => {
      // Gestisce sia oggetti {nome: 'ROLE_X'} che stringhe 'ROLE_X'
      if (typeof role === 'string') return role;
      return role.nome || role.name || '';
    });
  };

  const roleNames = getRoleNames();
  const isConsumer = roleNames.includes('ROLE_CONSUMER') || roleNames.includes('ROLE_PINKCARE');

  // URL Google Maps
  const getGoogleMapsUrl = () => {
    if (doctor.address?.latitude && doctor.address?.longitude) {
      return `https://www.google.com/maps/place/${doctor.address.latitude},${doctor.address.longitude}`;
    }
    if (doctor.address?.full) {
      return `https://www.google.com/maps/place/${encodeURIComponent(doctor.address.full)}`;
    }
    return null;
  };

  // Messaggio distanza - mostra sempre come nel legacy
  const getDistanceMessage = () => {
    const km = doctor.distance !== null && doctor.distance !== undefined
      ? Math.floor(doctor.distance)
      : 0;

    if (cityName) {
      return `${km} km ${t('resourceBundle.from_the_center_of', 'dal centro di')} ${cityName}`;
    }
    return `${km} km ${t('resourceBundle.from_your_home', 'da casa tua')}`;
  };

  // Costruisce l'indirizzo completo con Via/Strada
  const getFullAddress = () => {
    const parts = [];

    // Aggiungi Via/Strada/etc
    if (doctor.address?.streetType) {
      parts.push(doctor.address.streetType);
    }

    if (doctor.address?.street) {
      parts.push(doctor.address.street);
    }

    if (doctor.address?.streetNumber) {
      parts.push(doctor.address.streetNumber);
    }

    const streetPart = parts.join(' ');

    // Location
    const locationParts = [];
    if (doctor.address?.postCode) {
      locationParts.push(doctor.address.postCode);
    }
    if (doctor.address?.municipality) {
      locationParts.push(doctor.address.municipality.toUpperCase());
    }
    if (doctor.address?.province) {
      locationParts.push(`(${doctor.address.province})`);
    }

    const locationPart = locationParts.join(' ');

    if (streetPart && locationPart) {
      return `${streetPart}, ${locationPart}`;
    }
    return streetPart || locationPart || doctor.address?.full || null;
  };

  // Nome da mostrare: preferisce representative.fullName, poi name, poi teamName
  const getDisplayName = () => {
    if (doctor.representative?.fullName) {
      return doctor.representative.fullName;
    }
    if (doctor.name && doctor.name !== 'N/A') {
      return doctor.name;
    }
    return doctor.teamName || 'N/A';
  };

  // Avatar URL
  const avatarUrl = doctor.logo || '/styles/olympus/assets/images/avatar.jpg';
  const googleMapsUrl = getGoogleMapsUrl();
  const distanceMessage = getDistanceMessage();
  const fullAddress = getFullAddress();
  const displayName = getDisplayName();

  return (
    <div className="ui-block doctor-card">
      <div className="doctor-card-inner">
        {/* Avatar a sinistra */}
        <div className="doctor-avatar">
          <div className="avatar-circle">
            <img
              src={avatarUrl}
              alt={displayName}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/styles/olympus/assets/images/avatar.jpg';
              }}
            />
          </div>
        </div>

        {/* Contenuto */}
        <div className="doctor-content">
          {/* Nome medico grande */}
          <div className="doctor-name-row">
            {isAuthenticated && isConsumer ? (
              <button
                type="button"
                className="doctor-name-link"
                onClick={() => onViewDetails(doctor.id)}
              >
                {displayName}
              </button>
            ) : (
              <span className="doctor-name">{displayName}</span>
            )}
          </div>

          {/* Riga info orizzontale */}
          <div className="doctor-info-row">
            {/* Distanza - sempre visibile come nel legacy */}
            <div className="info-item">
              <i className="fas fa-map-marked-alt"></i>
              {isAuthenticated && isConsumer ? (
                <button
                  type="button"
                  className="info-link"
                  onClick={() => onViewDetails(doctor.id)}
                >
                  {distanceMessage}
                </button>
              ) : (
                <span>{distanceMessage}</span>
              )}
            </div>

            {/* Indirizzo */}
            {fullAddress && (
              <div className="info-item">
                <i className="fas fa-map-marker-alt"></i>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {fullAddress}
                </a>
              </div>
            )}

            {/* Email */}
            {doctor.email && (
              <div className="info-item">
                <i className="fas fa-envelope"></i>
                <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
              </div>
            )}

            {/* Telefono */}
            {doctor.phone && (
              <div className="info-item">
                <i className="fas fa-phone"></i>
                <a href={`tel:${doctor.phone}`}>{doctor.phone}</a>
              </div>
            )}

            {/* "Hai un codice?" - sempre visibile per consumer autenticati */}
            {isAuthenticated && isConsumer && (
              <div className="info-item has-code-item">
                <i className="fas fa-external-link-alt"></i>
                <button
                  type="button"
                  className="code-link"
                  onClick={() => onAuthorize && onAuthorize(doctor)}
                >
                  {t('resourceBundle.hasCode', 'Hai un codice ?')}
                </button>
              </div>
            )}

            {/* Shop link - per utenti non consumer */}
            {(!isAuthenticated || !isConsumer) && doctor.shopLink && (
              <div className="info-item">
                <i className="fas fa-shopping-cart"></i>
                <a
                  href={doctor.shopLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Shop
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
