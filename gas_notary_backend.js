/**
 * PROCESS_NOTARY_APPLICATION
 * Handles incoming Notary applications, creates strict Drive folders,
 * calls Cloud Vision OCR, translates to Hindi, and logs to Sheets.
 */
function PROCESS_NOTARY_APPLICATION(payload) {
  try {
    const { 
      mobile, email, 
      residenceState, residenceDistrict, 
      nameEn, dob, gender, guardianNameEn, guardianType,
      category, officeLine1, residenceLine1, pan, 
      education, barEnrolment, yearsOfPractice, desiredPracticeArea,
      documentBlobs, // Assuming documents are passed as base64 blobs
      customerVerified // Boolean
    } = payload;
    
    // 1. Google Drive Architecture (GAS)
    // [Root_AOS_Folder] -> Notary_Applications -> [State_Name] -> [AdvocateName_SanadNumber]
    const rootFolderId = "YOUR_ROOT_FOLDER_ID"; // Replace with actual root ID
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    
    // Get or Create "Notary_Applications"
    let notaryFolder;
    const notaryFolderIter = rootFolder.getFoldersByName("Notary_Applications");
    if (notaryFolderIter.hasNext()) {
      notaryFolder = notaryFolderIter.next();
    } else {
      notaryFolder = rootFolder.createFolder("Notary_Applications");
    }
    
    // Get or Create State Folder
    let stateFolder;
    const stateFolderIter = notaryFolder.getFoldersByName(residenceState || "Unknown_State");
    if (stateFolderIter.hasNext()) {
      stateFolder = stateFolderIter.next();
    } else {
      stateFolder = notaryFolder.createFolder(residenceState || "Unknown_State");
    }
    
    // Create Advocate specific folder
    const safeSanad = (barEnrolment || "UNKNOWN").replace(/\//g, "_");
    const advocateFolderName = `${nameEn}_${safeSanad}`.replace(/[^a-zA-Z0-9_ -]/g, "");
    const finalFolder = stateFolder.createFolder(advocateFolderName);
    
    // Save documents
    const savedDocUrls = {};
    if (documentBlobs && typeof documentBlobs === 'object') {
      for (const [key, base64Data] of Object.entries(documentBlobs)) {
        const byteCharacters = Utilities.base64Decode(base64Data);
        // extension mapping can be improved
        const ext = ["photo", "signature"].includes(key) ? "jpg" : "pdf";
        const mime = ["photo", "signature"].includes(key) ? "image/jpeg" : "application/pdf";
        const blob = Utilities.newBlob(byteCharacters, mime, `${key}.${ext}`);
        const file = finalFolder.createFile(blob);
        savedDocUrls[key] = file.getUrl();
      }
    }
    
    // 2. LanguageApp Auto-Translation (English -> Hindi)
    const translateToHi = (text) => text ? LanguageApp.translate(text, 'en', 'hi') : "";
    
    const nameHi = translateToHi(nameEn);
    const guardianNameHi = translateToHi(guardianNameEn);
    const officeAddressHi = translateToHi(officeLine1);
    const residenceAddressHi = translateToHi(residenceLine1);
    
    // 3. Google Sheets Mapping
    const sheetId = "YOUR_SPREADSHEET_ID"; // Replace with actual Sheet ID
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName("Notary_Applications");
    
    if (!sheet) {
      sheet = ss.insertSheet("Notary_Applications");
      sheet.appendRow([
        "Timestamp", "Application ID", "Status", "Name (EN)", "Name (HI)",
        "Mobile", "Email", "State", "District", "DOB", "Gender", "Category", 
        "Guardian Type", "Guardian Name (EN)", "Guardian Name (HI)", "Office Addr (EN)", "Office Addr (HI)",
        "Res Addr (EN)", "Res Addr (HI)", "PAN", "Education", "Bar Enrolment", 
        "Years of Practice", "Desired Area", "Drive Folder",
        "Customer Verified", "Verification Timestamp"
      ]);
    }
    
    const applicationId = "AOS-NOTARY-" + Math.floor(1000 + Math.random() * 9000);
    const status = "Documents Received"; // Initial tracking status
    const currentTimestamp = new Date();
    
    sheet.appendRow([
      currentTimestamp, applicationId, status, nameEn, nameHi,
      mobile, email, residenceState, residenceDistrict, dob, gender, category,
      guardianType, guardianNameEn, guardianNameHi, officeLine1, officeAddressHi,
      residenceLine1, residenceAddressHi, pan, education, barEnrolment,
      yearsOfPractice, desiredPracticeArea, finalFolder.getUrl(),
      customerVerified ? "TRUE" : "FALSE", customerVerified ? currentTimestamp : ""
    ]);
    
    // Trigger initial Webhook alert
    sendWhatsAppAlert(mobile, applicationId, status, nameEn);
    
    return {
      success: true,
      applicationId: applicationId,
      status: status,
      extractedAndTranslated: {
        nameHi, guardianNameHi, officeAddressHi, residenceAddressHi
      },
      folderUrl: finalFolder.getUrl()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * sendWhatsAppAlert
 * Sends a WhatsApp notification to the Advocate using an external Webhook (e.g. Interakt / Twilio)
 */
function sendWhatsAppAlert(mobile, applicationId, status, name) {
  try {
    const webhookUrl = "https://your-whatsapp-webhook-provider.com/api/send";
    const payload = {
      to: mobile,
      type: "template",
      template: {
        name: "notary_status_update",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: name },
              { type: "text", text: applicationId },
              { type: "text", text: status }
            ]
          }
        ]
      }
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer YOUR_WHATSAPP_API_KEY"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(webhookUrl, options);
  } catch (error) {
    console.error("WhatsApp Alert Failed: " + error.message);
  }
}

/**
 * updateOrderStatus
 * Callable function to update order status, e.g. from Admin Dashboard
 */
function updateOrderStatus(applicationId, newStatus) {
  try {
    const sheetId = "YOUR_SPREADSHEET_ID"; 
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName("Notary_Applications");
    
    const data = sheet.getDataRange().getValues();
    // Assuming Application ID is in Column B (index 1), Mobile in Col F (index 5), Name in Col D (index 3)
    let rowIndex = -1;
    let mobile = "";
    let name = "";
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === applicationId) {
        rowIndex = i + 1; // 1-indexed for sheets
        mobile = data[i][5];
        name = data[i][3];
        break;
      }
    }
    
    if (rowIndex > -1) {
      // Status is in Column C (index 2) -> Column 3
      sheet.getRange(rowIndex, 3).setValue(newStatus);
      
      // Trigger Webhook alert
      if (mobile) {
        sendWhatsAppAlert(mobile, applicationId, newStatus, name);
      }
      
      return { success: true, message: `Status updated to ${newStatus}` };
    } else {
      return { success: false, message: "Application ID not found" };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
