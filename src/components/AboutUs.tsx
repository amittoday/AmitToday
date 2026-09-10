import React from "react";
import { motion } from "motion/react";
import { Shield, Sparkles, Clock, MapPin, Award, Users } from "lucide-react";

export default function AboutUs() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 lg:px-12 py-10"
      id="about-us-page"
    >
      {/* હીરો હેડર */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/65 text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full select-none">
          વિશ્વસનીય સહાયતા કેન્દ્ર
        </span>
        <h1 className="text-3xl md:text-5xl font-sans font-black text-slate-900 dark:text-white mt-4 tracking-tight">
          અમિત ઓનલાઇન સર્વિસિસ
        </h1>
        <p className="text-slate-605 dark:text-slate-400 mt-4 text-sm md:text-base leading-relaxed font-sans">
          સુરત, ગુજરાતમાં ઝડપી, સચોટ અને સુરક્ષિત વહીવટી સહાય અને આઈટી સોલ્યુશન્સ સાથે ડિજિટલ સેતુનું નિર્માણ.
        </p>
      </div>

      {/* આંકડાકીય માહિતી રો */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { label: "સફળ સબમિશન", value: "૧૫,૦૦૦+" },
          { label: "સંતુષ્ટ ગ્રાહકો", value: "૫,૦૦૦+" },
          { label: "સચોટતા દર", value: "૯૯.૯%" },
          { label: "વિશ્વાસના વર્ષો", value: "૮+" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl text-center shadow-sm"
          >
            <div className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 font-sans">
              {stat.value}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* મુખ્ય ઉદ્દેશ્ય ગ્રીડ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
            અમારી સફર અને ગ્રાહકોને આપેલું વચન
          </h2>
          <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            <p>
              <strong>અમિત પટેલ</strong> દ્વારા સ્થાપિત, <strong>અમિત ઓનલાઇન સર્વિસિસ</strong> એક અગ્રણી ડિજિટલ દસ્તાવેજ સહાયતા એજન્સી છે જે <strong>સુરત, ગુજરાત</strong>ના હૃદયમાંથી કાર્ય કરે છે. અમારું મુખ્ય લક્ષ્ય વ્યાવસાયિકો, વ્યાપારીઓ અને નાગરિકોને સચોટ, ઝડપી અને અત્યંત સુરક્ષિત ડિજિટલ સેવાઓ પ્રદાન કરવાનું છે.
            </p>
            <p>
              અમે વિવિધ ભાષાઓમાં સચોટ <strong>અનુવાદ (translation)</strong>, દ્વિભાષી સ્પીડ <strong>ટાઈપિંગ (typing)</strong> સેવાઓ, શૈક્ષણિક સબમિશન અને <strong>સરકારી અરજી પ્રોસેસિંગ</strong> માં નિપુણતા ધરાવીએ છીએ. અમે સમજીએ છીએ કે સરકારી ફોર્મ, કાનૂની દસ્તાવેજો અને સત્તાવાર પ્રમાણપત્રો માટે સંપૂર્ણ ટેકનિકલ ચોકસાઈ અને સચોટતા અત્યંત જરૂરી છે.
            </p>
            <p>
              અદ્યતન ડિજિટલ સ્કેનિંગ ટેક્નોલોજી અને વિશેષ મેન્યુઅલ રિવ્યુ સાયકલનો ઉપયોગ કરીને, અમે ખાતરી કરીએ છીએ કે તમારા ફાઇલોમાં કોઈ માળખાકીય ભૂલો ન રહે. અમિત પટેલના નેતૃત્વ હેઠળ, અમારી ટીમ તમારા ખાનગી ડેટાને અત્યંત ગુપ્તતા, સુરક્ષા અને વ્યવસાયિક વફાદારી સાથે સાચવે છે.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: <Shield className="text-blue-600" size={24} />,
              title: "સંપૂર્ણ ડેટા ગુપ્તતા",
              desc: "૧૦૦% ક્લાઉડ એન્ક્રિપ્ટેડ ટ્રાન્ઝેક્શન્સ અને સ્ટેટ સ્ટોરેજ વ્યવસ્થા.",
            },
            {
              icon: <Clock className="text-blue-600" size={24} />,
              title: "સુપર-ઝડપી ડિલિવરી",
              desc: "જરૂરી દસ્તાવેજોના અનુવાદ માટે ઝડપી અને સમયસર વિતરણની સુવિધા.",
            },
            {
              icon: <MapPin className="text-blue-600" size={24} />,
              title: "સુરતમાં જ સ્થાપિત",
              desc: "સુરતના મુખ્ય આઇટી હબમાં અમારું સ્થાનિક ઓપરેશન સેન્ટર આવેલું છે.",
            },
            {
              icon: <Award className="text-blue-600" size={24} />,
              title: "પ્રમાણિત ગુણવત્તા",
              desc: "કાનૂની અને નિયમનકારી ધોરણોને અનુરૂપ સંપૂર્ણ ચકાસાયેલ પ્રક્રિયા.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col space-y-2 hover:border-blue-400 transition-colors"
            >
              <div className="bg-blue-50 dark:bg-blue-950/40 w-10 h-10 rounded-xl flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* નેતૃત્વ સેક્શન */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-sm">
        <div className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 w-16 h-16 rounded-full mb-6">
          <Users className="text-blue-600" size={32} />
        </div>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-sans">
          સ્થાપકનું નિવેદન
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs italic uppercase tracking-wider mt-1">
          અમિત પટેલના નેતૃત્વમાં
        </p>
        <blockquote className="mt-6 text-sm md:text-base font-sans text-slate-600 dark:text-slate-300 italic max-w-2xl mx-auto leading-relaxed">
          &ldquo;અમારું લક્ષ્ય ક્યારેય માત્ર નમૂના ભરવા અથવા ફોર્મ ટાઇપ કરવાનું નથી; તે તમને માનસિક શાંતિ આપવા વિશે છે. અમે ખાતરી કરીએ છીએ કે દરેક ડિજિટલ સબમિશન સર્જિકલ સચોટતા, અત્યંત સ્પષ્ટતા અને શૂન્ય ભૂલ સાથે પૂર્ણ થાય.&rdquo;
        </blockquote>
      </div>
    </motion.div>
  );
}
