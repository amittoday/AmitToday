import re

with open("src/components/VoiceDictationWidget.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    'className="mb-3 w-80 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-4 border border-indigo-500/30 text-left"',
    'className="mb-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-4 border border-indigo-500/30 text-left"'
)

with open("src/components/VoiceDictationWidget.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Voice Fixed")
