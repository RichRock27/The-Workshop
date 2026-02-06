/**
 * MASTER INTELLIGENCE HUB (MIH)
 * Centralizes data from Property Dashboard, MRB, and Utility Tracker
 * to create a single "Source of Truth" for the PropAlliance EcoSystem.
 */

const MIH_CONFIG = {
  // We search for these filenames dynamically
  TRACKER_SHEET_NAME: "Utility Tracker 360", // Or partial match
  PMD_CSV_NAME: "PortfolioCount.csv" // To find the PMD Folder
};

function rebuildMasterIndex() {
  const log = [];
  try {
    log.push("Starting Master Index Build...");
    
    // 1. Fetch Canonical Properties (from PMD Data)
    const properties = fetchCanonicalProperties(log);
    log.push(`Found ${Object.keys(properties).length} canonical properties.`);
    
    // 2. Fetch Utility History (Active + 2025 History)
    const utilities = fetchUtilityHistory(log);
    
    // 2b. Merge 2025 History
    try {
        const history2025 = fetchHistorical2025(log);
        log.push(`Found 2025 History for ${Object.keys(history2025).length} properties.`);
        
        // Merge Logic
        Object.keys(history2025).forEach(pKey => {
            if (!utilities[pKey]) utilities[pKey] = [];
            
            history2025[pKey].forEach(hItem => {
                // Check if account/service exists in current
                const existing = utilities[pKey].find(e => e.account === hItem.account && e.service === hItem.service);
                if (existing) {
                    existing.totalPaid += hItem.totalPaid;
                    existing.count += hItem.count;
                } else {
                    utilities[pKey].push(hItem);
                }
            });
        });
    } catch (err) {
        log.push("Warning: 2025 History Load Failed: " + err.message);
    }

    log.push(`Total Utility Profiles (Merged): ${Object.keys(utilities).length}`);
    
    // 3. Merge Data
    Object.keys(utilities).forEach(propName => {
      // Fuzzy match utility property name to canonical name
      const canonical = findCanonicalMatch(propName, properties);
      
      if (canonical) {
        if (!properties[canonical].utilities) properties[canonical].utilities = [];
        // Add accounts
        utilities[propName].forEach(acct => {
           properties[canonical].utilities.push(acct);
        });
      } else {
        log.push(`[ORPHAN UTILITY] Could not match '${propName}' to known property.`);
      }

    });

    // 4. Merge MRB Status (Unit Level Intelligence)
    try {
        const mrbStatus = fetchMRBStatus(log);
        log.push(`Found MRB Status for ${Object.keys(mrbStatus).length} units.`);
        
        Object.keys(mrbStatus).forEach(mrbKey => {
            // mrbKey formats: "PROPKEY_UNIT"
            const parts = mrbKey.split("_");
            const pKey = parts[0];
            const uKey = parts[1];
            
            // Try direct match
            let targetProp = properties[pKey];
            
            // If not found, try fuzzy
            if (!targetProp) {
                const matchName = findCanonicalMatch(pKey, properties);
                if (matchName) targetProp = properties[matchName];
            }
            
            if (targetProp) {
                if (!targetProp.unitsDetail) targetProp.unitsDetail = {};
                targetProp.unitsDetail[uKey] = mrbStatus[mrbKey];
            }
        });
        
    } catch (mrbErr) {
        log.push("Warning: MRB Merge Failed (File might not exist yet): " + mrbErr.message);
    }
    saveMasterIndex(properties, log);
    
    return { status: 'success', log: log, count: Object.keys(properties).length };
    
  } catch (e) {
    log.push("CRITICAL ERROR: " + e.toString());
    console.error(e);
    return { status: 'error', log: log };
  }
}

// --- DATA FETCHERS ---

function fetchCanonicalProperties(log) {
  // Strategy: Find the 'PortfolioCount.csv' used by PMD to get the cleanest list.
  const files = DriveApp.getFilesByName("PortfolioCount.csv");
  if (!files.hasNext()) throw new Error("PMD Source Data (PortfolioCount.csv) not found.");
  
  const csv = files.next().getBlob().getDataAsString();
  const rows = Utilities.parseCsv(csv);
  
  // Header hunting
  const h = rows[0].map(s => s.toLowerCase());
  const idxName = h.findIndex(c => c.includes("property") || c.includes("name"));
  const idxUnits = h.findIndex(c => c.includes("unit"));
  
  const map = {};
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[idxName];
    if (!name) continue;
    
    // Create Clean Key
    const key = normalizePropKey(name);
    
    if (!map[key]) {
      map[key] = {
        name: name,
        aliases: [name],
        units: 0,
        territory: getTerritory(name)
      };
    }
    
    // Accumulate Units
    let u = 1;
    if (idxUnits > -1 && !isNaN(parseFloat(row[idxUnits]))) {
       u = parseFloat(row[idxUnits]);
    }
    map[key].units += u;
  }
  return map;
}

function fetchUtilityHistory(log) {
  // Strategy: Find 'Utility Tracker' spreadsheet.
  // Note: Searching by vague name might return backups. We need to be careful.
  // We'll search for "Utility Tracker 360" (exact) or "Utility Tracker" and pick last modified.
  
  const files = DriveApp.searchFiles("title contains 'Utility Tracker' and mimeType = 'application/vnd.google-apps.spreadsheet'");
  let bestFile = null;
  while(files.hasNext()) {
     const f = files.next();
     if(f.getName().includes("Backups")) continue; // Skip backup folders
     if(!bestFile || f.getLastUpdated() > bestFile.getLastUpdated()) bestFile = f;
  }
  
  if (!bestFile) throw new Error("Utility Tracker Spreadsheet not found.");
  log.push(`Using Utility Sheet: ${bestFile.getName()}`);
  
  const ss = SpreadsheetApp.open(bestFile);
  const map = {}; // PropKey -> [ { service: 'WATER', account: '1234', avgCost: 50.00 } ]
  
  // Scan '2026 - WATER', '2026 - ELECTRIC', etc.
  const sheets = ss.getSheets();
  sheets.forEach(sh => {
    const name = sh.getName().toUpperCase();
    let service = "UNKNOWN";
    if (name.includes("WATER")) service = "WATER";
    else if (name.includes("ELEC")) service = "ELECTRIC";
    else if (name.includes("GAS")) service = "GAS";
    else return; // Skip non-utility sheets
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return;
    
    // Columns (heuristic): Acct(0), Name(1), PropCode(2)... usually.
    // Let's rely on standard columns: Account is usually Col A or B. Property Col C.
    // We'll check headers.
    const h = data[0].map(s => String(s).toLowerCase());
    const idxAcct = h.findIndex(c => c.includes("account") || c.includes("ref"));
    const idxProp = h.findIndex(c => c.includes("property"));
    const idxPaid = h.findIndex(c => c.includes("paid"));
    
    if (idxAcct === -1 || idxProp === -1) return;
    
    // Aggregate by Account
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const acct = String(row[idxAcct]).toUpperCase().trim();
      const prop = String(row[idxProp]).toUpperCase().trim();
      const paid = parseFloat(row[idxPaid]) || 0;
      
      if (!prop || !acct || acct === "TOTAL") continue;
      
      const pKey = normalizePropKey(prop);
      
      if (!map[pKey]) map[pKey] = [];
      
      const entry = map[pKey].find(e => e.account === acct && e.service === service);
      if (entry) {
        entry.totalPaid += paid;
        entry.count++;
      } else {
        map[pKey].push({ 
          account: acct, 
          service: service, 
          totalPaid: paid, 
          count: 1 
        });
      }
    }
  });
  
  return map;
}

// --- HELPERS ---

function normalizePropKey(str) {
  // Aggressive normalization for linking
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function findCanonicalMatch(dirtyName, canonicalList) {
   const dirtyKey = normalizePropKey(dirtyName);
   if (canonicalList[dirtyKey]) return dirtyKey;
   
   // Fuzzy match? (Levenshtein) - For now, startsWith logic
   // If dirtyKey is "17FITZ" and canonical is "17FITZSIMONS", match.
   const keys = Object.keys(canonicalList);
   for (const k of keys) {
     if (k.startsWith(dirtyKey) || dirtyKey.startsWith(k)) return k;
   }
   return null;
}

function getTerritory(name) {
  const n = name.toUpperCase();
  if (n.startsWith("11") || n.includes("ARVADA")) return "Arv/West";
  if (n.startsWith("12") || n.includes("COS") || n.includes("SPRINGS")) return "COS";
  if (n.startsWith("13") || n.includes("AURORA")) return "Aurora";
  if (n.startsWith("14") || n.includes("DENVER")) return "DenCen";
  if (n.startsWith("16") || n.includes("OKC")) return "OKC";
  if (n.startsWith("17") || n.includes("FITZ")) return "Fitz";
  if (n.startsWith("18") || n.includes("GLENN") || n.includes("VALLEY")) return "GL/VV";
  return "Unknown";
}

function saveMasterIndex(data, log) {
  const folderId = "1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK"; // The Hub
  const folder = DriveApp.getFolderById(folderId);
  const fileName = "MASTER_INTELLIGENCE_INDEX.json";
  
  const existing = folder.getFilesByName(fileName);
  if (existing.hasNext()) existing.next().setTrashed(true);
  
  folder.createFile(fileName, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);
  log.push(`Saved Master Index to ${fileName}`);
}

function fetchHistorical2025(log) {
    const historicalId = "1zCJz4t34jsAQZ1-zJp_yoAx74fjliExRS-kNYo_G1zg";
    log.push("Fetching 2025 History from: " + historicalId);
    
    const ss = SpreadsheetApp.openById(historicalId);
    const tabs = ss.getSheets();
    const map = {};
    
    tabs.forEach(sh => {
       const tabName = sh.getName().toUpperCase();
       
       let service = "UNKNOWN";
       if(tabName.includes("WATER")) service = "WATER";
       else if(tabName.includes("ELEC")) service = "ELECTRIC";
       else if(tabName.includes("GAS")) service = "GAS";
       else if(tabName.includes("INTERNET")) service = "INTERNET";
       else if(tabName.includes("TRASH")) service = "GARBAGE";
       
       if (service === "UNKNOWN") return; // Skip non-utility tabs
       
       const data = sh.getDataRange().getValues();
       if(data.length < 2) return;
       
       const h = data[0].map(x => String(x).toLowerCase());
       
       // Index hunting
       const idxAcct = h.findIndex(c => c.includes("account") || c.includes("ref"));
       const idxProp = h.findIndex(c => c.includes("property"));
       const idxPaid = h.findIndex(c => c.includes("paid") || c.includes("amount"));
       
       if (idxAcct === -1 || idxProp === -1 || idxPaid === -1) return;
       
       for(let i=1; i<data.length; i++) {
           const row = data[i];
           const prop = String(row[idxProp]).toUpperCase().trim();
           const acct = String(row[idxAcct]).toUpperCase().trim();
           const paid = parseFloat(row[idxPaid]) || 0;
           
           if (!prop || !acct || acct === "TOTAL") continue;
           
           const pKey = normalizePropKey(prop);
           if (!map[pKey]) map[pKey] = [];
           
           const entry = map[pKey].find(e => e.account === acct && e.service === service);
           if (entry) {
             entry.totalPaid += paid;
             entry.count++;
           } else {
             map[pKey].push({
                account: acct,
                service: service,
                totalPaid: paid,
                count: 1
             });
           }
       }
    });
    
    return map;
}

function fetchMRBStatus(log) {
   try {
     const folder = DriveApp.getFolderById('1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK');
     const files = folder.getFilesByName('MRB_LIVE_STATUS.json');
     if (files.hasNext()) {
         return JSON.parse(files.next().getBlob().getDataAsString());
     }
   } catch(e) {
      if(log) log.push("MRB Fetch Error: " + e.message);
   }
   return {};
}
