import React, { useState, useEffect } from "react";
import defaultLogo from "../assets/images/amit_online_logo_1786000403966.jpg";

export interface LogoProps {
  customLogoUrl?: string;
  logoUrl?: string;
  src?: string;
  businessName?: string;
  className?: string;
  light?: boolean;
  onClick?: () => void;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Logo({
  customLogoUrl,
  logoUrl: propLogoUrl,
  src: propSrc,
  businessName: propBusinessName,
  className = "",
  light = false,
  onClick,
  showText = true,
  size = "md",
}: LogoProps) {
  const explicitPropUrl = customLogoUrl || propLogoUrl || propSrc || "";
  const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string>("");
  const [logoError, setLogoError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!explicitPropUrl);
  const [businessLabel, setBusinessLabel] = useState<string>(propBusinessName || "AMIT");
  const [subLabel, setSubLabel] = useState<string>("ONLINE SERVICES");

  const loadBusinessInfo = async () => {
    // If a custom logo URL is explicitly provided via prop, we respect it
    if (explicitPropUrl) {
      setDynamicLogoUrl(explicitPropUrl);
      setLogoError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const endpoints = ["/api/config/business-info", "/api/business-info", "/api/invoice-settings"];
      let loaded = false;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint);
          if (!res.ok) continue;
          const data = await res.json();
          const info = data?.data || data?.settings || data;

          if (info) {
            const logo = info.BUSINESS_LOGO || info.business_logo || info.LOGO_URL || info.logoUrl || "";
            if (logo && (logo.startsWith("data:") || logo.startsWith("http") || logo.startsWith("/"))) {
              setDynamicLogoUrl(logo);
              setLogoError(false);
            }

            const name = propBusinessName || info.BUSINESS_NAME || info.business_name || "";
            if (name) {
              const upper = name.toUpperCase();
              const short = upper.includes("AMIT") ? "AMIT" : name.split(" ")[0];
              setBusinessLabel(short || "AMIT");
            }
            loaded = true;
            break;
          }
        } catch (e) {
          // try next fallback endpoint
        }
      }

      if (!loaded && !explicitPropUrl) {
        // Fallback default
        setDynamicLogoUrl("");
      }
    } catch (err) {
      console.warn("Dynamic business logo resolution fallback:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (explicitPropUrl) {
      setDynamicLogoUrl(explicitPropUrl);
      setLogoError(false);
      setIsLoading(false);
    } else {
      loadBusinessInfo();
    }
  }, [explicitPropUrl, propBusinessName]);

  useEffect(() => {
    const handleUpdate = () => loadBusinessInfo();
    window.addEventListener("business-info-updated", handleUpdate);
    window.addEventListener("settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("business-info-updated", handleUpdate);
      window.removeEventListener("settings-updated", handleUpdate);
    };
  }, [explicitPropUrl]);

  const activeSrc = (!logoError && (explicitPropUrl || dynamicLogoUrl)) ? (explicitPropUrl || dynamicLogoUrl) : defaultLogo;

  // Size styling maps
  const containerSizeClasses = {
    sm: "w-8 h-8 rounded-[10px]",
    md: "w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[15px]",
    lg: "w-14 h-14 sm:w-16 sm:h-16 rounded-[16px]",
    xl: "w-20 h-20 rounded-[20px]",
  }[size];

  const textHeadingClasses = {
    sm: "text-[13px] sm:text-[15px]",
    md: "text-[15px] sm:text-xl",
    lg: "text-xl sm:text-2xl",
    xl: "text-2xl sm:text-3xl",
  }[size];

  const subTextClasses = {
    sm: "text-[5.5px] sm:text-[6.5px]",
    md: "text-[6.5px] sm:text-[7.5px]",
    lg: "text-[8px] sm:text-[9.5px]",
    xl: "text-[10px] sm:text-[12px]",
  }[size];

  return (
    <div
      id="logo-component"
      className={`flex items-center gap-2.5 sm:gap-4 cursor-pointer group select-none max-h-[50px] w-auto aspect-auto ${className}`}
      onClick={onClick}
    >
      <div className="relative shrink-0 transition-all group-hover:scale-105 duration-500 max-h-[50px] aspect-square">
        <div
          className={`${containerSizeClasses} max-h-[50px] max-w-[50px] bg-white dark:bg-slate-800 flex items-center justify-center shadow-xl shadow-blue-200/50 dark:shadow-blue-900/40 border border-slate-100 dark:border-slate-700 p-1 overflow-hidden transition-all relative`}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg z-10" />
          )}
          <img
            src={activeSrc}
            alt={`${businessLabel} Logo`}
            className={`w-full h-full object-contain rounded-lg max-h-[50px] aspect-square transition-opacity duration-500 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            referrerPolicy="no-referrer"
            onError={() => {
              if (activeSrc !== defaultLogo) {
                setLogoError(true);
              }
            }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div
            className={`flex items-center ${textHeadingClasses} font-black tracking-[-0.04em] whitespace-nowrap leading-none`}
          >
            <span className="text-[#EE1D23]">www.</span>
            <span className={light ? "text-white" : "text-slate-900 dark:text-white"}>
              {businessLabel}
            </span>
            <span className="text-[#0054A6]">.</span>
            <span className="text-[#0054A6]">TODAY</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
            <div className="h-[1px] w-2 sm:w-3 bg-slate-200 dark:bg-slate-700" />
            <span
              className={`${subTextClasses} font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.25em] whitespace-nowrap`}
            >
              {subLabel}
            </span>
            <div className="h-[1px] w-2 sm:w-3 bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      )}
    </div>
  );
}
