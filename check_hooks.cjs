const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

console.log("Analyzing App.tsx hook calls...");

// Track scope using simple stack matching curly braces and function signatures
let currentFuncs = [];
let braceDepth = 0;

lines.forEach((line, lineIdx) => {
  const lineNum = lineIdx + 1;
  const trimmed = line.trim();

  // Check function definition
  const fnMatch = line.match(/(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/);
  
  if (trimmed.includes('useState(') || trimmed.includes('useEffect(') || trimmed.includes('useRef(') || trimmed.includes('useMemo(') || trimmed.includes('useCallback(') || trimmed.includes('useContext(')) {
    // Check if hook is called inside an event handler, helper function, or loop/if statement
    console.log(`Line ${lineNum}: ${trimmed.substring(0, 80)}`);
  }
});
