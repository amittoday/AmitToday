const fs = require('fs');

const appFile = fs.readFileSync('src/App.tsx', 'utf-8');

const regexDocumentServiceCenter = /function DocumentServiceCenter\(\{[\s\S]*?(?=function GovServicesSuite)/;

const newCode = `function DocumentServiceCenter({ onFinish, lang, geoInfo, rates, selectedService = 'Translation', onChangeService, user }: any) {
  const [activeTab, setActiveTab] = useState<'Translation' | 'Typing' | 'Gov'>(selectedService as any || 'Translation');

  useEffect(() => {
    if (selectedService === 'Translation' || selectedService === 'Typing' || selectedService === 'Gov' || selectedService === 'FormFilling') {
      setActiveTab(selectedService === 'FormFilling' ? 'Gov' : selectedService as any);
    }
  }, [selectedService]);

  const [file, setFile] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [amount, setAmount] = useState(0);
  
  const [sourceLang, setSourceLang] = useState('Auto Detect');
  const [targetLang, setTargetLang] = useState('Gujarati');
  const [extractedText, setExtractedText] = useState('');
  
  const [hardToRead, setHardToRead] = useState(false);
  const [expressDelivery, setExpressDelivery] = useState(false);

  // Translation Tab State
  const [transSourceText, setTransSourceText] = useState('');
  const [transResult, setTransResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Typing Tab State
  const [typingContent, setTypingContent] = useState('');
  const [manualWordCount, setManualWordCount] = useState<string>('');

  // Drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const detectedCountry = geoInfo?.country_code;
  const detectedCurrency = geoInfo?.currency || 'USD';
  const currency = detectedCountry === 'IN' ? 'INR' : (['USD', 'EUR', 'GBP'].includes(detectedCurrency) ? detectedCurrency : 'USD');
  const rateMultiplier = currency === 'INR' ? 1 : (rates && rates[currency] ? rates[currency] : (currency === 'EUR' ? 0.011 : (currency === 'GBP' ? 0.009 : 0.012)));

  const baseRate = activeTab === 'Translation' ? 0.80 : 0.50; // ₹0.80/word for translation, ₹0.50/word for typing

  useEffect(() => {
    let finalBasePrice = 0;
    let baseWords = 0;
    
    if (activeTab === 'Translation') {
       baseWords = file ? wordCount : transSourceText.trim().split(/\\s+/).filter(Boolean).length;
    } else if (activeTab === 'Typing') {
       baseWords = manualWordCount ? parseInt(manualWordCount) : typingContent.replace(/<[^>]*>/g, '').trim().split(/\\s+/).filter(Boolean).length;
    }
    
    setWordCount(baseWords);
    finalBasePrice = baseWords * baseRate;
    
    if (hardToRead) finalBasePrice *= 1.2;
    if (expressDelivery) finalBasePrice *= 1.5;
    
    setAmount(finalBasePrice * rateMultiplier);
  }, [activeTab, wordCount, file, transSourceText, typingContent, manualWordCount, hardToRead, expressDelivery, rateMultiplier, baseRate]);

  const handleFile = async (f: any) => {
    if (!f) return;
    if (!f.type.includes('image/') && f.type !== 'application/pdf') {
        toast.error("Only Images and PDFs are supported.");
        return;
    }
    
    setFile(f);
    setIsProcessing(true);
    setUploadProgress(20);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        setUploadProgress(50);
        const content = (event.target?.result as string).split(',')[1];
        
        const ocrRes = await axios.post('/api/ai/ocr', { content, mimeType: f.type }, {
          headers: { Authorization: \`Bearer \${user?.token || ''}\` }
        });
        
        if (ocrRes.data.success) {
          const text = ocrRes.data.extractedText;
          setExtractedText(text);
          if (activeTab === 'Translation') setTransSourceText(text);
          const words = text.trim().split(/\\s+/).filter(Boolean).length;
          setWordCount(words);
          setUploadProgress(100);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(f);
    } catch (e) {
      toast.error("Analysis failed. Please enter word count manually.");
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFile(e.dataTransfer.files[0]);
      }
  };

  const removeFile = () => {
    setFile(null);
    setWordCount(0);
    setExtractedText('');
    setUploadProgress(0);
  }

  const doTranslate = async () => {
    if (!transSourceText) return toast.error("Please enter source text");
    setIsTranslating(true);
    try {
      const res = await axios.post('/api/ai/translate', { text: transSourceText, targetLang }, {
        headers: { Authorization: \`Bearer \${user?.token || ''}\` }
      });
      setTransResult(res.data.translatedText);
      toast.success("Translation complete!");
    } catch (err: any) {
      toast.error("Translation failed: " + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePayment = async () => {
    if (amount <= 0) {
      toast.error("Word count must be greater than 0");
      return;
    }

    const rzp = (window as any).Razorpay;
    if (!rzp) {
        toast.error("Payment gateway loading error. Please refresh.");
        return;
    }

    setIsProcessing(true);
    try {
        const orderRes = await axios.post('/api/payment/create-order', {
            amount: amount,
            currency: currency
        }, {
            headers: { Authorization: \`Bearer \${user?.token || ''}\` }
        });

        if (!orderRes.data.success) throw new Error("Order creation failed");

        const options = {
            key: orderRes.data.key_id,
            amount: orderRes.data.amount,
            currency: orderRes.data.currency,
            name: "Amit Online Services",
            description: \`\${activeTab} Service - \${wordCount} words\`,
            order_id: orderRes.data.order_id,
            handler: async (response: any) => {
                const verifyRes = await axios.post('/api/payment/verify', response, {
                    headers: { Authorization: \`Bearer \${user?.token || ''}\` }
                });

                if (verifyRes.data.success) {
                    toast.success("Payment Successful!");
                    
                    onFinish({
                        serviceType: activeTab,
                        sourceLanguage: sourceLang,
                        targetLang,
                        wordCount,
                        amount,
                        currency,
                        paymentId: response.razorpay_payment_id,
                        extractedText: activeTab === 'Translation' ? transSourceText : typingContent,
                        translatedText: transResult,
                        options: { hardToRead, expressDelivery }
                    });
                }
                setIsProcessing(false);
            },
            modal: {
              ondismiss: () => setIsProcessing(false)
            },
            theme: { color: "#1E57E5" }
        };

        const razorInstance = new rzp(options);
        razorInstance.open();
    } catch (err) {
        toast.error("Payment failed. Please try again.");
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[85vh]">
      
      {/* Sidebar */}
      <div className="w-full lg:w-[400px] bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-8 flex flex-col shrink-0 overflow-y-auto max-h-[85vh]">
        
        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
            Service<br/><span className="text-blue-600">Center</span>
          </h2>
        </div>

        <div className="space-y-8 flex-1">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Service Required</label>
              <div className="flex flex-col gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                <button onClick={() => { setActiveTab('Translation'); onChangeService && onChangeService('Translation'); removeFile(); setTransSourceText(''); setTransResult(''); }} className={\`py-3 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 \${activeTab === 'Translation' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}\`}>
                  <Type size={14} /> Translation
                </button>
                <button onClick={() => { setActiveTab('Typing'); onChangeService && onChangeService('Typing'); removeFile(); }} className={\`py-3 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 \${activeTab === 'Typing' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}\`}>
                  <FileText size={14} /> Typing
                </button>
                <button onClick={() => { setActiveTab('Gov'); onChangeService && onChangeService('FormFilling'); }} className={\`py-3 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 \${activeTab === 'Gov' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}\`}>
                  <Globe size={14} /> Government Applications
                </button>
              </div>
           </div>

           {activeTab === 'Translation' && (
             <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Source Lang</label>
                  <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="w-full h-12 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 px-4 text-sm font-bold shadow-sm outline-none dark:text-slate-100">
                    {['Auto Detect', 'English', 'Gujarati', 'Hindi', 'Marathi', 'Sanskrit'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Target Lang</label>
                  <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full h-12 rounded-xl bg-blue-50 text-blue-600 border px-4 dark:bg-slate-800 dark:border-slate-700 text-sm font-bold shadow-sm outline-none">
                    {['Gujarati', 'English', 'Hindi', 'Marathi', 'Sanskrit'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
             </div>
           )}

           {activeTab !== 'Gov' && (
             <>
               <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Options</label>
                  <div onClick={() => setHardToRead(!hardToRead)} className={\`p-4 rounded-2xl border cursor-pointer transition-all \${hardToRead ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40' : 'bg-white dark:bg-slate-800'}\`}>
                    <div className="flex items-center gap-3">
                       <div className={\`w-5 h-5 flex items-center justify-center rounded \${hardToRead ? 'bg-blue-600' : 'border border-slate-300'}\`}>{hardToRead && <Check size={12} className="text-white"/>}</div>
                       <div className="text-sm font-bold dark:text-gray-200">Hard to read (+20%)</div>
                    </div>
                  </div>
                  <div onClick={() => setExpressDelivery(!expressDelivery)} className={\`p-4 rounded-2xl border cursor-pointer transition-all \${expressDelivery ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/40' : 'bg-white dark:bg-slate-800'}\`}>
                    <div className="flex items-center gap-3">
                       <div className={\`w-5 h-5 flex items-center justify-center rounded \${expressDelivery ? 'bg-amber-500' : 'border border-slate-300'}\`}>{expressDelivery && <Check size={12} className="text-white"/>}</div>
                       <div className="text-sm font-bold dark:text-gray-200">Express (+50%)</div>
                    </div>
                  </div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Amount</p>
                      <p className="text-[10px] font-bold text-slate-500">Base {currency} {(baseRate * rateMultiplier).toFixed(2)}/word</p>
                    </div>
                    <div className="text-right">
                       <span className="text-3xl font-black text-blue-600">{currency === 'INR' ? '₹' : currency} {amount.toFixed(2)}</span>
                    </div>
                 </div>
                 <button onClick={handlePayment} disabled={isProcessing || amount <= 0} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs hover:bg-emerald-700 disabled:opacity-50">
                   {isProcessing ? 'Processing...' : 'Proceed to Pay'}
                 </button>
               </div>
             </>
           )}

        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#111623] h-full w-full">
         <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
            
            {activeTab === 'Gov' && (
               <GovServicesSuite onFinish={onFinish} lang={lang} geoInfo={geoInfo} user={user} />
            )}

            {activeTab === 'Translation' && (
              <div className="space-y-6">
                 {/* Upload */}
                 <div 
                   onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                   className={\`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center \${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 dark:border-slate-800'} \${file ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}\`}
                   onClick={() => !file && document.getElementById('dsc-upload')?.click()}
                 >
                   <input type="file" id="dsc-upload" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} accept="image/*,application/pdf" />
                   {file ? (
                     <div className="flex flex-col items-center">
                        <FileText size={32} className="text-emerald-500 mb-2"/>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">{file.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="mt-2 text-xs text-red-500 font-bold hover:underline">Remove File</button>
                     </div>
                   ) : (
                     <>
                        <Upload size={32} className="text-slate-400 mb-4" />
                        <h4 className="font-black dark:text-white">Drag & Drop Image/PDF or Click to Browse</h4>
                     </>
                   )}
                   {isProcessing && uploadProgress > 0 && (
                     <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all rounded-b-3xl" style={{width: \`\${uploadProgress}%\`}}></div>
                   )}
                 </div>

                 {/* Text Input */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Source Text</p>
                      <textarea 
                         value={transSourceText} onChange={e => setTransSourceText(e.target.value)}
                         className="w-full h-64 bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-600 block dark:text-slate-100 dark:placeholder-slate-500 p-4 rounded-2xl resize-none"
                         placeholder="Or type text here..."
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex justify-between">
                        <span>Translated Text</span>
                        <button onClick={doTranslate} disabled={isTranslating} className="text-blue-600 hover:underline">{isTranslating ? 'Translating...' : 'Translate via AI'}</button>
                      </div>
                      <div className="w-full h-64 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 overflow-y-auto outline-none block dark:text-slate-100 whitespace-pre-wrap">
                         {isTranslating ? <p className="animate-pulse text-blue-600 font-bold">Translating...</p> : transResult || <span className="text-slate-400 italic">Translation will appear here.</span>}
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'Typing' && (
              <div className="space-y-6">
                 <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-3xl p-6">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Input Text</p>
                   <div className="h-[400px] mb-12 lg:mb-8 text-black dark:text-white">
                     <ReactQuill theme="snow" value={typingContent} onChange={setTypingContent} className="h-full" />
                   </div>
                   
                   <div className="flex gap-4 items-center mt-12 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
                     <div className="flex-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Word Count Override</label>
                       <input 
                         type="number" 
                         value={manualWordCount} 
                         onChange={e => setManualWordCount(e.target.value)} 
                         placeholder="Auto-calculated if empty"
                         className="w-full px-4 py-2 mt-1 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-600 dark:text-white" 
                       />
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Current Words</p>
                        <p className="text-2xl font-black dark:text-white">{wordCount}</p>
                     </div>
                   </div>
                 </div>
              </div>
            )}

         </div>
      </div>
    </div>
  );
}
`

const updatedAppFile = appFile.replace(regexDocumentServiceCenter, newCode + '\n\n');

fs.writeFileSync('src/App.tsx', updatedAppFile);
console.log('DocumentServiceCenter fully replaced!');
