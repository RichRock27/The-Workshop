/**
 * ACCOUNT DIAGNOSTIC
 * -------------------
 * Run this to confirm exactly which Google Account is executing the script.
 */
function whoAmI() {
  const email = Session.getActiveUser().getEmail();
  const effectiveUser = Session.getEffectiveUser().getEmail();
  
  let msg = "👤 IDENTITY CHECK\n";
  msg += "------------------------------------------------\n";
  msg += "➤ Active User:    " + email + "\n";
  msg += "➤ Effective User: " + effectiveUser + "\n";
  msg += "------------------------------------------------\n";
  
  if (email === "") {
    msg += "⚠️ WARNING: Email is blank. This often happens if the script is running in a context where identity is masked (like a simple trigger). Run this manually from the editor.\n";
  }
  
  Logger.log(msg);
  return msg;
}

/**
 * TARGETED CLEANUP: NTV - Aur
 * ----------------------------------------------------
 * Specifically finds files named "NTV - Aur" (or similar).
 * Looks for BOTH Scripts and Forms.
 * Archives duplicates.
 */

function diagnoseAndCleanNTV() {
  const TARGET_NAME = "NTV - Aur";
  const ARCHIVE_FOLDER_NAME = "_Script_Archive_Jan2026";
  
  Logger.log("🔎 HUNTING FOR FORMS named: '" + TARGET_NAME + "' (Global Search)...");
  
  // Look specifically for FORMS
  const files = DriveApp.getFilesByName(TARGET_NAME);
  const found = [];
  
  while (files.hasNext()) {
    const f = files.next();
    // We only care if it's a Form (likely containing the script) OR a purely standalone script
    const type = f.getMimeType();
    if (type === MimeType.GOOGLE_FORMS || type === MimeType.GOOGLE_APPS_SCRIPT) {
      found.push({
        file: f,
        name: f.getName(),
        id: f.getId(),
        type: type,
        updated: f.getLastUpdated()
      });
    }
  }
  
  Logger.log("📋 Found " + found.length + " matching Forms/Scripts.");
  
  if (found.length < 2) {
    return "✅ No duplicates found. You have " + found.length + " copy.";
  }
  
  // Sort: Newest First
  found.sort((a, b) => b.updated.getTime() - a.updated.getTime());
  
  // Archive Folder
  let archiveFolder;
  const folders = DriveApp.getFoldersByName(ARCHIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    archiveFolder = folders.next();
  } else {
    archiveFolder = DriveApp.createFolder(ARCHIVE_FOLDER_NAME);
  }
  
  let report = "CLEANUP REPORT:\n";
  let movedCount = 0;
  
  found.forEach((item, index) => {
    if (index === 0) {
      report += "✅ KEEPING (Newest): [" + item.type + "] " + item.updated.toISOString().slice(0,10) + "\n";
    } else {
      try {
        item.file.moveTo(archiveFolder);
        report += "📦 ARCHIVED: [" + item.type + "] " + item.updated.toISOString().slice(0,10) + "\n";
        movedCount++;
      } catch (e) {
        report += "❌ FAIL: " + e.toString() + "\n";
      }
    }
  });
  
  Logger.log(report);
  return "Archived " + movedCount + " duplicates.";
}
  

// End of diagnoseAndCleanNTV


/**
 * CLEANUP UTILITY: GLOBAL SCRIPT ORGANIZER
 * ----------------------------------------------------
 * Scans your ENTIRE Google Drive for Google Apps Script files.
 * Groups them by Name.
 * If duplicates exist:
 *   - Keeps the NEWEST version (based on Last Updated).
 *   - MOVES all older versions to a folder named: "_Script_Archive_Jan2026"
 */

function cleanUpAllScripts() {
  const ARCHIVE_FOLDER_NAME = "_Script_Archive_Jan2026";
  let archiveFolder;
  
  Logger.log("🚀 STARTING GLOBAL SCRIPT CLEANUP...");

  // 1. Collect ALL Apps Script files
  // Note: specific search query for GAS mime type only
  const files = DriveApp.searchFiles('mimeType = "application/vnd.google-apps.script" and trashed = false');
  const inventory = {}; // Map: "ScriptName" -> [ {file, updated} ]

  let count = 0;
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    
    if (!inventory[name]) {
      inventory[name] = [];
    }
    inventory[name].push({
      file: f,
      updated: f.getLastUpdated(),
      id: f.getId()
    });
    count++;
  }
  
  Logger.log("📋 Found " + count + " total scripts. Analyzing duplicates...");
  
  // 2. Identify Duplicates
  let movedCount = 0;
  const logDetails = [];

  for (const name in inventory) {
    const versions = inventory[name];
    
    // If only 1 exists, skip it
    if (versions.length < 2) continue;
    
    // Sort: Newest First
    versions.sort((a, b) => b.updated.getTime() - a.updated.getTime());
    
    // Ensure Archive Folder exists (lazy creation)
    if (!archiveFolder) {
      const folders = DriveApp.getFoldersByName(ARCHIVE_FOLDER_NAME);
      archiveFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(ARCHIVE_FOLDER_NAME);
    }

    logDetails.push("\n📂 Processing: '" + name + "'");
    logDetails.push("   ✅ KEEPING: " + versions[0].updated.toISOString().slice(0,10) + " (" + versions[0].id + ")");

    // Move all except the first one (index 0)
    for (let i = 1; i < versions.length; i++) {
      const fileToArchive = versions[i].file;
      
      try {
        fileToArchive.moveTo(archiveFolder);
        logDetails.push("   📦 ARCHIVED: " + versions[i].updated.toISOString().slice(0,10) + " (" + versions[i].id + ")");
        movedCount++;
      } catch (e) {
        logDetails.push("   ❌ ERROR Moving: " + e.toString());
      }
    }
  }

  // 3. Final Report
  Logger.log(logDetails.join("\n"));
  Logger.log("\n------------------------------------------------");
  Logger.log("🎉 DONE! Moved " + movedCount + " scripts to '" + ARCHIVE_FOLDER_NAME + "'");
  return "Cleaned " + movedCount + " duplicates.";
}
