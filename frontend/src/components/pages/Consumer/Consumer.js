import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import QuestionnaireChoice from '../Questionnaire/QuestionnaireChoice';
import QuestionnaireForm from '../Questionnaire/QuestionnaireForm';
import MedicalHistoryForm from './MedicalHistoryForm';
import UserProfileSidebar from '../../layout/UserProfileSidebar';
import AdvertisingSidebar from '../../layout/AdvertisingSidebar';
import ThreeColumnLayout from '../../layout/ThreeColumnLayout';
import './Consumer.css';

/**
 * Consumer - REPLICA ESATTA del consumer flow con tab navigation
 * Tab structure from flow.xml:
 * - tab=0: consumer_form (Profile)
 * - tab=1: recommended_examination_list
 * - tab=2: examinations_history
 * - tab=3: advanced_screening (Questionnaire)
 * - tab=4: schedule
 * - tab=5: menses_calendar
 * - tab=10: my_documents
 *
 * Layout: 3 colonne come nel legacy usando ThreeColumnLayout
 * - Left: UserProfileSidebar (componente riutilizzabile)
 * - Center: content (col-xl-6)
 * - Right: AdvertisingSidebar (componente riutilizzabile)
 */
const Consumer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const parsedTab = tab ? parseInt(tab) : 0;
    setActiveTab(parsedTab);

    // REPLICA ESATTA del legacy: quando vai su tab=3 senza type,
    // carica automaticamente lo screening basato sull'età (type=-1)
    if (parsedTab === 3) {
      const type = searchParams.get('type');
      if (type === null) {
        navigate('/consumer?tab=3&type=-1', { replace: true });
      }
    }
  }, [searchParams, navigate]);

  // Check if we're in questionnaire form view
  const screeningType = searchParams.get('type');
  const isQuestionnaireForm = activeTab === 3 && screeningType !== null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        // Storia Clinica (Medical History Form) - accordion style come nel legacy
        return <MedicalHistoryForm />;

      case 1:
        // TODO: Recommended Examination List - not yet implemented
        return (
          <div className="tab-placeholder">
            <h3>Recommended Examination List</h3>
            <p>Da implementare</p>
          </div>
        );

      case 2:
        // TODO: Examinations History - not yet implemented
        return (
          <div className="tab-placeholder">
            <h3>Examinations History</h3>
            <p>Da implementare</p>
          </div>
        );

      case 3:
        // Advanced Screening (Questionnaire)
        if (isQuestionnaireForm) {
          return <QuestionnaireForm />;
        }
        return <QuestionnaireChoice />;

      case 4:
        // TODO: Schedule - not yet implemented
        return (
          <div className="tab-placeholder">
            <h3>Schedule</h3>
            <p>Da implementare</p>
          </div>
        );

      case 5:
        // TODO: Menses Calendar - not yet implemented
        return (
          <div className="tab-placeholder">
            <h3>Menses Calendar</h3>
            <p>Da implementare</p>
          </div>
        );

      case 10:
        // TODO: My Documents - not yet implemented
        return (
          <div className="tab-placeholder">
            <h3>My Documents</h3>
            <p>Da implementare</p>
          </div>
        );

      default:
        return (
          <div className="tab-placeholder">
            <h3>Tab {activeTab}</h3>
            <p>Da implementare</p>
          </div>
        );
    }
  };

  return (
    <ThreeColumnLayout
      leftSidebar={<UserProfileSidebar />}
      rightSidebar={<AdvertisingSidebar />}
      leftColSize={2}
      centerColSize={8}
      rightColSize={2}
    >
      {renderTabContent()}
    </ThreeColumnLayout>
  );
};

export default Consumer;
