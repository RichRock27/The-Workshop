function createMasterNTVLog() {
  const HUB_ID = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  
  try {
    const hub = DriveApp.getFolderById(HUB_ID);
    
    // Check if it already exists to avoid duplicates
    const existing = hub.getFilesByName("MASTER_NTV_DATABASE");
    if (existing.hasNext()) {
      return "⚠️ Master Log already exists: " + existing.next().getUrl();
    }
    
    // Create Spreadsheet
    const ss = SpreadsheetApp.create("MASTER_NTV_DATABASE");
    const sheet = ss.getSheets()[0];
    sheet.setName("Submissions");
    
    // Define Headers based on the generic NTV form fields
    const headers = [
      "Timestamp",
      "Region",
      "Tenant Name",
      "Property Address", 
      "Move Out Date",
      "Reason",
      "Forwarding Address",
      "Contact Info", 
      "PM Rating",
      "Maint Rating",
      "Processed Status" // For Make Ready Board to mark as 'Done' later
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#cfe2f3");
    sheet.setFrozenRows(1);
    
    // Move to Hub
    const file = DriveApp.getFileById(ss.getId());
    file.moveTo(hub);
    
    Logger.log("✅ Created Master NTV Log: " + ss.getUrl());
    return ss.getUrl();
    
  } catch (e) {
    Logger.log("❌ Error creating log: " + e.toString());
    return "Error: " + e.toString();
  }
}
