const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace import
content = content.replace(
  "import { GoogleGenerativeAI } from '@google/generative-ai';", 
  "import { GoogleGenAI } from '@google/genai';"
);

// Replace initialization and routes 
const oldRoutes = `const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// OCR Processing
app.post('/api/vault/ocr', authenticateToken, async (req: any, res) => {
  const { fileLink, mimeType } = req.body;
  if (!fileLink) return res.status(400).json({ success: false, error: 'File link required' });

  try {
    // 1. Fetch file content from link
    const fileRes = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(fileRes.data, 'binary').toString('base64');

    // 2. Process with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Extract all text from this document accurately. Organize into readable sections if possible. If it's an ID card, extract key details like Name, ID Number, etc.",
      {
        inlineData: {
          data: base64,
          mimeType: mimeType || 'image/jpeg'
        }
      }
    ]);

    const text = result.response.text();
    res.json({ success: true, text });
  } catch (err: any) {
    console.error('OCR Error:', err.message);
    res.status(500).json({ success: false, error: 'OCR failed: ' + (err.message || 'Unknown error') });
  }
});

// OCR AI endpoint
app.post('/api/ai/ocr', authenticateToken, async (req: any, res) => {
  const { content, mimeType } = req.body;
  if (!content) return res.status(400).json({ success: false, error: 'Content required' });

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    // Gemini supports image and pdf analysis directly
    const part = {
      inlineData: {
        data: content,
        mimeType: mimeType || 'image/jpeg'
      }
    };

    const prompt = \`Extract all text from this document. Pay special attention to accurately extracting handwritten text, complex layouts, and tables. Return a JSON object with these exact keys:
{
  "extractedText": "The plain text extracted",
  "markdownText": "The text formatted as nice Markdown, preserving headings, sections, and complex layouts",
  "summary": "A concise summary of the document"
}\`;
    
    const result = await model.generateContent([prompt, part]);
    const jsonText = result.response.text();
    const data = JSON.parse(jsonText);
    
    res.json({ success: true, extractedText: data.extractedText || data.text || "", markdownText: data.markdownText || "", summary: data.summary || "" });
  } catch (err: any) {
    console.error('OCR Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Translation AI endpoint
app.post('/api/ai/translate', authenticateToken, async (req: any, res) => {
  const { text, sourceLang, targetLang } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Text required' });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = \`Translate the following text from \${sourceLang || 'auto'} to \${targetLang}. Preserve formatting and professional tone.
    Text: \${text}\`;
    
    const result = await model.generateContent(prompt);
    res.json({ success: true, translatedText: result.response.text() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// General AI Generation
app.post('/api/ai/generate', authenticateToken, async (req: any, res) => {
  const { prompt } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    res.json({ success: true, text: result.response.text() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

const newRoutes = `let aiInstance: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  }
  return aiInstance;
}

// OCR Processing
app.post('/api/vault/ocr', authenticateToken, async (req: any, res) => {
  const { fileLink, mimeType } = req.body;
  if (!fileLink) return res.status(400).json({ success: false, error: 'File link required' });

  try {
    const ai = getGenAI();
    // 1. Fetch file content from link
    const fileRes = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(fileRes.data, 'binary').toString('base64');

    // 2. Process with Gemini
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { text: "Extract all text from this document accurately. Organize into readable sections if possible. If it's an ID card, extract key details like Name, ID Number, etc." },
          { inlineData: { data: base64, mimeType: mimeType || 'image/jpeg' } }
        ]
      }
    });

    const text = result.text;
    res.json({ success: true, text });
  } catch (err: any) {
    console.error('OCR Error:', err.message);
    res.status(500).json({ success: false, error: 'OCR failed: ' + (err.message || 'Unknown error') });
  }
});

// OCR AI endpoint
app.post('/api/ai/ocr', authenticateToken, async (req: any, res) => {
  const { content, mimeType } = req.body;
  if (!content) return res.status(400).json({ success: false, error: 'Content required' });

  try {
    const ai = getGenAI();
    const prompt = \`Extract all text from this document. Pay special attention to accurately extracting handwritten text, complex layouts, and tables. Return a JSON object with these exact keys:
{
  "extractedText": "The plain text extracted",
  "markdownText": "The text formatted as nice Markdown, preserving headings, sections, and complex layouts",
  "summary": "A concise summary of the document",
  "wordCount": "approximate number of words as a number"
}\`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: content, mimeType: mimeType || 'image/jpeg' } }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    
    const jsonText = result.text;
    const data = JSON.parse(jsonText || "{}");
    
    res.json({ success: true, extractedText: data.extractedText || data.text || "", markdownText: data.markdownText || "", summary: data.summary || "", wordCount: data.wordCount || 0 });
  } catch (err: any) {
    console.error('OCR Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Translation AI endpoint
app.post('/api/ai/translate', authenticateToken, async (req: any, res) => {
  const { text, sourceLang, targetLang } = req.body;
  if (!text) return res.status(400).json({ success: false, error: 'Text required' });

  try {
    const ai = getGenAI();
    const prompt = \`Translate the following text from \${sourceLang || 'auto'} to \${targetLang}. Preserve formatting and professional tone.
    Text: \${text}\`;
    
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    res.json({ success: true, translatedText: result.text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// General AI Generation
app.post('/api/ai/generate', authenticateToken, async (req: any, res) => {
  const { prompt } = req.body;
  try {
    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    res.json({ success: true, text: result.text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

content = content.replace(oldRoutes, newRoutes);
fs.writeFileSync('server.ts', content);
console.log('Fixed Server.ts routes!');
