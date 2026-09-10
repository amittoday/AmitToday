import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Logo from "./Logo";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface FooterProps {
  lang: string;
  onPolicyClick?: (id: string) => void;
  setView?: (view: string) => void;
}

export default function Footer({ lang, onPolicyClick, setView }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [businessLabel, setBusinessLabel] = useState("AMIT");
  const [businessInfo, setBusinessInfo] = useState({
    BUSINESS_NAME: "AMIT ONLINE SERVICES",
    BUSINESS_PHONE: "+91 9898XXXXXX",
    BUSINESS_EMAIL: "amitonlineservice01@gmail.com",
    BUSINESS_LOGO: "",
    BUSINESS_ADDRESS: "Surat, Gujarat, India",
    BUSINESS_HOURS: "9:00 AM to 7:00 PM",
    LINK_FACEBOOK: "",
    LINK_INSTAGRAM: "",
    LINK_TWITTER: "",
    LINK_YOUTUBE: "",
    LINK_WHATSAPP: "",
  });

  const loadInfo = () => {
    fetch("/api/config/business-info")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setBusinessInfo({
            BUSINESS_NAME: res.data.BUSINESS_NAME || "AMIT ONLINE SERVICES",
            BUSINESS_PHONE: res.data.BUSINESS_PHONE || "+91 9898XXXXXX",
            BUSINESS_EMAIL: res.data.BUSINESS_EMAIL || "amitonlineservice01@gmail.com",
            BUSINESS_LOGO: res.data.BUSINESS_LOGO || "",
            BUSINESS_ADDRESS: res.data.BUSINESS_ADDRESS || "Surat, Gujarat, India",
            BUSINESS_HOURS: res.data.BUSINESS_HOURS || "9:00 AM to 7:00 PM",
            LINK_FACEBOOK: res.data.LINK_FACEBOOK || "",
            LINK_INSTAGRAM: res.data.LINK_INSTAGRAM || "",
            LINK_TWITTER: res.data.LINK_TWITTER || "",
            LINK_YOUTUBE: res.data.LINK_YOUTUBE || "",
            LINK_WHATSAPP: res.data.LINK_WHATSAPP || "",
          });
          if (res.data.BUSINESS_NAME) {
            const shortName = res.data.BUSINESS_NAME.toUpperCase();
            if (shortName.includes("AMIT ONLINE")) {
              setBusinessLabel("AMIT");
            } else {
              setBusinessLabel(res.data.BUSINESS_NAME);
            }
          } else {
            setBusinessLabel("AMIT");
          }
          setLogoError(false);
        }
      })
      .catch((err) => console.warn("Failed to load footer business info:", err));
  };

  useEffect(() => {
    loadInfo();
    window.addEventListener("business-info-updated", loadInfo);
    return () => {
      window.removeEventListener("business-info-updated", loadInfo);
    };
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    // Simulate save or subscription action
    toast.success(
      lang === "gu"
        ? "ન્યૂઝલેટર સબ્સ્ક્રિપ્શન સફળ થયું! આભાર."
        : "Newsletter subscription successful! Thank you."
    );
    setNewsletterEmail("");
  };

  const socialLinks: any[] = [];
  if (businessInfo.LINK_FACEBOOK) {
    socialLinks.push({ icon: <Facebook size={18} />, href: businessInfo.LINK_FACEBOOK, color: "hover:text-blue-600 hover:bg-slate-900 border-slate-800" });
  }
  if (businessInfo.LINK_TWITTER) {
    socialLinks.push({ icon: <Twitter size={18} />, href: businessInfo.LINK_TWITTER, color: "hover:text-sky-500 hover:bg-slate-900 border-slate-800" });
  }
  if (businessInfo.LINK_INSTAGRAM) {
    socialLinks.push({ icon: <Instagram size={18} />, href: businessInfo.LINK_INSTAGRAM, color: "hover:text-pink-600 hover:bg-slate-900 border-slate-800" });
  }
  if (businessInfo.LINK_YOUTUBE) {
    socialLinks.push({ icon: <Youtube size={18} />, href: businessInfo.LINK_YOUTUBE, color: "hover:text-red-600 hover:bg-slate-900 border-slate-800" });
  }
  if (businessInfo.LINK_WHATSAPP) {
    socialLinks.push({ icon: <MessageCircle size={18} />, href: businessInfo.LINK_WHATSAPP, color: "hover:text-green-500 hover:bg-slate-900 border-slate-800" });
  }

  const quickLinks = [
    { name: "Home", nameGu: "હોમ", path: "/" },
    { name: "Services Hub", nameGu: "સેવા કેન્દ્ર", path: "/services" },
    { name: "Blog Pages", nameGu: "બ્લોગ પેજીસ", path: "/blog" },
    { name: "About Us", nameGu: "અમારા વિશે", path: "/about" },
    { name: "FAQ Support", nameGu: "પ્રશ્નોત્તરી (FAQ)", path: "/faq" },
    { name: "Contact Center", nameGu: "સંપર્ક કેન્દ્ર", path: "/contact" },
  ];

  const legalLinks = [
    { name: "Terms & Conditions", nameGu: "નિયમો અને શરતો", path: "/legal/terms" },
    { name: "Privacy Policy", nameGu: "ગોપનીયતા નીતિ", path: "/legal/privacy" },
    { name: "Refund Policy", nameGu: "રિફંડ નીતિ", path: "/legal/refund" },
    { name: "Shipping Policy", nameGu: "શિપિંગ નીતિ", path: "/legal/shipping" },
    { name: "Disclaimer Policy", nameGu: "અસ્વીકરણ નીતિ", path: "/legal/disclaimer" },
    { name: "Anti-Discrimination", nameGu: "ભેદભાવ વિરોધી નીતિ", path: "/legal/anti-discrimination" },
  ];

  return (
    <footer className="bg-slate-950 text-white pt-24 pb-12 border-t border-slate-900/40 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto max-w-7xl px-4 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-slate-900">
          
          {/* Column 1: Brand Info & Official Disclaimer */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <Logo light={true} onClick={() => { if (setView) setView("home"); }} />

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-medium">
              {lang === "gu"
                ? "સુવિધા કેન્દ્ર અને આઇટી સોલ્યુશન પ્રોવાઈડર. સુરત, ગુજરાતથી કાર્યરત, અમે ખૂબ જ કુશળતા તેમજ સલામતી સાથે ઓનલાઇન સરકારી અને ખાનગી દસ્તાવેજ સેવાઓ પૂરી પાડીએ છીએ."
                : "A premium private facilitation center and IT solution provider. Headquartered in Surat, Gujarat, we assist you in submitting secure, validated documents with unmatched precision."}
            </p>

            {/* Disclaimer Box */}
            <div className="bg-red-950/10 border border-red-900/40 p-5 rounded-2xl max-w-md">
              <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-wider mb-2">
                <AlertCircle size={14} className="shrink-0" />
                {lang === "gu" ? "સત્તાવાર અસ્વીકરણ" : "Official Disclaimer"}
              </div>
              <p className="text-[10px] text-red-200/70 leading-relaxed font-bold">
                {lang === "gu"
                  ? "પોર્ટલ એક ખાનગી સુવિધા કેન્દ્ર (Facilitation Entity) છે. અમે કોઈ સરકારી વિભાગ કે એજન્સી નથી. સરકારી અરજીઓ પાસ કે રિજેક્ટ કરવાનું અમારું કામ નથી."
                  : "We operate as an independent technical facilitation agency. We cannot guarantee approvals. Application decision powers rest solely with respective government registrars."}
              </p>
            </div>
          </div>

          {/* Column 2: Quick Navigation Links */}
          <div className="lg:col-span-2 text-left">
            <h4 className="text-xs font-black tracking-widest uppercase text-slate-100 mb-6 border-l-2 border-blue-500 pl-3">
              {lang === "gu" ? "રૂટીંગ લિંક્સ" : "Navigation"}
            </h4>
            <ul className="space-y-3.5">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    onClick={() => {
                      if (setView) {
                        if (link.path === "/") setView("home");
                        else if (link.path === "/services") setView("services");
                        else if (link.path === "/blog") setView("blog");
                        else if (link.path === "/about") setView("about");
                        else if (link.path === "/faq") setView("faq");
                        else if (link.path === "/contact") setView("contact");
                      }
                    }}
                    className="text-slate-400 hover:text-white text-xs font-semibold transition-colors duration-200 block"
                  >
                    {lang === "gu" ? link.nameGu : link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div className="lg:col-span-2 text-left">
            <h4 className="text-xs font-black tracking-widest uppercase text-slate-100 mb-6 border-l-2 border-red-500 pl-3">
              {lang === "gu" ? "અમારી નીતિઓ" : "Legal Policy"}
            </h4>
            <ul className="space-y-3.5">
              {legalLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    onClick={() => {
                      if (onPolicyClick) {
                        const policyId = link.path.replace("/legal/", "");
                        onPolicyClick(policyId);
                      }
                    }}
                    className="text-slate-400 hover:text-white text-xs font-semibold transition-colors duration-200 block"
                  >
                    {lang === "gu" ? link.nameGu : link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Social Info & Newsletter */}
          <div className="lg:col-span-3 space-y-6 text-left">
            <h4 className="text-xs font-black tracking-widest uppercase text-slate-100 mb-6 border-l-2 border-emerald-500 pl-3">
              {lang === "gu" ? "સંપર્ક કેન્દ્ર" : "Contact Details"}
            </h4>
            
            <div className="space-y-3 text-xs text-slate-400">
              {businessInfo.BUSINESS_ADDRESS && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>{businessInfo.BUSINESS_ADDRESS}</span>
                </div>
              )}
              {businessInfo.BUSINESS_PHONE && (
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-emerald-500 shrink-0" />
                  <a href={`tel:${businessInfo.BUSINESS_PHONE}`} className="hover:text-white transition-colors">
                    {businessInfo.BUSINESS_PHONE}
                  </a>
                </div>
              )}
              {businessInfo.BUSINESS_EMAIL && (
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-[#EE1D23] shrink-0" />
                  <a href={`mailto:${businessInfo.BUSINESS_EMAIL}`} className="hover:text-white transition-colors">
                    {businessInfo.BUSINESS_EMAIL}
                  </a>
                </div>
              )}
              {businessInfo.BUSINESS_HOURS && (
                <div className="flex items-center gap-2.5">
                  <Clock size={15} className="text-amber-500 shrink-0" />
                  <span>{businessInfo.BUSINESS_HOURS}</span>
                </div>
              )}
            </div>

            {/* Social Icons Container */}
            {socialLinks.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  {socialLinks.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-8 h-8 rounded-lg border border-slate-900 bg-slate-950/45 flex items-center justify-center text-slate-400 transition-all duration-300 ${item.color}`}
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter Subscription Block */}
            <div className="pt-5 border-t border-slate-900 space-y-3">
              <h5 className="text-[10px] font-black tracking-widest uppercase text-slate-200">
                {lang === "gu" ? "અપડેટ્સ માટે જોડાઓ" : "Updates & Alerts"}
              </h5>
              <p className="text-[10px] text-slate-450 leading-relaxed font-bold">
                {lang === "gu"
                  ? "નવીનતમ યોજનાઓ અને સેવાની માહિતી મેળવવા માટે સબ્સ્ક્રાઇબ કરો."
                  : "Subscribe to receive direct updates and service alert notifications."}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={lang === "gu" ? "તમારું ઇમેઇલ..." : "Your email..."}
                  className="bg-slate-900 border border-slate-800 text-[11px] px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-slate-650 font-semibold flex-grow"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider px-3 py-2 rounded-xl active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {lang === "gu" ? "સબ્સ્ક્રાઇબ" : "Join"}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright and Badges */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            © 2026 {businessInfo.BUSINESS_NAME}. All Rights Reserved.
          </p>
          
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            {lang === "gu" ? "સુરક્ષિત આઇટી પેનલ" : "Secured Cloud Architecture"}{" "}
            <div className="w-4 h-4 rounded-full border border-emerald-500/50 flex items-center justify-center text-emerald-500">
              <CheckCircle size={10} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
