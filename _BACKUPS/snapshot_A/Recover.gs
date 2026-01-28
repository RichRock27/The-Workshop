function checkSpreadsheet() {
  const ssId = '1lcg4IgFpQGUrfeJLnhkyINphU2v-L0x2fv6lImFjMNk';
  try {
    const ss = SpreadsheetApp.openById(ssId);
    const log = "Spreadsheet Found: " + ss.getName() + "\n";
    // Spreadsheet-bound scripts can't have their ID easily found via Apps Script Drive API 
    // but we can check if it exists by looking for files in Drive with the same name if it's standalone
    // or checking the "Source" property if it's container-bound (internal only).
    
    // Better: let's just make sure it's in the Hub and not in the Trash.
    const file = DriveApp.getFileById(ssId);
    if (file.isTrashed()) {
      file.setTrashed(false);
      log += "⚠️ RECOVERED FROM TRASH: The spreadsheet was in the trash. It is now restored.\n";
    }
    
    // Ensure it's in the Hub
    const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
    const hub = DriveApp.getFolderById(HUB_ID);
    const keyFolder = hub.getFoldersByName("Key Keeper 2000").next();
    keyFolder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    log += "✅ MOVED TO HUB: Spreadsheet is now safely in the Key Keeper 2000 folder.";
    
    return log;
  } catch (e) {
    return "ERROR: " + e.toString();
  }
}
