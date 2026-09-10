import re

with open("src/components/WhatsAppSupportButton.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    'className="mb-4 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 relative overflow-hidden"',
    'className="mb-4 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 relative overflow-hidden"'
)

with open("src/components/WhatsAppSupportButton.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("WA Fixed")
