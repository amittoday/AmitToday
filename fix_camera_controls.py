import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# fix Swivel Mode button
text = text.replace(
    'className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-755 text-white text-[11px] font-black transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 border border-slate-700 font-sans"',
    'className="px-2 sm:px-4 py-2 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-755 text-white text-[9px] sm:text-[11px] font-black transition-all shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 border border-slate-700 font-sans leading-tight text-center"'
)

# fix Scanner Crop button
text = text.replace(
    'className={`px-4 py-3 rounded-xl border transition-all text-[11px] font-black flex items-center justify-center gap-1.5 active:scale-95 font-sans ${autoDetectScannerMode ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40 shadow-sm" : "bg-slate-800 hover:bg-slate-755 text-slate-400 border-slate-700"}`}',
    'className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all text-[9px] sm:text-[11px] font-black flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 font-sans leading-tight text-center ${autoDetectScannerMode ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40 shadow-sm" : "bg-slate-800 hover:bg-slate-755 text-slate-400 border-slate-700"}`}'
)

# fix Auto Capture button
text = text.replace(
    'className={`px-4 py-3 rounded-xl border transition-all text-[11px] font-black flex items-center justify-center gap-1.5 active:scale-95 font-sans ${autoCapture ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40 shadow-sm" : "bg-slate-800 hover:bg-slate-755 text-slate-400 border-slate-700"}`}',
    'className={`col-span-2 sm:col-span-1 px-2 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all text-[9px] sm:text-[11px] font-black flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 font-sans leading-tight text-center ${autoCapture ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40 shadow-sm" : "bg-slate-800 hover:bg-slate-755 text-slate-400 border-slate-700"}`}'
)

# fix Finalize Scan Workspace button
text = text.replace(
    'className="w-full py-3 bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 text-center active:scale-95 flex items-center justify-center gap-1.5"',
    'className="w-full py-2.5 sm:py-3 px-2 bg-indigo-650 hover:bg-indigo-550 text-white text-[10px] sm:text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 text-center active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 leading-tight"'
)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Camera Controls Fixed")
