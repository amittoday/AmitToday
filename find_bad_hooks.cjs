const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

console.log("Analyzing src/App.tsx for Hook calls...");

// Find functions
const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>)/g;
const functions = [];
let match;
while ((match = funcRegex.exec(content)) !== null) {
  const name = match[1] || match[2];
  if (name) {
    functions.push({ name, index: match.index });
  }
}

// Sort functions by index
functions.sort((a, b) => a.index - b.index);

lines.forEach((line, index) => {
  const cleanLine = line.trim();
  if (
    cleanLine.includes('useState(') ||
    cleanLine.includes('useEffect(') ||
    cleanLine.includes('useContext(') ||
    cleanLine.includes('useRef(') ||
    cleanLine.includes('useMemo(') ||
    cleanLine.includes('useCallback(') ||
    cleanLine.includes('useNavigate(') ||
    cleanLine.includes('useLocation(')
  ) {
    // Find which function boundary this line belongs to
    // Calculate character index in the file
    let charIndex = 0;
    for (let i = 0; i < index; i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }
    charIndex += line.indexOf(cleanLine);

    let enclosingFunc = null;
    for (let f = functions.length - 1; f >= 0; f--) {
      if (functions[f].index <= charIndex) {
        enclosingFunc = functions[f];
        break;
      }
    }

    if (enclosingFunc) {
      const fName = enclosingFunc.name;
      // Is it a helper function (starts with lowercase and not a known hook, and not an uppercase component)?
      const isComponent = fName[0] === fName[0].toUpperCase();
      const isHook = fName.startsWith('use') && fName[3] === fName[3]?.toUpperCase();
      
      if (!isComponent && !isHook) {
        console.log(`[VIOLATION] Hook in non-component/non-hook function "${fName}" at line ${index + 1}:`);
        console.log(`  ${cleanLine}`);
      }
    } else {
      console.log(`[VIOLATION] Hook at global scope at line ${index + 1}:`);
      console.log(`  ${cleanLine}`);
    }
  }
});
