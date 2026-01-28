/**
 * THE WORKSHOP | MASTER CONTROLLER v10.0
 * 100% SHARED DRIVE COMPATIBLE
 */

function doGet(e) {
  if (e && e.parameter && e.parameter.cleanup === 'true') {
     try {
       const result = diagnoseAndCleanNTV();
       return ContentService.createTextOutput(result);
     } catch (err) {
       return ContentService.createTextOutput("Error running cleanup: " + err.toString());
     }
  }

  if (e && e.parameter && e.parameter.setup === 'true') {
     try {
       const result = createMasterNTVLog();
       return ContentService.createTextOutput("SETUP COMPLETE: " + result);
     } catch (err) {
       return ContentService.createTextOutput("Error running setup: " + err.toString());
     }
  }

  if (e && e.parameter && e.parameter.test_access === 'true') {
     try {
        const folderId = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
        const f = DriveApp.getFolderById(folderId);
        // Also list children to verify deep access
        const children = f.getFolders();
        let childNames = [];
        let count = 0;
        while(children.hasNext() && count < 5) {
           childNames.push(children.next().getName());
           count++;
        }
        return ContentService.createTextOutput(`SUCCESS: Connected to '${f.getName()}'\nContents sample: ${childNames.join(', ')}`);
     } catch (err) {
        return ContentService.createTextOutput("FAILURE: " + err.toString());
     }
  }
  if (e && e.parameter && e.parameter.upload === 'true') {
     return HtmlService.createTemplateFromFile('uploader').evaluate()
         .setTitle('Workshop | Data Primer')
         .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  if (e && e.parameter && e.parameter.links === 'true') {
     return HtmlService.createTemplateFromFile('linker').evaluate()
         .setTitle('Workshop | System Provisioning')
         .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  if (e && e.parameter && e.parameter.recover === 'true') {
     return ContentService.createTextOutput(manualKeyKeeperRecovery());
  }

  return HtmlService.createTemplateFromFile('index').evaluate()
      .setTitle('The Workshop | PropAlliance')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function manualKeyKeeperRecovery() {
  const ssId = '1lcg4IgFpQGUrfeJLnhkyINphU2v-L0x2fv6lImFjMNk';
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  try {
    const file = DriveApp.getFileById(ssId);
    if(file.isTrashed()) file.setTrashed(false);
    const hub = DriveApp.getFolderById(HUB_ID);
    const folderSearch = hub.getFoldersByName("Key Keeper 2000");
    if (folderSearch.hasNext()) {
      const target = folderSearch.next();
      file.moveTo(target);
      return "SUCCESS: Key Keeper Spreadsheet moved to Hub.";
    }
    return "ERROR: Could not find 'Key Keeper 2000' folder.";
  } catch (e) { return "CRITICAL ERROR: " + e.toString(); }
}

function getProjectList() {
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  const hub = DriveApp.getFolderById(HUB_ID);
  const folders = hub.getFolders();
  const list = [];
  while (folders.hasNext()) {
    list.push(folders.next().getName());
  }
  return list;
}

function provisionProject(projectName) {
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  const hub = DriveApp.getFolderById(HUB_ID);
  const folders = hub.getFoldersByName(projectName);
  if (!folders.hasNext()) return { status: 'error', message: 'Folder not found' };
  const folder = folders.next();
  const config = getData().projects.find(p => p.title.toLowerCase().includes(projectName.toLowerCase()) || projectName.toLowerCase().includes(p.title.toLowerCase()));
  let results = [];
  
  if (config && config.webApp) {
     results.push(createLauncherSheet(folder, "🚀 LAUNCH " + config.title.toUpperCase(), config.webApp));
  }
  
  const sheets = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  while (sheets.hasNext()) {
     const ss = sheets.next();
     if (ss.getName().includes("LAUNCH")) continue;
     results.push(createLauncherSheet(folder, "📊 DATA SHEET | " + ss.getName().toUpperCase(), ss.getUrl()));
  }
  return { status: 'success', results: results };
}

function createLauncherSheet(parentFolder, title, targetUrl) {
  const existing = parentFolder.getFilesByName(title);
  if (existing.hasNext()) return "Verified: " + title;
  const ss = SpreadsheetApp.create(title);
  const sheet = ss.getSheets()[0];
  sheet.getRange("B2").setValue("CLICK BELOW TO OPEN:");
  sheet.getRange("B2").setFontWeight("bold").setFontSize(14);
  sheet.getRange("B4").setRichTextValue(SpreadsheetApp.newRichTextValue().setText("▶ OPEN SYSTEM").setLinkUrl(targetUrl).build());
  sheet.getRange("B4").setFontSize(18).setFontWeight("bold").setBackground("#d9ead3").setHorizontalAlignment("center");
  sheet.getRange("B6").setRichTextValue(SpreadsheetApp.newRichTextValue().setText("🏠 BACK TO WORKSHOP").setLinkUrl("https://script.google.com/macros/s/AKfycbyTCbMk-mf4nk-Bh3ySpibJK9uAPwU874T2imLfD4npEGM8m8QjdqhnIkdK4V7sIYNk/exec").build());
  const file = DriveApp.getFileById(ss.getId());
  file.moveTo(parentFolder);
  return "Created: " + title;
}

function getData() {
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  const driveRoot = 'https://drive.google.com/drive/u/0/folders/' + HUB_ID;
  
  const configs = [
    { title: 'Make Ready Board', priority: 1, webApp: 'https://script.google.com/macros/s/AKfycbyPog4jXWO_ORUfVuILEqsqba_6koEOGIm12Pyi-bfEjgWnKL4pU2Fn5Ef_AGKhJVGy/exec' },
    { title: 'Utility Tracker', priority: 2, webApp: 'https://script.google.com/macros/s/AKfycbygWq9mWBn902oHQr5xyc94yVJcS25XhT2Hzi3PWERqwmJP_zgPvnXhHqmXRgo8dJJl/exec' },
    { title: 'Key Keeper 2000', priority: 3, webApp: 'https://script.google.com/macros/s/AKfycbwA8s_1IOwfZWGlL3v9rDO-N4nej1N5AGeREb4aIAK5Tk0gEApiNTbBCfi4ABc-EqdE/exec' },
    { title: 'Leasing Fee Audit', priority: 4, webApp: 'https://script.google.com/macros/s/AKfycbwOL0ChXoSyj8yHODzvJZbxK1eyAFGSOtbF2WkFSBJV1Zr3r47nQLAXsmcPCqv71gBfQA/exec' },
    { title: 'Utility Bill Back Tool', priority: 5, webApp: 'https://script.google.com/macros/s/AKfycbyKrqJap-T99B76N0R2n9Hw1iD_C2-9e-kOdE-Dj4etbdJHMcGMutOuoObOwx8MekHK/exec' },
    { title: 'Ice Breakers', priority: 6, webApp: 'https://script.google.com/macros/s/AKfycbxIM8Oie8S0TXajR--FMpPNLLlSZdOXZOiahdcmJTxKo6eFaJVAt46nsrNifOeTEMKF/exec' },
    { title: 'Owner Directory', priority: 7, webApp: 'https://script.google.com/macros/s/AKfycbzz21wNZSypz7tfgCzLUukBy0HG-FaWn2iRhJjs9pnvqcvVa8DbsA2fxYPMIMZ8CPsAIQ/exec' },
    { title: 'Property Directory', priority: 8, webApp: 'https://script.google.com/macros/s/AKfycbyts0lLRQcJxRVsGHttWkFmVIdzSIqqy7B8moIRatG8zmZBqt4j2i59CcSPBnR6_u1_9A/exec' },
    { title: 'Property Management Portal', priority: 9, webApp: 'https://script.google.com/macros/s/AKfycbyNep-3VLc-NPty78FCGuJh1XtOyfwz3H4MXbtpVvmWTHpdiAVTV9TZK_LpU0HTbXXrKw/exec' },
    { title: 'Demand Generator', priority: 11, webApp: 'https://script.google.com/macros/s/AKfycbzkGMUnVv2vl2-KTCAF15KWG6-Ds9Suld_atKrHKY-LV9wXGKY_g_OjGeG2f6GYXbCC/exec' }
  ];

  return { projects: configs.map(c => ({...c, id: c.title.replace(/\s+/g, '-').toLowerCase(), desc: 'Operational tool for ' + c.title, folderUrl: driveRoot})) };
}

function handleFileUpload(name, base64Data) {
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  const hub = DriveApp.getFolderById(HUB_ID);
  
  // Find "Owner & Property Database" folder
  let targetFolder = null;
  const folders = hub.getFoldersByName("Owner & Property Database");
  if(folders.hasNext()){
     targetFolder = folders.next();
  } else {
     // Search recursively or create in root? Better to put in root of Hub if not found, then Move?
     // Actually, let's create it if missing to ensure success
     targetFolder = hub.createFolder("Owner & Property Database");
  }
  
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), MimeType.CSV, name);
  const file = targetFolder.createFile(blob);
  return "Saved: " + file.getName();
}
