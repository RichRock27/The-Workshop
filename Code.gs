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

  if (e && e.parameter && e.parameter.rebuild === 'true') {
     const result = rebuildMasterIndex();
     return ContentService.createTextOutput(JSON.stringify(result));
  }

  if (e && e.parameter && e.parameter.provision_all === 'true') {
     const result = provisionAllProjects();
     return ContentService.createTextOutput(result);
  }

  const template = HtmlService.createTemplateFromFile('index');
  template.isAdmin = (e && e.parameter && e.parameter.mode === 'admin');

  return template.evaluate()
      .setTitle('The Workshop | PropAlliance')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
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
    { title: 'Make Ready Board', priority: 1, webApp: 'https://script.google.com/macros/s/AKfycbxEi4sb9uf5yEVAUjDcFJA4yh9NREhIR1psk-Hm6mzbHBUxweMmuT2SsrEir6-p9P_2/exec', scriptId: '1jty40HA6cpR7OSOUIGm9SFkZQIwL-QW8yze9frHAMuO89lEeG-ZmBGwg', repo: 'https://github.com/RichRock27/Make_Ready_Board', icon: '🧹' },
    { title: 'Utility Tracker', priority: 2, webApp: 'https://script.google.com/macros/s/AKfycbwE_d_IkcoVTv7EZGJD5PttesrtBahn361sMPcDA8Q0XtbWobTVs3BqF1NCIMHowdIM/exec', scriptId: '1THz90W4EovYZoWET9wR3BCTaKGfvg9gsyWRGBnoXvjHI-q_3ReyKu4Ux', repo: 'https://github.com/RichRock27/Utility_Tracker', icon: '⚡' },
    { title: 'Key Keeper 2000', priority: 3, webApp: 'https://script.google.com/macros/s/AKfycbzeYt_Kn-aoIbU0Dtcqnr5BM0L2HsdVeRQt33aDVXgBNyw1Ep33M1swnrSo3HhectXv/exec', scriptId: '1bKOxD7RZk1niB7WEJJAwa9pslQNbjDrVIcOtwvM2vzD6Fytr9teH_tc0', repo: 'https://github.com/RichRock27/Key_Keeper', icon: '🔑' },
    { title: 'Leasing Fee Audit', priority: 4, webApp: 'https://script.google.com/macros/s/AKfycbyzLRh_NTcGJwQsY4If9raiL6j5tSY5Z4KZ_fP4JwU31i0wqp5qy8cR3-9JT7SidmZcQw/exec', scriptId: '1CyQLPxltgr5IE_QbQKez8XP29PfnGUhkek4GoQmw30gNouNilUZS8WHj', repo: 'https://github.com/RichRock27/Unbilled_Fee_Audit', icon: '📊' },
    { title: 'Utility Bill Back Tool', priority: 5, webApp: 'https://script.google.com/macros/s/AKfycbwuS1MhQD1NyDrLouPjBNf6rQAhISI4tGF3aml3QWgBO_TqYypTTpOcNBF4zC-uq7Lu/exec', scriptId: '1Z5b-zBQYVB1im5x6a6EUqmkgn5q6Jo2makZ9gxQfz0vIsVEx1LjfK2bB', repo: 'https://github.com/RichRock27/Utility_Bill_Audit', icon: '💸' },
    { title: 'Ice Breakers', priority: 6, webApp: 'https://script.google.com/macros/s/AKfycbxIM8Oie8S0TXajR--FMpPNLLlSZdOXZOiahdcmJTxKo6eFaJVAt46nsrNifOeTEMKF/exec', scriptId: '1Yrp_TI9ldAILKZG7id9GM7SM63nuI_KsCeXjvpEuHqe6QD2fv4HF6tsb', repo: 'https://github.com/RichRock27/Ice-Breakers', icon: '❄️' },
    { title: 'Owner Directory', priority: 7, webApp: 'https://script.google.com/macros/s/AKfycbwD1tT3vfmPgMkA_Xni6iykjQMo_7w1pp-w-HlRk10eRfKLxLlZ7kUQMnxIJVl9CGu2zg/exec', scriptId: '1o5oTxWc6EeYw8QNzAJT9In3MYLpdbqfPPmc9amxnLZsSQ2BilmCTla7-', repo: 'https://github.com/RichRock27/Owner_Directory', icon: '📒' },
    { title: 'Property Directory', priority: 8, webApp: 'https://script.google.com/macros/s/AKfycbySbt4QYp503Z0g9faCL1InM1VPma8yz4k7FAPN1s1LIaFbk3uTs7A3MLx_cBHwMMeN6A/exec', scriptId: '1aeyESH70zD4a6_AGES5OdSnF4JDj-kMqEAn1sTm0pQit4wMz30gNCbG6', repo: 'https://github.com/RichRock27/Property_Directory', icon: '🏢' },
    { title: 'Property Management Portal', priority: 9, webApp: 'https://script.google.com/macros/s/AKfycbzEyLtO2ZmJ9-5bO-RM6n4mW_JnQXf0PU4A2rg4OdJu08ngfSY4v5HqL2pZ7zU2Vwog1g/exec', scriptId: '1rnQEXxDoEfmkBtZ3_08t36UsIF8BlCB5uBhXXIwdpPA3UEenLkNZH7_v', repo: 'https://github.com/RichRock27/Property_Dashboard', icon: '🌐' },
    { title: 'Vacancy Scope', priority: 10, webApp: 'https://script.google.com/macros/s/AKfycby8EXzDACY3PhHMzAqtybnFJhFW10UCTzMNHNhMtAema2W8TcO10HqtNWhZdw-zAHUqpw/exec', scriptId: '17uUoVfS4z-vWf_6V_I98-H_6b_3B_wH6', repo: 'https://github.com/RichRock27/Vacancy_Dashboard', icon: '🏠' },
    { title: 'Demand Generator', priority: 11, webApp: 'https://script.google.com/macros/s/AKfycbwQootHBXSvH0aGsYQO4RVAHieuB5fB5tjCFgs75GJfEYpONgLR6eQ4Bijfet-YcIY4/exec', scriptId: '1BNhn9j-06yzQwfsv7PXweWdsxj34FlSnYpNSeA54EtG_FRPmErlrd1ZE', repo: 'https://github.com/RichRock27/Demand_Generator', icon: '📨' },
    { title: 'Team Portal', priority: 12, webApp: 'https://script.google.com/macros/s/AKfycbxJtblVAvf97Ci8-Wj8WKojXSLTgG2use3t42uEJ1I3-aEqjJ2JXxrRZnm9LKjcui0S/exec', scriptId: '1tNEzd8xCfBP2KFnlwvgKTp-WBKqnBIiGKYNdZDiLoSDj4NFQTM6FUuPh', repo: 'https://github.com/RichRock27/Team_Portal_GAS', icon: '🎯' },
    { title: 'Check Register Audit', priority: 13, webApp: 'https://RichRock27.github.io/check-auditor', scriptId: null, repo: 'https://github.com/RichRock27/check-auditor', icon: '<img src="https://RichRock27.github.io/check-auditor/favicon.png" style="width:1.2em; height:1.2em; vertical-align:middle;" />' }
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

function provisionAllProjects() {
   const projects = getProjectList();
   const log = [];
   projects.forEach(p => {
      try {
        const res = provisionProject(p);
        log.push(p + ": " + JSON.stringify(res));
      } catch (e) {
        log.push(p + ": ERROR " + e.toString());
      }
   });
   console.log(log.join("\n"));
   return log.join("\n");
}
