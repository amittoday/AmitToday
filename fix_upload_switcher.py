import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    '<div className="flex bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm select-none">',
    '<div className="flex flex-col sm:flex-row bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm select-none w-full max-w-[280px] sm:max-w-none">'
)
text = text.replace(
    '<Upload size={14} /> Upload File Attachment',
    '<Upload size={14} /> <span className="hidden sm:inline">Upload File Attachment</span><span className="sm:hidden">Upload File</span>'
)
text = text.replace(
    '<Camera size={14} /> Take Photo / Camera Scan',
    '<Camera size={14} /> <span className="hidden sm:inline">Take Photo / Camera Scan</span><span className="sm:hidden">Scan Photo</span>'
)
# Button paddings
text = text.replace(
    'className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${uploadMethod === "upload"',
    'className={`w-full justify-center sm:w-auto px-3 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${uploadMethod === "upload"'
)
text = text.replace(
    'className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${uploadMethod === "camera"',
    'className={`w-full justify-center sm:w-auto px-3 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${uploadMethod === "camera"'
)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Upload Switcher Fixed")
