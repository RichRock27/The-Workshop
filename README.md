# The Workshop | PropAlliance Master Controller

**The Workshop** is the central "Brain" of the PropAlliance automation ecosystem. It serves 3 main functions:
1.  **Hub & Spoke Integration**: Connects various isolated tools (NTV forms, Make Ready Board) into a central data stream.
2.  **System Provisioning**: Allows one-click creation of new project structures.
3.  **Data Ingestion**: Receives webhook data from external forms.

## 🔗 Quick Links

*   **Script Editor**: [Open in Google Apps Script](https://script.google.com/d/1lVDvYwIJro89eVJrPgNhiHyrZlQkRSxR49URl3TfcixanrHUrhsXniH-/edit)
*   **Web App (Live)**: [Launch The Workshop](https://script.google.com/macros/s/AKfycbxvCrReRMVjUHlNwHrIuixcmifwKSKRur1nIFBpxB1jnQ2aFhKafKsfIPGsVuPOwE2WMQ/exec)
*   **Master NTV Database**: [View Spreadsheet](https://docs.google.com/spreadsheets/d/1rrtlnXiMfn8IeesyKqm4U-iTd6ykHYxhn6-oZU8IhN4)

## 📂 Project Structure

*   **`Code.gs`**: Main entry point (`doGet`) and router.
*   **`Setup.gs`**: Helper scripts for creating databases.
*   **`Action.gs`** (Planned): Will handle the incoming webhook logic.
*   **`Organizer.gs`**: Maintenance tools (like the Drive Cleanup Utility).

## 🛠 Reports & Inputs

*   **NTV Forms**: This script receives POST requests/syncs from the regional "Notice to Vacate" forms.
*   **AppFolio**: Currently no direct AppFolio integration, but future plans include CSV parsing.

## 🔄 Workflow Protocol

This project follows the **Standard PropAlliance Protocol**.
1.  **Backup**: Run `clasp pull` and snapshot to `_BACKUPS/` before editing.
2.  **Sync**: Commit to Git and Push to Drive (`clasp push`) upon completion.
