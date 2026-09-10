// AOS Notary Application System - Google Apps Script (Backend)

function sendNotaryStatusEmail(email, applicantName, status, applicationId) {
  if (!email) return;
  try {
    var subject = "⚖️ Notary Application #" + applicationId + " Status Update: " + status;
    var body = "Dear " + (applicantName || "Advocate") + ",\n\n" +
      "The status of your Central Notary Public Application (#" + applicationId + ") has been updated to: " + status + ".\n\n";
    if (status === "Pending Admin Draft") {
      body += "Great news! Our administrative desk has verified your document OCR scan and started compiling your official Notary Draft.\n\n";
    }
    body += "You can track real-time verification progress on your Advocate Dashboard.\n\nBest regards,\nAmit Online Services Legal Desk";
    
    if (typeof MailApp !== 'undefined') {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body
      });
      console.log("Email sent to " + email + " for #" + applicationId);
    }
  } catch (e) {
    console.error("Failed to send status email: " + e.toString());
  }
}

// Update Order Status - including WhatsApp Webhook placeholder
function updateOrderStatus(orderId, status) {
  // 1. WhatsApp Integration Placeholder (e.g., Interakt / Twilio / Meta API)
  const webhookUrl = "https://api.whatsapp.provider.com/v1/messages"; // Placeholder
  const payload = {
    messaging_product: "whatsapp",
    to: "<Advocate_Mobile_Number>",
    type: "template",
    template: {
      name: "status_update_alert",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: orderId },
            { type: "text", text: status }
          ]
        }
      ]
    }
  };

  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer YOUR_WHATSAPP_API_TOKEN"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch(e) {
    console.error("WhatsApp Webhook failed:", e);
  }
}

// Main handler for form submission
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { formData, files } = data; // files would be base64 encoded pdfs/images
    
    // 1. Google Drive Folder Routing
    const rootFolderId = "YOUR_ROOT_FOLDER_ID_HERE"; // [Root_AOS_Folder]
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    
    // Check for "Notary_Applications" folder
    let notaryFolder;
    const nIter = rootFolder.getFoldersByName("Notary_Applications");
    if (nIter.hasNext()) {
      notaryFolder = nIter.next();
    } else {
      notaryFolder = rootFolder.createFolder("Notary_Applications");
    }
    
    // Check for State folder
    const stateName = formData.residenceState || "Unknown_State";
    let stateFolder;
    const sIter = notaryFolder.getFoldersByName(stateName);
    if (sIter.hasNext()) {
      stateFolder = sIter.next();
    } else {
      stateFolder = notaryFolder.createFolder(stateName);
    }
    
    // Create Advocate specific folder
    const advocateFolderName = `${formData.nameEn}_${formData.barEnrolment.replace(/\//g, "-")}`;
    const advocateFolder = stateFolder.createFolder(advocateFolderName);
    
    // 2. Save uploaded files to the Drive Folder
    const uploadedFileLinks = {};
    if (files) {
      for (const [key, base64Content] of Object.entries(files)) {
        const decoded = Utilities.base64Decode(base64Content.split(",")[1] || base64Content);
        const blob = Utilities.newBlob(decoded, getMimeType(key), `${key}_${formData.nameEn}`);
        const file = advocateFolder.createFile(blob);
        uploadedFileLinks[key] = file.getUrl();
      }
    }
    
    // 3. Google Sheet Mapping
    const ssId = "YOUR_SPREADSHEET_ID_HERE";
    const sheet = SpreadsheetApp.openById(ssId).getSheetByName("Notary_Applications");
    if (!sheet) {
      SpreadsheetApp.openById(ssId).insertSheet("Notary_Applications");
      // Add Headers logic here if sheet is new...
    }
    
    // Insert final reviewed data
    sheet.appendRow([
      new Date(),
      formData.nameEn,
      formData.nameHi,
      formData.guardianType,
      formData.guardianNameEn,
      formData.guardianNameHi,
      formData.dob,
      formData.gender,
      formData.category,
      formData.pwbd,
      formData.pan,
      formData.residenceLine1,
      formData.residenceState,
      formData.mobile,
      formData.email,
      formData.education,
      formData.barEnrolment,
      formData.enrolmentDate,
      formData.itrAssessee,
      formData.currentPracticeArea,
      formData.desiredPracticeArea,
      "Documents Received", // Initial Status
      advocateFolder.getUrl(), // Folder Link
      JSON.stringify(uploadedFileLinks)
    ]);
    
    // Optional: Trigger WhatsApp Alert for creation
    updateOrderStatus(`NOTARY-${new Date().getTime()}`, "Documents Received");
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      folderUrl: advocateFolder.getUrl() 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// AI Translation Helper mapping
function translateToHindi(englishText) {
  if (!englishText) return "";
  return LanguageApp.translate(englishText, 'en', 'hi');
}

function getMimeType(key) {
  if (key === 'photo' || key === 'signature') return MimeType.JPEG;
  return MimeType.PDF;
}
