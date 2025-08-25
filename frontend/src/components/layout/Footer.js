import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Main Footer Section */}
      <div className="foot">
        <div className="container">
          <div className="row list_link">
            {/* Doctor Registration Section */}
            <div className="col-md-6 col-sm-4 col-xs-12" style={{ textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>{t('standard_public.are_you_a_doctor')}</h3>
              <h4>{t('standard_public.find_out_how')}</h4>
              <a href="/login?page=register_business" className="btn btn-secondary" style={{ marginBottom: '10px' }}>
                {t('standard_public.register')}
              </a>
            </div>

            {/* Information Links Section */}
            <div className="col-md-6 col-sm-4 col-xs-12">
              <a href="/public">{t('standard_public.home')}</a>
              <a href="/public?tab=about_us">{t('standard_public.about_us')}</a>
              <a href="/public?tab=blog_list">{t('standard_public.blog')}</a>
              <a href="/public?tab=accreditation_pinkcare">{t('standard_public.pinkcare_accreditation')}</a>
              
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
              {t('standard_public.designed_by')} <a href="http://www.t1srl.it/">TiOne Technology Srl</a>
            </p>
            <p className="pull-right">
              <a href="/public?tab=general_policy" target="_blank">Privacy policy</a>
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