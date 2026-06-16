import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Ambula',
      tagline: 'Healthcare at Your Fingertips',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      bookAppointment: 'Book Appointment',
      healthRecords: 'Health Records',
      prescriptions: 'Prescriptions',
      findDoctor: 'Find a Doctor',
      myAppointments: 'My Appointments',
      healthSummary: 'Health Summary',
      welcome: 'Welcome',
      loading: 'Loading...',
      noAppointments: 'No appointments yet.',
      bookNow: 'Book one now',
      status: {
        scheduled: 'Scheduled',
        completed: 'Completed',
        cancelled: 'Cancelled',
        'checked-in': 'Checked In',
        consulting: 'Consulting',
      },
    },
  },
  hi: {
    translation: {
      appName: 'अंबुला',
      tagline: 'स्वास्थ्य सेवा आपकी उंगलियों पर',
      login: 'लॉगिन',
      register: 'पंजीकरण',
      logout: 'लॉगआउट',
      bookAppointment: 'अपॉइंटमेंट बुक करें',
      healthRecords: 'स्वास्थ्य रिकॉर्ड',
      prescriptions: 'पर्चे',
      findDoctor: 'डॉक्टर खोजें',
      myAppointments: 'मेरी अपॉइंटमेंट',
      loading: 'लोड हो रहा है...',
    },
  },
  kn: {
    translation: {
      appName: 'ಅಂಬುಲ',
      tagline: 'ಆರೋಗ್ಯ ಸೇವೆ ನಿಮ್ಮ ಬೆರಳ ತುದಿಯಲ್ಲಿ',
      login: 'ಲಾಗಿನ್',
      register: 'ನೋಂದಣಿ',
      logout: 'ಲಾಗ್ಔಟ್',
      bookAppointment: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
      loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    },
  },
  te: {
    translation: {
      appName: 'అంబుల',
      tagline: 'వైద్య సేవలు మీ వేళ్ళ కొనన',
      login: 'లాగిన్',
      register: 'నమోదు',
      logout: 'లాగ్ అవుట్',
      bookAppointment: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
      loading: 'లోడ్ అవుతోంది...',
    },
  },
  ta: {
    translation: {
      appName: 'அம்புல',
      tagline: 'சுகாதார சேவைகள் உங்கள் விரல் நுனியில்',
      login: 'உள்நுழை',
      register: 'பதிவு',
      logout: 'வெளியேறு',
      bookAppointment: 'சந்திப்பு பதிவு செய்யுங்கள்',
      loading: 'ஏற்றுகிறது...',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
