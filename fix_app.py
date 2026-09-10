import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """            {activeTab === "profile" ? ("""
replacement = """            {activeTab === "notary" ? (
              <div className="my-8 animate-fadeIn"><CentralNotaryApp user={user} /></div>
            ) : activeTab === "profile" ? ("""

content = content.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)
