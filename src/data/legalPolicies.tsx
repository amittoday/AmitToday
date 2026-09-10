import React from "react";
import {
  FileText,
  Shield,
  RotateCcw,
  Truck,
  BookOpen,
  AlertCircle,
  Cookie,
  UserCheck,
} from "lucide-react";

export interface PolicySection {
  num: number;
  title: string;
  titleGu: string;
  content: string;
  contentGu: string;
}

export interface PolicyItem {
  id: string;
  name: string;
  nameGu: string;
  icon: React.ReactNode;
  title: string;
  titleGu: string;
  date: string;
  sections: PolicySection[];
}

export const POLICIES = [
  { id: "terms", name: "Terms & Conditions", nameGu: "નિયમો અને શરતો" },
  { id: "privacy", name: "Privacy Policy", nameGu: "ગોપનીયતા નીતિ" },
  { id: "refund", name: "Return & Refund Policy", nameGu: "પરત અને રિફંડ નીતિ" },
  { id: "shipping", name: "Shipping Policy", nameGu: "શિપિંગ નીતિ" },
  { id: "publication", name: "Publication Policy", nameGu: "પ્રકાશન નીતિ" },
  { id: "disclaimer", name: "Disclaimer", nameGu: "અસ્વીકરણ" },
  { id: "cookies", name: "Cookies Policy", nameGu: "કૂકીઝ નીતિ" },
  { id: "anti-discrimination", name: "Anti-Discrimination Policy", nameGu: "ભેદભાવ વિરોધી નીતિ" },
];

export const POLICY_CONTENT: { [key: string]: PolicyItem } = {
  terms: {
    id: "terms",
    name: "Terms & Conditions",
    nameGu: "નિયમો અને શરતો",
    icon: <FileText size={24} />,
    title: "Terms & Conditions",
    titleGu: "નિયમો અને શરતો",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Nature of Service",
        titleGu: "સેવાનું સ્વરૂપ",
        content: "We are a facilitation center and IT solution provider. We work on behalf of customers for typing, translation, and filling online government applications.",
        contentGu: "અમે એક ફેસલિટેશન (સુવિધા પૂરી પાડનાર) કેન્દ્ર અને IT સોલ્યુશન પ્રોવાઈડર છીએ. અમે ગ્રાહકો વતી ટાઇપિંગ, ભાષાંતર અને સરકારી અરજીઓ ઓનલાઈન ભરવાનું કામ કરીએ છીએ."
      },
      {
        num: 2,
        title: "Pricing and Charges",
        titleGu: "ભાવ અને ચાર્જ",
        content: "Typing and translation charges are calculated based on total words (Total Words * 0.5). In the case of government applications, the total amount displayed includes both the government fee and our admin/service charge.",
        contentGu: "ટાઇપિંગ અને ભાષાંતરનો ચાર્જ ડોક્યુમેન્ટના કુલ શબ્દો (Total Words * 0.5) મુજબ ગણવામાં આવે છે. સરકારી અરજીઓના કિસ્સામાં બતાવવામાં આવતી કુલ રકમમાં સંબંધિત સરકારી ફી અને અમારો એડમિન/સર્વિસ ચાર્જ બંને સામેલ હોય છે."
      },
      {
        num: 3,
        title: "Responsibility",
        titleGu: "જવાબદારી",
        content: "The customer is solely responsible for the authenticity and validity of the documents uploaded for application purposes.",
        contentGu: "અરજી માટે ગ્રાહક દ્વારા અપલોડ કરવામાં આવતા દસ્તાવેજોની સત્યતાની સંપૂર્ણ જવાબદારી ગ્રાહકની રહેશે."
      }
    ]
  },
  privacy: {
    id: "privacy",
    name: "Privacy Policy",
    nameGu: "ગોપનીયતા નીતિ",
    icon: <Shield size={24} />,
    title: "Privacy Policy",
    titleGu: "ગોપનીયતા નીતિ",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Data Usage",
        titleGu: "ડેટાનો ઉપયોગ",
        content: "The documents (PDF, JPG) uploaded by you via 'Click to Upload' are strictly used for your application or typing/translation tasks only.",
        contentGu: "તમે \"Click to Upload\" દ્વારા જે દસ્તાવેજો (PDF, JPG) અપલોડ કરો છો, તેનો ઉપયોગ માત્ર અને માત્ર તમારી અરજી અથવા ટાઇપિંગ/ભાષાંતરના કામ માટે જ થાય છે."
      },
      {
        num: 2,
        title: "Data Security",
        titleGu: "ડેટા સુરક્ષા",
        content: "All files are processed through a secure Google Drive architecture, and unnecessary temporary files are removed from the system after the work is completed.",
        contentGu: "તમામ ફાઈલો સુરક્ષિત ગુગલ ડ્રાઇવ (Google Drive) આર્કિટેક્ચર મારફતે પ્રોસેસ થાય છે અને કામ પૂર્ણ થયા બાદ બિનજરૂરી ટેમ્પરરી ફાઈલો સિસ્ટમમાંથી દૂર કરવામાં આવે છે."
      },
      {
        num: 3,
        title: "Payment Security",
        titleGu: "પેમેન્ટ સુરક્ષા",
        content: "We do not save credit card or bank details on our server. All transactions are securely processed via the Razorpay payment gateway.",
        contentGu: "અમે ક્રેડિટ કાર્ડ કે બેંકની કોઈ જ વિગતો અમારા સર્વર પર સેવ કરતા નથી. તમામ પેમેન્ટ પ્રક્રિયા Razorpay ના સુરક્ષિત ગેટવે દ્વારા થાય છે."
      }
    ]
  },
  refund: {
    id: "refund",
    name: "Return & Refund Policy",
    nameGu: "પરત અને રિફંડ નીતિ",
    icon: <RotateCcw size={24} />,
    title: "Return & Refund Policy",
    titleGu: "રિટર્ન અને રિફંડ નીતિ",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Government Applications",
        titleGu: "સરકારી અરજીઓ",
        content: "Once fees have been paid to government portals, the 'Government Fee' is strictly non-refundable. If the application process was not started by us due to any reason, a full refund will be initiated.",
        contentGu: "જો અમે તમારા વતી સરકારી પોર્ટલ પર ફી ભરી દીધી હશે, તો તે 'સરકારી ફી' કોઈ પણ સંજોગોમાં રિફંડવાપાત્ર રહેશે નહીં. જો કોઈ કારણસર અમારા દ્વારા અરજી પ્રક્રિયા શરૂ જ ન થઈ હોય, તો પૂરેપૂરું રિફંડ આપવામાં આવશે."
      },
      {
        num: 2,
        title: "Typing & Translation",
        titleGu: "ટાઇપિંગ અને ભાષાંતર",
        content: "No refunds will be provided once typing or translation work is completed and final files are delivered. However, for customer satisfaction, we provide reasonable revisions in the final file.",
        contentGu: "એકવાર ભાષાંતર અથવા ટાઇપિંગનું કામ પૂર્ણ થઈ જાય અને ફાઇનલ ફાઈલ ડિલિવર થઈ જાય, ત્યારબાદ રિફંડ મળશે નહીં. જોકે, ગ્રાહકના સંતોષ માટે અમે ફાઇનલ ફાઈલમાં જરૂરી સુધારા (Revision) કરી આપીએ છીએ."
      }
    ]
  },
  shipping: {
    id: "shipping",
    name: "Shipping Policy",
    nameGu: "શિપિંગ નીતિ",
    icon: <Truck size={24} />,
    title: "Shipping Policy",
    titleGu: "શિપિંગ અને ડિલિવરી નીતિ",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Digital Delivery",
        titleGu: "ડિજિટલ ડિલિવરી",
        content: "For most services, once completed, your invoice and final documents will be instantly available for download inside your user dashboard.",
        contentGu: "મોટાભાગની સેવાઓમાં કામ પૂર્ણ થતાં જ ઇન્વોઇસ અને ફાઇનલ ડોક્યુમેન્ટ ગ્રાહકના ડેશબોર્ડમાં ડાઉનલોડ માટે તરત જ ઉપલબ્ધ થઈ જાય છે."
      },
      {
        num: 2,
        title: "Physical Delivery (Hard Copy)",
        titleGu: "ફિઝિકલ ડિલિવરી (હાર્ડ કોપી)",
        content: "If you have chosen physical print and courier delivery during checkout, the documents will be shipped from Surat via Speed Post or trusted courier within 1-2 business days of completion. Delivery times depend on the address.",
        contentGu: "જો ગ્રાહકે ચેકઆઉટ સમયે ફિઝિકલ પ્રિન્ટ અને કુરિયરનો વિકલ્પ પસંદ કર્યો હશે, તો કામ પૂર્ણ થયાના ૧ થી ૨ કામકાજના દિવસોમાં સુરતથી સ્પીડ પોસ્ટ અથવા કુરિયર મારફતે ડોક્યુમેન્ટ મોકલવામાં આવશે. ડિલિવરીનો સમય ગ્રાહકના સરનામા પર આધારિત રહેશે."
      }
    ]
  },
  publication: {
    id: "publication",
    name: "Publication Policy",
    nameGu: "પ્રકાશન નીતિ",
    icon: <BookOpen size={24} />,
    title: "Publication Policy",
    titleGu: "પ્રકાશન નીતિ",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Confidentiality of Content",
        titleGu: "લખાણ અને દસ્તાવેજોની ગુપ્તતા",
        content: "Amit Online Services never publishes any of your personal documents, typed information, or translated files on public domains, internet, or social media. All assets and writings are kept completely private and confidential.",
        contentGu: "અમિત ઓનલાઇન સર્વિસિસ ગ્રાહકોના કોઈપણ અંગત દસ્તાવેજો, ટાઇપ કરેલી માહિતી કે ભાષાંતર કરેલી ફાઈલોને પબ્લિક ડોમેન, ઇન્ટરનેટ કે સોશિયલ મીડિયા પર ક્યારેય પ્રકાશિત (Publish) કરતી નથી. ગ્રાહકનું તમામ લખાણ સંપૂર્ણપણે ખાનગી (Confidential) રાખવામાં આવે છે."
      }
    ]
  },
  disclaimer: {
    id: "disclaimer",
    name: "Disclaimer",
    nameGu: "અસ્વીકરણ",
    icon: <AlertCircle size={24} />,
    title: "Disclaimer",
    titleGu: "અસ્વીકરણ",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Private Consultancy Identity",
        titleGu: "સ્વતંત્ર સંસ્થા અસ્વીકરણ",
        content: "We are an independent private consultancy and IT facilitation center. We are NOT a government department or agency. Form approval or rejection lies entirely under the respective government officer's authority. We assist in correct form filling and routing but guarantee no approval.",
        contentGu: "અમે સ્વતંત્ર ખાનગી સલાહકાર અને આઇટી સુવિધા કેન્દ્ર છીએ. અમે કોઈ સરકારી વિભાગ કે એજન્સી નથી. સરકારી ફોર્મ કે પ્રમાણપત્ર મંજૂર (Approve) કરવું કે નામંજૂર (Reject) કરવું તે સંપૂર્ણપણે જે-તે સરકારી અધિકારીના હાથમાં છે. અમે માત્ર અરજી સાચી રીતે ભરવાની અને પ્રક્રિયા પૂરી કરવાની સેવા આપીએ છીએ. મંજૂરીની કોઈ ગેરંટી આપતા નથી."
      }
    ]
  },
  cookies: {
    id: "cookies",
    name: "Cookies Policy",
    nameGu: "કૂકીઝ નીતિ",
    icon: <Cookie size={24} />,
    title: "Cookies Policy",
    titleGu: "કૂકીઝ નીતિ",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Website Experience & Sessions",
        titleGu: "વેબસાઈટ અનુભવ અને કૂકીઝ",
        content: "Our platform utilizes cookies to provide customers with a better, faster browser experience, preserve login sessions, and remember language preferences. By continuing to use the website, you consent to cookie usage.",
        contentGu: "અમારી વેબસાઈટ ગ્રાહકને વધુ સારો અને ઝડપી અનુભવ (જેમ કે લોગિન સેશન સાચવી રાખવા અને ભાષાની પસંદગી યાદ રાખવા) આપવા માટે કૂકીઝ (Cookies) નો ઉપયોગ કરે છે. વેબસાઈટનો ઉપયોગ ચાલુ રાખીને, તમે કૂકીઝના ઉપયોગ માટે સંમતિ આપો છો."
      }
    ]
  },
  "anti-discrimination": {
    id: "anti-discrimination",
    name: "Anti-Discrimination Policy",
    nameGu: "ભેદભાવ વિરોધી નીતિ",
    icon: <UserCheck size={24} />,
    title: "Anti-Discrimination Policy",
    titleGu: "ભેદભાવ વિરોધી નીતિ",
    date: "June 2026",
    sections: [
      {
        num: 1,
        title: "Equal Treatment and Services",
        titleGu: "સમાન દૃષ્ટિકોણ અને આદર",
        content: "Amit Online Services views all customers equally. We do not discriminate in service provisioning on the basis of caste, religion, gender, age, nationality, or physical disability.",
        contentGu: "અમિત ઓનલાઇન સર્વિસિસ તમામ ગ્રાહકોને સમાન દૃષ્ટિથી જુએ છે. અમે જાતિ, ધર્મ, લિંગ, ઉંમર, રાષ્ટ્રીયતા કે શારીરિક અક્ષમતાના આધારે સેવા પૂરી પાડવામાં કોઈપણ પ્રકારનો ભેદભાવ કરતા નથી."
      }
    ]
  }
};
