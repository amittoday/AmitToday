import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Mail, Phone, Lock, CheckCircle2, RefreshCw, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface SignUpProps {
  onSuccess?: (user: any) => void;
  onSwitchToLogin?: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess, onSwitchToLogin }) => {
  // Step 1: Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Step 2 & 3: OTP state
  const [otpStepRevealed, setOtpStepRevealed] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: any = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Form input validation
  const validateForm = (): boolean => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMsg('કૃપા કરીને આપનું પૂરું નામ દાખલ કરો. (Please enter your full name)');
      return false;
    }
    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      setErrorMsg('કૃપા કરીને ૧૦ અંકનો માન્ય મોબાઈલ નંબર દાખલ કરો. (Valid 10-digit mobile required)');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setErrorMsg('કૃપા કરીને સાચો ઈમેઇલ એડ્રેસ દાખલ કરો. (Valid email address required)');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('પાસવર્ડ ઓછામાં ઓછો ૬ અક્ષરનો હોવો જોઈએ. (Password must be at least 6 characters)');
      return false;
    }
    if (!acceptedTerms) {
      setErrorMsg('કૃપા કરીને નિયમો અને શરતો સ્વીકારો. (Please accept Terms & Conditions)');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Step 2: Handle "Send OTP" -> Calls ACTION_SEND_EMAIL_OTP via GAS MailApp
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSendingOtp(true);
    setErrorMsg(null);

    const emailLower = formData.email.trim().toLowerCase();

    try {
      // 1. Fetch dynamic GAS URL if available
      let gasUrl = '';
      try {
        const configRes = await axios.get('/api/config/gas-url');
        gasUrl = configRes.data?.gasWebappUrl || '';
      } catch (e) {}

      // Send OTP directly via backend proxy (which handles Zero-Cost GAS MailApp dispatch & fallback)
      const backendRes = await axios.post('/api/auth/send-email-otp', {
        name: formData.name.trim(),
        email: emailLower,
        mobile: formData.mobile.trim(),
        password: formData.password
      });
      if (!backendRes.data || !backendRes.data.success) {
        throw new Error(backendRes.data?.error || 'Failed to dispatch verification email');
      }

      // Step 3: Reveal OTP input and change button to "Verify & Register"
      setOtpStepRevealed(true);
      setResendCooldown(60);
      toast.success('તમારા ઈમેઈલ પર ૬ અંકનો વેરિફિકેશન કોડ (OTP) મોકલી દેવાયો છે!');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'OTP મોકલવામાં નિષ્ફળતા આવી.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 4: Handle "Verify & Register" -> Calls ACTION_VERIFY_EMAIL_OTP & creates user in USERS sheet
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMsg('કૃપા કરીને ૬ અંકનો ઓટીપી કોડ દાખલ કરો. (Please enter the 6-digit OTP)');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    const emailLower = formData.email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    try {
      // 1. Fetch dynamic GAS URL
      let gasUrl = '';
      try {
        const configRes = await axios.get('/api/config/gas-url');
        gasUrl = configRes.data?.gasWebappUrl || '';
      } catch (e) {}

      // Verify OTP & commit registration atomically via server backend
      const serverRegRes = await axios.post('/api/auth/register-verify', {
        email: emailLower,
        otp: cleanOtp,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password
      });

      if (!serverRegRes.data || !serverRegRes.data.success || !serverRegRes.data.user) {
        throw new Error(serverRegRes.data?.error || 'યુઝર પ્રોફાઇલ બનાવવામાં નિષ્ફળતા આવી.');
      }

      const registeredUserData = serverRegRes.data.user;
      const sessionToken = serverRegRes.data.token || ('gas-auth-' + Date.now());

      // 3. User created successfully! Establish local session & auto log-in
      const finalUser = {
        name: registeredUserData?.name || formData.name.trim(),
        email: emailLower,
        mobile: registeredUserData?.mobile || formData.mobile.trim(),
        role: registeredUserData?.role || 'user',
        status: 'Active',
        theme: 'light',
        token: sessionToken || ('token-' + Date.now())
      };

      localStorage.setItem('aos_token', finalUser.token);
      localStorage.setItem('aos_user', JSON.stringify(finalUser));
      const futureExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('aos_token_expiry', String(futureExpiry));

      if (axios.defaults.headers.common) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${finalUser.token}`;
      }

      setVerifiedSuccess(true);
      toast.success('એકાઉન્ટ સફળતાપૂર્વક રજીસ્ટર થઈ ગયું! સ્વાગત છે.');

      setTimeout(() => {
        if (onSuccess) onSuccess(finalUser);
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'રજીસ્ટ્રેશન પ્રક્રિયામાં ભૂલ આવી.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100" id="signup-component-card">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">નવું ખાતું બનાવો (Sign Up)</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Zero-Cost Email OTP Verification
        </p>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Registration & OTP Form */}
      <form onSubmit={otpStepRevealed ? handleVerifyAndRegister : handleSendOtp} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 px-1">
            પૂરું નામ (Full Name) *
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="signup-name-input"
              type="text"
              required
              disabled={otpStepRevealed}
              placeholder="દા.ત. અમિતકુમાર પટેલ"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-900 outline-none transition-all ${
                otpStepRevealed ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'border-slate-200 focus:border-red-600 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 px-1">
            મોબાઈલ નંબર (Mobile Number) *
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="signup-mobile-input"
              type="tel"
              required
              maxLength={10}
              disabled={otpStepRevealed}
              placeholder="૧૦ અંકનો મોબાઈલ નંબર"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-900 outline-none transition-all ${
                otpStepRevealed ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'border-slate-200 focus:border-red-600 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 px-1">
            ઈમેઇલ સરનામું (Email Address) *
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="signup-email-input"
              type="email"
              required
              disabled={otpStepRevealed}
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-900 outline-none transition-all ${
                otpStepRevealed ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'border-slate-200 focus:border-red-600 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5 px-1">
            પાસવર્ડ (Password) *
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="signup-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={otpStepRevealed}
              placeholder="ઓછામાં ઓછા ૬ અક્ષર"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full pl-11 pr-11 py-3 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-900 outline-none transition-all ${
                otpStepRevealed ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'border-slate-200 focus:border-red-600 focus:bg-white'
              }`}
            />
            <button
              type="button"
              disabled={otpStepRevealed}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-start gap-2.5 pt-1 px-1">
          <input
            id="signup-terms-checkbox"
            type="checkbox"
            required
            disabled={otpStepRevealed}
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
          />
          <label htmlFor="signup-terms-checkbox" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
            હું અમિત ઓનલાઇન સર્વિસિસના{' '}
            <a href="/policy" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold hover:underline">
              નિયમો અને શરતો (Terms & Conditions)
            </a>{' '}
            સ્વીકારું છું.
          </label>
        </div>

        {/* Step 3: REVEALED OTP INPUT FIELD */}
        <AnimatePresence>
          {otpStepRevealed && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-slate-100 space-y-3"
            >
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ઓટીપી મોકલ્યો: <strong>{formData.email}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpStepRevealed(false)}
                  className="text-[11px] text-emerald-700 font-bold underline hover:text-emerald-900 ml-2"
                >
                  બદલો (Edit)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 px-1">
                  ઈમેઇલ પર મોકલેલ ૬ અંકનો ઓટીપી (Enter OTP sent to your Email) *
                </label>
                <input
                  id="signup-otp-input"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="······"
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center py-3.5 bg-slate-50 border-2 border-red-500/40 rounded-2xl text-2xl font-black tracking-[0.35em] text-slate-900 outline-none focus:border-red-600 focus:bg-white transition-all font-mono"
                />
              </div>

              {/* Resend OTP button */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">ઓટીપી નથી મળ્યો?</span>
                {resendCooldown > 0 ? (
                  <span className="text-slate-400 font-bold">
                    ફરી મોકલો ({resendCooldown}s)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-red-600 font-black hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    ફરીથી ઓટીપી મોકલો (Resend OTP)
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2 & 4: MAIN ACTION BUTTON */}
        <button
          id="signup-submit-action-btn"
          type="submit"
          disabled={isSendingOtp || isVerifying || verifiedSuccess}
          className="w-full mt-4 py-4 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSendingOtp ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>ઓટીપી મોકલી રહ્યું છે... (Sending OTP...)</span>
            </>
          ) : isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>ચકાસી રહ્યું છે... (Verifying & Registering...)</span>
            </>
          ) : verifiedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>સફળ! (Registered!)</span>
            </>
          ) : otpStepRevealed ? (
            <>
              <span>Verify & Register / ચકાસો અને રજીસ્ટર કરો</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Send OTP / ઓટીપી મોકલો</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      {onSwitchToLogin && !otpStepRevealed && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            પહેલેથી ખાતું છે? <span className="text-red-600 font-black underline">અહીં લોગિન કરો (Login)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SignUp;
