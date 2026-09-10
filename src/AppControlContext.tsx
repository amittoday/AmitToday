import React, { createContext, useContext, useState, useEffect } from "react";

interface AppControlContextType {
  isDocumentServiceEnabled: boolean;
  isGovernmentServicesActive: boolean;
  isVoiceTypingEnabled: boolean;
  isAiComplaintEnabled: boolean;
  isAiLegalAgentEnabled: boolean;
  isBlogEnabled: boolean;
  isNotaryEnabled: boolean;
  whatsappNotifications: boolean;
  // Granular Kill Switches
  isMasterKillSwitchActive: boolean;
  isAiVoiceAgentEnabled: boolean;
  isRtiModuleEnabled: boolean;
  isPaymentGatewayEnabled: boolean;
  isGoogleDriveUploadEnabled: boolean;
  setDocumentServiceEnabled: (val: boolean) => void;
  setGovernmentServicesActive: (val: boolean) => void;
  setVoiceTypingEnabled: (val: boolean) => void;
  setAiComplaintEnabled: (val: boolean) => void;
  setAiLegalAgentEnabled: (val: boolean) => void;
  setBlogEnabled: (val: boolean) => void;
  setNotaryEnabled: (val: boolean) => void;
  setWhatsappNotifications: (val: boolean) => void;
  setMasterKillSwitchActive: (val: boolean) => void;
  setAiVoiceAgentEnabled: (val: boolean) => void;
  setRtiModuleEnabled: (val: boolean) => void;
  setPaymentGatewayEnabled: (val: boolean) => void;
  setGoogleDriveUploadEnabled: (val: boolean) => void;
  logGovernmentServicesStatusChange?: (status: boolean) => void;
}

const AppControlContext = createContext<AppControlContextType | undefined>(undefined);

export const AppControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDocumentServiceEnabled, setDocumentServiceEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isDocumentServiceEnabled");
    return stored !== null ? stored === "true" : true;
  });

  const [isGovernmentServicesActive, setGovernmentServicesActive] = useState<boolean>(() => {
    const stored = localStorage.getItem("isGovernmentServicesActive") || localStorage.getItem("isGovernmentServiceEnabled");
    return stored !== null ? stored === "true" : true;
  });

  const [isVoiceTypingEnabled, setVoiceTypingEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isVoiceTypingEnabled");
    return stored !== null ? stored === "true" : false; // Upcoming default off
  });

  const [isAiComplaintEnabled, setAiComplaintEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isAiComplaintEnabled");
    return stored !== null ? stored === "true" : false; // Upcoming default off
  });

  const [isAiLegalAgentEnabled, setAiLegalAgentEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isAiLegalAgentEnabled");
    return stored !== null ? stored === "true" : true; // Voice AI Legal Studio enabled by default
  });

  const [isBlogEnabled, setBlogEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isBlogEnabled");
    return stored !== null ? stored === "true" : true; // Blog System default on
  });

  const [isNotaryEnabled, setNotaryEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isNotaryEnabled");
    return stored !== null ? stored === "true" : true; // Central Notary Public Portal default on
  });

  const [whatsappNotifications, setWhatsappNotifications] = useState<boolean>(() => {
    const stored = localStorage.getItem("whatsappNotifications");
    return stored !== null ? stored === "true" : false; // Strictly false (OFF) default
  });

  // Granular Kill Switches
  const [isMasterKillSwitchActive, setMasterKillSwitchActive] = useState<boolean>(() => {
    const stored = localStorage.getItem("isMasterKillSwitchActive");
    return stored !== null ? stored === "true" : false; // Default false (Normal System Operation)
  });

  const [isAiVoiceAgentEnabled, setAiVoiceAgentEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isAiVoiceAgentEnabled");
    return stored !== null ? stored === "true" : true; // Default true
  });

  const [isRtiModuleEnabled, setRtiModuleEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isRtiModuleEnabled");
    return stored !== null ? stored === "true" : true; // Default true
  });

  const [isPaymentGatewayEnabled, setPaymentGatewayEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isPaymentGatewayEnabled");
    return stored !== null ? stored === "true" : true; // Default true
  });

  const [isGoogleDriveUploadEnabled, setGoogleDriveUploadEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("isGoogleDriveUploadEnabled");
    return stored !== null ? stored === "true" : true; // Default true
  });

  const logGovernmentServicesStatusChange = (status: boolean) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[Diagnostic Log] [${timestamp}] Government Services operational status changed to: ${
        status ? "ONLINE" : "MAINTENANCE"
      }`
    );
  };

  useEffect(() => {
    localStorage.setItem("isDocumentServiceEnabled", String(isDocumentServiceEnabled));
  }, [isDocumentServiceEnabled]);

  useEffect(() => {
    logGovernmentServicesStatusChange(isGovernmentServicesActive);
    localStorage.setItem("isGovernmentServicesActive", String(isGovernmentServicesActive));
  }, [isGovernmentServicesActive]);

  useEffect(() => {
    localStorage.setItem("isVoiceTypingEnabled", String(isVoiceTypingEnabled));
  }, [isVoiceTypingEnabled]);

  useEffect(() => {
    localStorage.setItem("isAiComplaintEnabled", String(isAiComplaintEnabled));
  }, [isAiComplaintEnabled]);

  useEffect(() => {
    localStorage.setItem("isAiLegalAgentEnabled", String(isAiLegalAgentEnabled));
  }, [isAiLegalAgentEnabled]);

  useEffect(() => {
    localStorage.setItem("isBlogEnabled", String(isBlogEnabled));
  }, [isBlogEnabled]);

  useEffect(() => {
    localStorage.setItem("isNotaryEnabled", String(isNotaryEnabled));
  }, [isNotaryEnabled]);

  useEffect(() => {
    localStorage.setItem("whatsappNotifications", String(whatsappNotifications));
  }, [whatsappNotifications]);

  useEffect(() => {
    localStorage.setItem("isMasterKillSwitchActive", String(isMasterKillSwitchActive));
  }, [isMasterKillSwitchActive]);

  useEffect(() => {
    localStorage.setItem("isAiVoiceAgentEnabled", String(isAiVoiceAgentEnabled));
  }, [isAiVoiceAgentEnabled]);

  useEffect(() => {
    localStorage.setItem("isRtiModuleEnabled", String(isRtiModuleEnabled));
  }, [isRtiModuleEnabled]);

  useEffect(() => {
    localStorage.setItem("isPaymentGatewayEnabled", String(isPaymentGatewayEnabled));
  }, [isPaymentGatewayEnabled]);

  useEffect(() => {
    localStorage.setItem("isGoogleDriveUploadEnabled", String(isGoogleDriveUploadEnabled));
  }, [isGoogleDriveUploadEnabled]);

  return (
    <AppControlContext.Provider
      value={{
        isDocumentServiceEnabled,
        isGovernmentServicesActive,
        isVoiceTypingEnabled,
        isAiComplaintEnabled,
        isAiLegalAgentEnabled,
        isBlogEnabled,
        isNotaryEnabled,
        whatsappNotifications,
        isMasterKillSwitchActive,
        isAiVoiceAgentEnabled,
        isRtiModuleEnabled,
        isPaymentGatewayEnabled,
        isGoogleDriveUploadEnabled,
        setDocumentServiceEnabled,
        setGovernmentServicesActive,
        setVoiceTypingEnabled,
        setAiComplaintEnabled,
        setAiLegalAgentEnabled,
        setBlogEnabled,
        setNotaryEnabled,
        setWhatsappNotifications,
        setMasterKillSwitchActive,
        setAiVoiceAgentEnabled,
        setRtiModuleEnabled,
        setPaymentGatewayEnabled,
        setGoogleDriveUploadEnabled,
        logGovernmentServicesStatusChange,
      }}
    >
      {children}
    </AppControlContext.Provider>
  );
};

export const useAppControl = () => {
  const context = useContext(AppControlContext);
  if (!context) {
    throw new Error("useAppControl must be used within an AppControlProvider");
  }
  return context;
};

export const businessProfile = {
  name: "Amit Online Services",
  phone: "+91 97376 72626",
  email: "amitonlineservice01@gmail.com",
  address: "Gujarat, India"
};

export const catalog = [
  { ServiceName: "Jamin Mapni (જમીન માપણી)", GovFee: "₹50", ServiceCharge: "₹150", Category: "IORA" },
  { ServiceName: "Income Certificate (આવકનો દાખલો)", GovFee: "₹20", ServiceCharge: "₹80", Category: "Digital Gujarat" },
  { ServiceName: "Domicile Certificate (રહેવાસી પ્રમાણપત્ર)", GovFee: "₹20", ServiceCharge: "₹80", Category: "Digital Gujarat" },
  { ServiceName: "Caste Certificate (જ્ઞાતિ પ્રમાણપત્ર)", GovFee: "₹20", ServiceCharge: "₹80", Category: "Digital Gujarat" },
  { ServiceName: "Varsai Application (વારસાઈ અરજી)", GovFee: "₹50", ServiceCharge: "₹150", Category: "IORA" },
  { ServiceName: "Ration Card (રેશન કાર્ડ)", GovFee: "₹20", ServiceCharge: "₹80", Category: "Digital Gujarat" },
  { ServiceName: "Non-Creamy Layer (નોન-ક્રીમીલેયર)", GovFee: "₹20", ServiceCharge: "₹80", Category: "Digital Gujarat" },
  { ServiceName: "7/12 Correction (૭/૧૨ સુધારો)", GovFee: "₹50", ServiceCharge: "₹150", Category: "IORA" },
];

export const servicesList = catalog;
