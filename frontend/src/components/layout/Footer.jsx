import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Main Footer Section - exact match of standard_public.xhtml */}
      <div className="foot">
        <div className="container">
          <div className="row list_link">
            {/* Information Links Section - exactly as in original */}
            <div className="col-md-6 col-sm-4 col-xs-12">
              <Link to="/public">{t('standard_public.home', 'HOME')}</Link>
              <Link to="/public?tab=about_us">{t('standard_public.about_us', 'CHI SIAMO')}</Link>
              <Link to="/public?tab=blog_list">{t('standard_public.blog', 'BLOG')}</Link>
              <Link to="/public?tab=accreditation_pinkcare">{t('standard_public.pinkcare_accreditation', 'ACCREDITAMENTO PINKCARE')}</Link>
              
              <ul style={{ listStyleType: 'none', marginTop: '10px', paddingLeft: '0' }}>
                <li>
                  <a href="mailto:info@pinkcare.it">
                    <i className="fas fa-envelope"></i> info@pinkcare.it
                  </a>
                </li>
                <li>
                  <a href="#">
                    <i className="fas fa-map-marker"></i> Piazza Stazione, 2 50123 Firenze
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <footer>
        <div className="copyright">
          <div className="container clearfix">
            <p className="pull-left">
              {t('standard_public.designed_by', 'Designed By')} <a href="http://www.t1srl.it/">TiOne Technology Srl</a>
            </p>
            <p className="pull-right">
              <Link to="/public?tab=general_policy" target="_blank">Privacy policy</Link>
            </p>
          </div>
        </div>
      </footer>

      {/* Back To Top Button */}
      <div id="back-to-top">
        <a href="#"><i className="fas fa-arrow-up"></i></a>
      </div>
    </>
  );
};

export default Footer;