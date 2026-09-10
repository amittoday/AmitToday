import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    'className="absolute right-0 top-full mt-3 w-80 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-2xl p-4 border border-indigo-500/40 z-[110] text-left"',
    'className="absolute right-0 top-full mt-3 w-[280px] max-w-[calc(100vw-2rem)] sm:w-80 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-2xl p-4 border border-indigo-500/40 z-[110] text-left"'
)

text = text.replace(
    'className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-left font-sans"',
    'className="absolute right-0 mt-3 w-[280px] max-w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-left font-sans"'
)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Dropdowns Fixed")
