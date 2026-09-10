import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# fix uploadZoneClass padding
text = text.replace(
    'const uploadZoneClass = "border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center',
    'const uploadZoneClass = "border-2 border-dashed rounded-[20px] sm:rounded-[32px] p-4 sm:p-8 flex flex-col items-center justify-center'
)

# fix Upload Guidelines tooltip width
text = text.replace(
    'className="absolute top-10 left-1/2 -translate-x-1/2 w-72 bg-slate-900 border border-slate-850',
    'className="absolute top-10 left-1/2 -translate-x-1/2 w-[280px] sm:w-72 max-w-[90vw] bg-slate-900 border border-slate-850'
)

# fix Alignment tooltip width
text = text.replace(
    'className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 sm:w-80 pointer-events-auto z-30 select-none"',
    'className="absolute -top-12 left-1/2 -translate-x-1/2 w-full sm:w-80 max-w-[90vw] pointer-events-auto z-30 select-none flex justify-center"'
)

# text size inside alignment tooltips
text = text.replace(
    'text-[11px] font-black tracking-wide justify-center animate-bounce"',
    'text-[9px] sm:text-[11px] font-black tracking-wide justify-center animate-bounce text-center"'
)
text = text.replace(
    'text-[11px] font-black tracking-wide justify-center animate-pulse"',
    'text-[9px] sm:text-[11px] font-black tracking-wide justify-center animate-pulse text-center"'
)
text = text.replace(
    'text-[12px] font-black tracking-normal justify-center scale-105 transition-all"',
    'text-[10px] sm:text-[12px] font-black tracking-normal justify-center scale-105 transition-all text-center"'
)

# fix Zoom Control slider width
text = text.replace(
    '<div className="absolute bottom-4 right-4 z-30 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-750 flex items-center gap-2 text-white text-[10px] font-bold shadow-2xl pointer-events-auto">',
    '<div className="absolute bottom-4 right-2 sm:right-4 z-30 bg-slate-950/85 backdrop-blur-md px-2 sm:px-3.5 py-2 rounded-xl sm:rounded-2xl border border-slate-750 flex items-center gap-1 sm:gap-2 text-white text-[9px] sm:text-[10px] font-bold shadow-2xl pointer-events-auto max-w-[95%] overflow-hidden">'
)
text = text.replace(
    '<input\n                          type="range"\n                          min="1"\n                          max="4"\n                          step="0.1"\n                          value={docDigitalZoom}\n                          onChange={(e) => setDocDigitalZoom(parseFloat(e.target.value))}\n                          className="w-20 sm:w-24 accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"\n                        />',
    '<input\n                          type="range"\n                          min="1"\n                          max="4"\n                          step="0.1"\n                          value={docDigitalZoom}\n                          onChange={(e) => setDocDigitalZoom(parseFloat(e.target.value))}\n                          className="w-16 sm:w-24 accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"\n                        />'
)

# fix Alignment Guides text layer
text = text.replace(
    'text-[10px] uppercase tracking-widest px-3 py-1.5',
    'text-[8px] sm:text-[10px] uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5'
)
text = text.replace(
    'text-[11px] text-emerald-100 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
    'text-[9px] sm:text-[11px] text-emerald-100 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Scanner Fixed")
