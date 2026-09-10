export interface VoiceLanguageConfig {
  code: "gu-IN" | "hi-IN" | "en-US";
  label: string;
  nativeLabel: string;
  transliterationCode: "gu" | "hi" | "en";
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguageConfig[] = [
  {
    code: "gu-IN",
    label: "Gujarati",
    nativeLabel: "ગુજરાતી",
    transliterationCode: "gu",
    flag: "🇮🇳"
  },
  {
    code: "hi-IN",
    label: "Hindi",
    nativeLabel: "हिन्दी",
    transliterationCode: "hi",
    flag: "🇮🇳"
  },
  {
    code: "en-US",
    label: "English",
    nativeLabel: "English",
    transliterationCode: "en",
    flag: "🌐"
  }
];

export const DEFAULT_VOICE_LANG = "gu-IN";
