import React, { createContext, useState, useContext, useEffect } from 'react';
import { english } from './english';
import { hindi } from './hindi';
import { marathi } from './marathi';

const translations = {
  en: english,
  hi: hindi,
  mr: marathi
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('skillsense_language') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    localStorage.setItem('skillsense_language', language);
  }, [language]);

  const t = (key) => {
    const langDict = translations[language];
    if (!langDict) return translations['en'][key] || key;
    return langDict[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
