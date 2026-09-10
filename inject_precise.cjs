const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

// Modify create-order-dsc to capture extractedText and translatedText
serverContent = serverContent.replace(
  'orderId: internalOrderId,',
  \`orderId: internalOrderId,
        extractedText: req.body.extractedText,
        translatedText: req.body.translatedText,\`
);

fs.writeFileSync('server.ts', serverContent);

let gasContent = fs.readFileSync('GAS_BACKEND.gs', 'utf8');
gasContent = gasContent.replace(
  "  // 2. Create Auto-draft Docs explicitly",
  \`  const extractedText = body.extractedText || '';
  const translatedText = body.translatedText || '';
  const textContent = translatedText ? translatedText : extractedText;

  // 2. Create Auto-draft Docs explicitly
  const docFile = DocumentApp.create('Draft_' + orderId);
  const docBody = docFile.getBody();
  if (textContent) {
    docBody.insertParagraph(0, textContent);
  }
  docFile.saveAndClose();

  const docId = docFile.getId();
  const driveDoc = DriveApp.getFileById(docId);
  driveDoc.moveTo(tempFolder);

  // 3. Create PDF version of the Draft
  const pdfBlob = driveDoc.getAs(MimeType.PDF);
  pdfBlob.setName('Draft_' + orderId + '.pdf');
  tempFolder.createFile(pdfBlob);
\`
);
fs.writeFileSync('GAS_BACKEND.gs', gasContent);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  "setUploadData({",
  \`// Additional pre-processing if translation
      let translatedText = '';
      if (activeService === 'Translation' && ocrRes.data.extractedText) {
         try {
           const trRes = await axios.post('/api/ai/translate', { text: ocrRes.data.extractedText, targetLang: 'Gujarati' }, { headers: { Authorization: \\\`Bearer \\\${user?.token || ''}\\\` } });
           translatedText = trRes.data.translatedText || '';
         } catch(e) {}
      }

      setUploadData({
        extractedText: ocrRes.data.extractedText,
        translatedText,
\`
);
appContent = appContent.replace(
  "amount: uploadData.amount,",
  \`amount: uploadData.amount,
            extractedText: uploadData.extractedText,
            translatedText: uploadData.translatedText,\`
);
fs.writeFileSync('src/App.tsx', appContent);

console.log('Successfully injected exact Phase 1 logic');
