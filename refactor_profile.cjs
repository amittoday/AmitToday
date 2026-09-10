const fs = require('fs');
const appFile = fs.readFileSync('src/App.tsx', 'utf-8');

const regexProfileForm = /function ProfileForm\(\{ user, setUser \}: any\) \{[\s\S]*?(?=function UserDashboard)/;

const newCode = `function ProfileForm({ user, setUser }: any) {
  const [formData, setFormData] = useState({ 
    name: user.name || '', 
    email: user.email || '',
    mobile: user.mobile || '+91 ',
    dob: user.dob || '',
    gender: user.gender || 'Male',
    social: user.social || '',
    residentialAddress: user.residentialAddress || '',
    shippingAddress: user.shippingAddress || '',
    billingAddress: user.billingAddress || '',
    city: user.city || '',
    state: user.state || '',
    pincode: user.pincode || '',
    sameAsResidential: false
  });
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>(user.KYCStatus || 'Pending');

  useEffect(() => {
    // dynamically fetch KYC status from backend
    const fetchProfileData = async () => {
      try {
        const res = await axios.post('/api/data/collection', { tab: 'Users' }, {
          headers: { Authorization: \`Bearer \${user.token}\` }
        });
        if (res.data.success && res.data.data) {
           const myUser = res.data.data.find((u: any) => (u.Email || u.email) === user.email);
           if (myUser && myUser.KYCStatus) {
              setKycStatus(myUser.KYCStatus);
           }
        }
      } catch (err) {}
    }
    fetchProfileData();
  }, [user]);

  const requiredFields = ['name', 'mobile', 'dob', 'gender', 'residentialAddress', 'city', 'state', 'pincode'];
  let filledCount = 0;
  requiredFields.forEach(field => {
     const val = formData[field as keyof typeof formData] as string;
     if (val && val.trim() !== '') filledCount++;
  });
  const completionPercentage = Math.round((filledCount / requiredFields.length) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dob) { return toast.error("Date of Birth is required"); }
    if (!formData.gender) { return toast.error("Gender is required"); }
    if (!formData.residentialAddress || !formData.city || !formData.state) {
        return toast.error("Residential Address, City, and State are required");
    }
    if (!/^\\d{6}$/.test(formData.pincode)) {
        return toast.error("Pincode must be exactly 6 digits");
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/profile/update', formData, {
        headers: { Authorization: \`Bearer \${user.token}\` }
      });
      if (res.data.success) {
        setUser({ ...user, ...formData });
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      sameAsResidential: checked,
      shippingAddress: checked ? prev.residentialAddress : prev.shippingAddress
    }));
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start">
      {/* Left: Profile Overview Card */}
      <div className="w-full xl:w-80 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
        <div className="w-28 h-28 bg-red-100 dark:bg-red-900/30 rounded-[2rem] flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-4xl mb-6 shadow-inner relative overflow-hidden group">
          {user.name?.charAt(0)?.toUpperCase()}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
             <Upload size={24} className="text-white"/>
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full z-10"></div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight mb-1">{user.name}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm mb-6 border border-slate-100 dark:border-slate-700">User ID: {user.id || 'AOS-099'}</p>
        
        {/* Profile Completion */}
        <div className="w-full mb-8 text-left">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Completion</span>
             <span className="text-sm font-black text-blue-600">{completionPercentage}%</span>
           </div>
           <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: \`\${completionPercentage}%\` }}></div>
           </div>
        </div>

        <div className="w-full space-y-4 mb-8">
          <div className="flex justify-between items-center text-sm font-bold bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-slate-500">Mobile</span>
            <span className="text-slate-900 dark:text-white flex items-center gap-2">{formData.mobile || '---'}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <span className="text-slate-500 hidden sm:inline">Email</span>
            <span className="text-slate-900 dark:text-white truncate">{user.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-slate-500">Member Since</span>
             <span className="text-slate-900 dark:text-white">{new Date().getFullYear()}</span>
          </div>
        </div>

        <div className="w-full">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 text-left pl-2">KYC Status</h4>
          <div className="space-y-2">
             <div className={\`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border \${kycStatus === 'Verified' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}\`}>
               {kycStatus === 'Verified' ? <CheckCircle size={16} className="text-green-500"/> : <AlertCircle size={16} className="text-orange-500"/>} 
               {kycStatus === 'Verified' ? 'KYC Verified' : \`KYC \${kycStatus}\`}
             </div>
          </div>
        </div>
      </div>

      {/* Right: Detailed Form */}
      <div className="flex-1 w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700">
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3"><User className="text-red-500 bg-red-100 p-1.5 rounded-lg" size={28}/> Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Name</label>
                <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Mobile Number</label>
                <input required value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Date of Birth</label>
                <input type="date" required value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Gender</label>
                <select required value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm pb-3.5">
                  <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email <span className="text-green-500 lowercase normal-case">(Verified)</span></label>
                <input disabled value={formData.email || ''} className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none font-bold text-slate-500 cursor-not-allowed shadow-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Social Media Link (LinkedIn/Twitter)</label>
                <input value={formData.social || ''} onChange={e => setFormData({...formData, social: e.target.value})} placeholder="https://" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm" />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700">
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3"><LayoutGrid className="text-red-500 bg-red-100 p-1.5 rounded-lg" size={28}/> Address Details</h4>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Residential Address</label>
                <textarea required rows={2} value={formData.residentialAddress || ''} onChange={e => { setFormData({...formData, residentialAddress: e.target.value}); if(formData.sameAsResidential) setFormData(p => ({...p, shippingAddress: e.target.value})) }} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white resize-none shadow-sm" />
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer pl-1">
                <input type="checkbox" checked={formData.sameAsResidential || false} onChange={handleCheckboxChange} className="w-5 h-5 rounded-md border-slate-300 text-red-600 focus:ring-red-600 bg-white" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Shipping Address is same as Residential</span>
              </label>

              {!formData.sameAsResidential && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 mt-4">Shipping Address</label>
                  <textarea rows={2} value={formData.shippingAddress || ''} onChange={e => setFormData({...formData, shippingAddress: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white resize-none shadow-sm" />
                </motion.div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Billing Address</label>
                <textarea rows={2} value={formData.billingAddress || ''} onChange={e => setFormData({...formData, billingAddress: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white resize-none shadow-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">City</label>
                  <input required value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">State</label>
                  <input required value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">PINCODE</label>
                  <input required value={formData.pincode || ''} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="6 digits" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-bold dark:text-white shadow-sm" />
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="w-full md:w-auto bg-red-600 text-white px-12 py-5 rounded-2xl font-black shadow-xl hover:bg-red-700 shadow-red-200 dark:shadow-red-900/20 md:shadow-none hover:shadow-red-200 transition-all flex items-center justify-center gap-3">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`

const updatedAppFile = appFile.replace(regexProfileForm, newCode + '\n\n');
fs.writeFileSync('src/App.tsx', updatedAppFile);
console.log('ProfileForm fully replaced!');
