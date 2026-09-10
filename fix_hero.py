import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Replace text-6xl md:text-8xl with text-4xl sm:text-5xl md:text-7xl
text = text.replace(
    'className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tight mb-8"',
    'className="text-[clamp(2.25rem,10vw,6rem)] font-black text-slate-900 dark:text-white leading-[1.1] md:leading-[0.95] tracking-tight mb-6 md:mb-8"'
)

# Also fix the paragraph if needed
text = text.replace(
    'className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-12 max-w-lg"',
    'className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 md:mb-12 max-w-lg"'
)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Hero Fixed")
