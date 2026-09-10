import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """          <button
            onClick={() => handleTabChange("apps")}"""
replacement = """          <button
            onClick={() => handleTabChange("notary")}
            className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${activeTab === "notary" ? "bg-red-600 text-white shadow-xl shadow-red-200 dark:shadow-red-900/20 md:translate-x-2 border-2 border-red-500" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:md:translate-x-1 border-2 border-transparent"}`}
          >
            <span className="flex items-center gap-3">
              <Stamp
                size={18}
                className={activeTab === "notary" ? "animate-pulse" : ""}
              />{" "}
              Notary Public
            </span>
            {activeTab === "notary" && (
              <div className="w-2 h-2 rounded-full bg-white opacity-80" />
            )}
          </button>
          
          <button
            onClick={() => handleTabChange("apps")}"""

content = content.replace(target, replacement)

target2 = 'import { GovernmentServicesCenter } from "./components/GovernmentServicesCenter";'
replacement2 = target2 + '\nimport CentralNotaryApp from "./components/CentralNotaryApp";'
content = content.replace(target2, replacement2)

target3 = '{activeTab === "profile" ? ('
replacement3 = '{activeTab === "notary" ? (\n              <div className="my-8 animate-fadeIn"><CentralNotaryApp user={user} /></div>\n            ) : activeTab === "profile" ? ('
content = content.replace(target3, replacement3)

with open("src/App.tsx", "w") as f:
    f.write(content)
