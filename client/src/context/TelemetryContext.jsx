import React, { createContext, useContext, useState, useEffect } from 'react';

const TelemetryContext = createContext();

export function TelemetryProvider({ children }) {
  const [showConsent, setShowConsent] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [isOptedIn, setIsOptedIn] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('exifgrid_telemetry_consent');
    if (!consent) {
      setShowConsent(true);
    } else {
      setIsOptedIn(consent === 'granted');
    }
  }, []);

  const handleConsentChoice = (granted) => {
    localStorage.setItem('exifgrid_telemetry_consent', granted ? 'granted' : 'denied');
    setIsOptedIn(granted);
    setShowConsent(false);
  };

  const handleToggleTelemetry = () => {
    const newState = !isOptedIn;
    localStorage.setItem('exifgrid_telemetry_consent', newState ? 'granted' : 'denied');
    setIsOptedIn(newState);
  };

  return (
    <TelemetryContext.Provider value={{
      showConsent, showPrivacySettings, isOptedIn,
      setShowPrivacySettings, handleConsentChoice, handleToggleTelemetry
    }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export const useTelemetry = () => useContext(TelemetryContext);