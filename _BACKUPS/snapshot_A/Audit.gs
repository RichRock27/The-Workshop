function auditDrive() {
  const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and (name contains 'Key Keeper' or name contains 'Key Log' or name contains 'Ice Breakers' or name contains 'Demand' or name contains 'Owner Directory' or name contains 'Property Directory')";
  const files = DriveApp.searchFiles(query);
  const results = [];
  
  while (files.hasNext()) {
    const file = files.next();
    results.push({
      name: file.getName(),
      id: file.getId(),
      url: file.getUrl(),
      lastUpdated: file.getLastUpdated().toISOString()
    });
  }
  
  return JSON.stringify(results, null, 2);
}
