function inspectSheet(id) {
  try {
    const ss = SpreadsheetApp.openById(id);
    const sheet = ss.getSheets()[0];
    const data = sheet.getRange(1, 1, 5, sheet.getLastColumn()).getValues();
    console.log("Sheet Name: " + sheet.getName());
    console.log("Headers: " + JSON.stringify(data[0]));
    console.log("Row 1 Sample: " + JSON.stringify(data[1]));
  } catch (e) {
    console.log("Error: " + e.message);
  }
}
