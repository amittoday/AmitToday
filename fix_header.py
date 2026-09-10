import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Change <div className="flex items-center gap-3"> for Actions Row to gap-1 sm:gap-3
text = text.replace(
    '        {/* Actions Row */}\n        <div className="flex items-center gap-3">',
    '        {/* Actions Row */}\n        <div className="flex items-center gap-1 sm:gap-3">'
)

# 2. Language Dropdown Button
text = text.replace(
    'className={`flex items-center gap-2 px-3 py-2 bg-slate-50',
    'className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50'
)
text = text.replace(
    '<span className="whitespace-nowrap font-bold tracking-widest">{currentLangInfo.label}</span>',
    '<span className="hidden sm:inline-block whitespace-nowrap font-bold tracking-widest">{currentLangInfo.label}</span>'
)

# 3. Profile / Login gap
text = text.replace(
    '<div className="flex items-center gap-3 pl-2">',
    '<div className="flex items-center gap-1 sm:gap-3 sm:pl-2">'
)
# Account Button
text = text.replace(
    'className={`p-3 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative z-[120] min-w-[44px] min-h-[44px]',
    'className={`p-2 sm:p-3 sm:px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer relative z-[120] min-w-[36px] sm:min-w-[44px] min-h-[36px] sm:min-h-[44px]'
)

# Order Now Button
text = text.replace(
    'className="bg-blue-600 flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-[10px]',
    'className="bg-blue-600 flex items-center gap-1 sm:gap-2 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px]'
)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Done")
