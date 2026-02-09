/**
 * THE WORKSHOP | MASTER CONTROLLER v10.0
 * 100% SHARED DRIVE COMPATIBLE
 */

function doGet(e) {
  if (e && e.parameter && e.parameter.cleanup === 'audit_links') {
     const log = [];
     const oldLog = console.log;
     console.log = (msg) => log.push(msg);
     checkLinks();
     console.log = oldLog;
     return ContentService.createTextOutput(log.join('\n'));
  }

  if (e && e.parameter && e.parameter.cleanup === 'archive_launchers') {
     try {
       const result = archiveLauncherSheets();
       return ContentService.createTextOutput(result);
     } catch (err) {
       return ContentService.createTextOutput("Error running archive: " + err.toString());
     }
  }

  if (e && e.parameter && e.parameter.cleanup === 'clean_recents') {
     try {
       const result = archiveLauncherSheets();
       return ContentService.createTextOutput(result + "\nTip: Recents will clear after those files stop being opened.");
     } catch (err) {
       return ContentService.createTextOutput("Error running clean: " + err.toString());
     }
  }

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
     results.push(createLauncherSheet(folder, "LAUNCH | " + config.title.toUpperCase(), config.webApp));
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

function archiveLauncherSheets() {
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  const hub = DriveApp.getFolderById(HUB_ID);
  const archiveName = '_ARCHIVE_LAUNCHERS';
  const existing = hub.getFoldersByName(archiveName);
  const archive = existing.hasNext() ? existing.next() : hub.createFolder(archiveName);

  const folders = hub.getFolders();
  let moved = 0;
  const patterns = [
    /^DATA SHEET\s*\|/i,
    /BACK TO WORKSHOP/i,
    /^🚀\s*LAUNCH/i
  ];

  while (folders.hasNext()) {
    const folder = folders.next();
    const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
    while (files.hasNext()) {
      const f = files.next();
      const name = f.getName();
      if (patterns.some(rx => rx.test(name))) {
        f.moveTo(archive);
        moved++;
      }
    }
  }

  return "Archived " + moved + " launcher sheets to " + archive.getName();
}

function getData() {
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  const driveRoot = 'https://drive.google.com/drive/u/0/folders/' + HUB_ID;
  const LOCAL_ROOT = 'file:///Users/richgreen/.gemini/antigravity/scratch/_ACTIVE_PROJECTS';
  const sheetMap = buildSheetMap_(HUB_ID);
  const candidateMap = buildSheetCandidates_(HUB_ID);
  const pinnedMap = getPinnedSheetMap_();
  const globalSheets = buildGlobalSheetIndex_(HUB_ID);
  const totalCandidates = Object.keys(candidateMap).reduce((acc, k) => acc + (candidateMap[k] ? candidateMap[k].length : 0), 0);
  
  const configs = [
    { title: 'Make Ready Board', priority: 1, webApp: 'https://script.google.com/macros/s/AKfycbxEi4sb9uf5yEVAUjDcFJA4yh9NREhIR1psk-Hm6mzbHBUxweMmuT2SsrEir6-p9P_2/exec', scriptId: '1jty40HA6cpR7OSOUIGm9SFkZQIwL-QW8yze9frHAMuO89lEeG-ZmBGwg', repo: 'https://github.com/RichRock27/Make_Ready_Board', icon: '🧹', localPath: LOCAL_ROOT + '/Make_Ready_Board', sheetUrl: null },
    { title: 'Utility Tracker', priority: 2, webApp: 'https://script.google.com/macros/s/AKfycbxbpQz8-bNAqM2HUNwTGvPVI-Pj5LFHj3Z8B5IMS9vihZ8U2lD8zZv1riYf0iLkxovB/exec', scriptId: '1THz90W4EovYZoWET9wR3BCTaKGfvg9gsyWRGBnoXvjHI-q_3ReyKu4Ux', repo: 'https://github.com/RichRock27/Utility_Tracker', icon: '⚡', localPath: LOCAL_ROOT + '/Utility_Tracker', sheetUrl: null },
    { title: 'Key Keeper 2000', priority: 3, webApp: 'https://script.google.com/macros/s/AKfycbzeYt_Kn-aoIbU0Dtcqnr5BM0L2HsdVeRQt33aDVXgBNyw1Ep33M1swnrSo3HhectXv/exec', scriptId: '1bKOxD7RZk1niB7WEJJAwa9pslQNbjDrVIcOtwvM2vzD6Fytr9teH_tc0', repo: 'https://github.com/RichRock27/Key_Keeper', icon: '🔑', localPath: LOCAL_ROOT + '/Key_Keeper', sheetUrl: null },
    { title: 'Leasing Fee Audit', priority: 4, webApp: 'https://script.google.com/macros/s/AKfycbyzLRh_NTcGJwQsY4If9raiL6j5tSY5Z4KZ_fP4JwU31i0wqp5qy8cR3-9JT7SidmZcQw/exec', scriptId: '1CyQLPxltgr5IE_QbQKez8XP29PfnGUhkek4GoQmw30gNouNilUZS8WHj', repo: 'https://github.com/RichRock27/Unbilled_Fee_Audit', icon: '📊', localPath: LOCAL_ROOT + '/Unbilled_Fee_Audit', sheetUrl: null },
    { title: 'Utility Bill Back Tool', priority: 5, webApp: 'https://script.google.com/macros/s/AKfycbwuS1MhQD1NyDrLouPjBNf6rQAhISI4tGF3aml3QWgBO_TqYypTTpOcNBF4zC-uq7Lu/exec', scriptId: '1Z5b-zBQYVB1im5x6a6EUqmkgn5q6Jo2makZ9gxQfz0vIsVEx1LjfK2bB', repo: 'https://github.com/RichRock27/Utility_Bill_Audit', icon: '💸', localPath: LOCAL_ROOT + '/Utility_Bill_Audit', sheetUrl: null },
    { title: 'Ice Breakers', priority: 6, webApp: 'https://script.google.com/macros/s/AKfycbxIM8Oie8S0TXajR--FMpPNLLlSZdOXZOiahdcmJTxKo6eFaJVAt46nsrNifOeTEMKF/exec', scriptId: '1Yrp_TI9ldAILKZG7id9GM7SM63nuI_KsCeXjvpEuHqe6QD2fv4HF6tsb', repo: 'https://github.com/RichRock27/Ice-Breakers', icon: '❄️', localPath: LOCAL_ROOT + '/Ice_Breakers', sheetUrl: null },
    { title: 'Owner Directory', priority: 7, webApp: 'https://script.google.com/macros/s/AKfycbwD1tT3vfmPgMkA_Xni6iykjQMo_7w1pp-w-HlRk10eRfKLxLlZ7kUQMnxIJVl9CGu2zg/exec', scriptId: '1o5oTxWc6EeYw8QNzAJT9In3MYLpdbqfPPmc9amxnLZsSQ2BilmCTla7-', repo: 'https://github.com/RichRock27/Owner_Directory', icon: '📒', localPath: LOCAL_ROOT + '/Owner_Directory', sheetUrl: null },
    { title: 'Property Directory', priority: 8, webApp: 'https://script.google.com/macros/s/AKfycbySbt4QYp503Z0g9faCL1InM1VPma8yz4k7FAPN1s1LIaFbk3uTs7A3MLx_cBHwMMeN6A/exec', scriptId: '1aeyESH70zD4a6_AGES5OdSnF4JDj-kMqEAn1sTm0pQit4wMz30gNCbG6', repo: 'https://github.com/RichRock27/Property_Directory', icon: '🏢', localPath: LOCAL_ROOT + '/Property_Directory', sheetUrl: null },
    { title: 'Property Management Portal', priority: 9, webApp: 'https://script.google.com/macros/s/AKfycbxva7WnpNDMDOguBq_u85NQxtu1IFlZy-4RfVIMBQ_nhW0iU40OPqiYn3y4SeW64OoLBA/exec', scriptId: '1rnQEXxDoEfmkBtZ3_08t36UsIF8BlCB5uBhXXIwdpPA3UEenLkNZH7_v', repo: 'https://github.com/RichRock27/Property_Dashboard', icon: '🌐', localPath: LOCAL_ROOT + '/Property_Dashboard', sheetUrl: null },
    { title: 'Vacancy Scope', priority: 10, webApp: 'https://script.google.com/macros/s/AKfycbz5Ji1-tfRbNsy_GQmp0CXdkuKQXBmbLxEvMDZD8QVtnyCyKUcXIV3t42yPFUpb57OcxA/exec', scriptId: '1ABPzIMhMJ72blESEjrhPGVtvq53PI1JzolL1rpyEwIeq5SBvfus_WhdZ', repo: 'https://github.com/RichRock27/Vacancy_Dashboard', icon: '🏠', localPath: LOCAL_ROOT + '/Vacancy_Dashboard', sheetUrl: null },
    { title: 'Demand Generator', priority: 11, webApp: 'https://script.google.com/macros/s/AKfycbwVjS2wMi6N1KkC4onYy3Hi4OrES0vwC1yCqShN1nx4gfPPClhR1g4w6OEjmTH-BHA6/exec', scriptId: '1BNhn9j-06yzQwfsv7PXweWdsxj34FlSnYpNSeA54EtG_FRPmErlrd1ZE', repo: 'https://github.com/RichRock27/Demand_Generator', icon: '📨', localPath: LOCAL_ROOT + '/Demand_Generator', sheetUrl: null },
    { title: 'Team Portal', priority: 12, webApp: 'https://script.google.com/macros/s/AKfycbwr9GqTt2ZZKu9ooZtTqNttpTZGVfdXOLtF9ulBcSxc4NKAv00SafHYNXUWTYGjYrBw/exec', scriptId: '1tNEzd8xCfBP2KFnlwvgKTp-WBKqnBIiGKYNdZDiLoSDj4NFQTM6FUuPh', repo: 'https://github.com/RichRock27/Team_Portal_GAS', icon: '🎯', localPath: LOCAL_ROOT + '/Team_Portal_GAS', sheetUrl: null },
    { title: 'Check Register Audit', priority: 13, webApp: 'https://RichRock27.github.io/check-auditor', scriptId: null, repo: 'https://github.com/RichRock27/check-auditor', icon: '<img src="https://RichRock27.github.io/check-auditor/favicon.png" style="width:1.2em; height:1.2em; vertical-align:middle;" />', localPath: LOCAL_ROOT + '/Check Register', sheetUrl: null },
    { title: 'Owner Specific Dashboard', priority: 14, webApp: null, scriptId: null, repo: null, icon: '👤', localPath: null, sheetUrl: null }
  ];

  return { 
    debug: 'System Online | Sheet candidates: ' + totalCandidates,
    projects: configs.map(c => ({
      ...c,
      id: c.title.replace(/\s+/g, '-').toLowerCase(),
      desc: 'Operational tool for ' + c.title,
      folderUrl: driveRoot,
      sheetUrl: (pinnedMap[c.title] && pinnedMap[c.title].url) || c.sheetUrl || sheetMap[normalizeKey_(c.title)] || null,
      sheetName: (pinnedMap[c.title] && pinnedMap[c.title].name) || null,
      sheetInfo: getSheetInfoForProject_(c.title),
      sheetCandidates: getCandidatesForProject_(c.title, candidateMap, globalSheets)
    })) 
  };
}

function buildSheetMap_(hubId) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('sheet_map_v1');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  const hub = DriveApp.getFolderById(hubId);
  const folders = hub.getFolders();
  const map = {};

  while (folders.hasNext()) {
    const folder = folders.next();
    const name = folder.getName();
    const key = normalizeKey_(name);
    const sheets = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
    let best = null;
    let bestScore = -1;

    while (sheets.hasNext()) {
      const f = sheets.next();
      const fname = f.getName();
      if (/LAUNCH/i.test(fname)) continue;

      let score = 0;
      if (fname.toLowerCase().includes(name.toLowerCase())) score += 3;
      if (/master|main|dashboard|directory|tracker|log/i.test(fname)) score += 2;
      if (/archive|backup|old/i.test(fname)) score -= 2;

      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    }

    if (best) map[key] = best.getUrl();
  }

  cache.put('sheet_map_v1', JSON.stringify(map), 60 * 30);
  return map;
}

function buildSheetCandidates_(hubId) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('sheet_candidates_v1');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  const hub = DriveApp.getFolderById(hubId);
  const folders = hub.getFolders();
  const map = {};

  while (folders.hasNext()) {
    const folder = folders.next();
    const name = folder.getName();
    const key = normalizeKey_(name);
    const sheets = collectSheets_(folder, 2);
    const candidates = [];

    while (sheets.hasNext()) {
      const f = sheets.next();
      const fname = f.getName();
      if (/LAUNCH/i.test(fname)) continue;

      let score = 0;
      if (fname.toLowerCase().includes(name.toLowerCase())) score += 3;
      if (/master|main|dashboard|directory|tracker|log/i.test(fname)) score += 2;
      if (/archive|backup|old/i.test(fname)) score -= 2;

      candidates.push({
        id: f.getId(),
        name: fname,
        url: f.getUrl(),
        score: score
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    map[key] = candidates.slice(0, 3);
  }

  cache.put('sheet_candidates_v1', JSON.stringify(map), 60 * 30);
  return map;
}

function getPinnedSheetMap_() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('PINNED_SHEETS');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

function setPinnedSheet(projectTitle, sheetId) {
  if (!projectTitle || !sheetId) return { status: 'error', message: 'Missing projectTitle or sheetId' };
  const props = PropertiesService.getScriptProperties();
  const map = getPinnedSheetMap_();
  const file = DriveApp.getFileById(sheetId);
  const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit';
  map[projectTitle] = { url: url, name: file.getName(), id: sheetId };
  props.setProperty('PINNED_SHEETS', JSON.stringify(map));
  return { status: 'success', project: projectTitle, sheetUrl: url, sheetName: file.getName() };
}

function getSheetInfoForProject_(projectTitle) {
  try {
    const key = normalizeKey_(projectTitle);
    const map = getAutoSheetMap_();
    return map[key] || null;
  } catch (e) {
    return null;
  }
}

function getAutoSheetMap_() {
  // Canonical sheet info derived from app code (hardcoded IDs) or known binding type.
  // Keys are normalized project titles.
  const entries = [
    { key: 'key keeper 2000', id: '1lcg4IgFpQGUrfeJLnhkyINphU2v-L0x2fv6lImFjMNk' },
    { key: 'property directory', id: '1IuT5zd0m_brD35kQIy_TIiFty4Gv1ez8KDTmGwqKXkw' },
    { key: 'utility tracker', mode: 'active' },
    { key: 'key lookup tool', id: '1lcg4IgFpQGUrfeJLnhkyINphU2v-L0x2fv6lImFjMNk' }
  ];

  const map = {};
  entries.forEach(entry => {
    const key = normalizeKey_(entry.key);
    if (entry.id) {
      try {
        const file = DriveApp.getFileById(entry.id);
        map[key] = { id: entry.id, url: file.getUrl(), name: file.getName() };
      } catch (e) {
        // If access fails, skip rather than showing wrong info.
      }
      return;
    }
    if (entry.mode === 'active') {
      map[key] = { name: 'Active Spreadsheet (container-bound)' };
    }
  });
  return map;
}

function clearPinnedSheet(projectTitle) {
  if (!projectTitle) return { status: 'error', message: 'Missing projectTitle' };
  const props = PropertiesService.getScriptProperties();
  const map = getPinnedSheetMap_();
  delete map[projectTitle];
  props.setProperty('PINNED_SHEETS', JSON.stringify(map));
  return { status: 'success', project: projectTitle };
}

function setPinnedSheetByUrl(projectTitle, sheetUrl) {
  if (!projectTitle || !sheetUrl) return { status: 'error', message: 'Missing projectTitle or sheetUrl' };
  const match = String(sheetUrl).match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return { status: 'error', message: 'Invalid Sheet URL' };
  return setPinnedSheet(projectTitle, match[1]);
}

function normalizeKey_(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectSheets_(folder, maxDepth) {
  const sheets = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  if (maxDepth <= 0) return sheets;

  const iterators = [sheets];
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    iterators.push(collectSheets_(sub, maxDepth - 1));
  }

  let current = 0;
  return {
    hasNext: () => {
      while (current < iterators.length && !iterators[current].hasNext()) current++;
      return current < iterators.length;
    },
    next: () => iterators[current].next()
  };
}

function buildGlobalSheetIndex_(hubId) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('sheet_global_v1');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  const hub = DriveApp.getFolderById(hubId);
  const sheets = collectSheets_(hub, 3);
  const list = [];

  while (sheets.hasNext()) {
    const f = sheets.next();
    const fname = f.getName();
    if (/LAUNCH/i.test(fname)) continue;
    list.push({ id: f.getId(), name: fname, url: f.getUrl() });
  }

  cache.put('sheet_global_v1', JSON.stringify(list), 60 * 30);
  return list;
}

function getCandidatesForProject_(projectTitle, candidateMap, globalSheets) {
  const key = normalizeKey_(projectTitle);
  const direct = candidateMap[key] || [];
  if (direct.length > 0) return direct;
  return rankGlobalCandidates_(globalSheets, projectTitle).slice(0, 3);
}

function rankGlobalCandidates_(globalSheets, projectTitle) {
  const key = normalizeKey_(projectTitle);
  if (!key) return [];
  const tokens = key.split(' ').filter(Boolean);
  const scored = [];

  globalSheets.forEach(s => {
    const nameKey = normalizeKey_(s.name);
    let score = 0;
    if (nameKey.includes(key)) score += 4;
    tokens.forEach(t => {
      if (t.length > 2 && nameKey.includes(t)) score += 1;
    });
    if (/master|main|dashboard|directory|tracker|log/i.test(s.name)) score += 1;
    if (/archive|backup|old/i.test(s.name)) score -= 2;
    if (score > 0) scored.push({ ...s, score: score });
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
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
