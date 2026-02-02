# The Workshop - Master Control Hub
**Project Type:** Google Apps Script Web Application  
**Last Updated:** 2026-02-01  
**Status:** ✅ Production

---

## 📋 What This Project Does

The Workshop is the **master control panel** for all property management systems. It serves as:
- **Central Hub** - Links to all other dashboards and apps
- **System Provisioning** - Sets up and configures new projects
- **Data Primer** - Uploads and processes data files
- **Brain Sync** - Synchronizes data across multiple systems
- **Health Monitor** - Checks status of all connected apps
- **Shared Drive Manager** - Manages access to shared Google Drive folders

---

## 🏗️ Architecture

### File Structure
```
The_Workshop/
├── Code.gs              # Main server logic (doGet routing, include function)
├── MasterHub.gs         # Central data aggregation & routing
├── Organizer.gs         # File organization utilities
├── Setup.gs             # System provisioning scripts
├── Audit.gs             # System health checks
├── Recover.gs           # Data recovery functions
├── FinalCheck.gs        # Validation scripts
├── index.html           # Main dashboard UI
├── uploader.html        # Data upload interface
├── linker.html          # System provisioning UI
├── easter_egg.html      # Modular Easter Egg
├── inspector.js         # Debugging utilities
└── appsscript.json      # Manifest with permissions
```

### Key Functions

**Code.gs:**
- `doGet(e)` - Routes to different UIs based on query parameters
  - `?mode=admin` - Admin dashboard
  - `?upload=true` - Data uploader
  - `?links=true` - System provisioning
  - `?test_access=true` - Folder access test
  - **Default** - Main control hub
- `include(filename)` - Enables modular HTML

**MasterHub.gs:**
- `getData()` - Aggregates data from all connected systems
- `getProjectLinks()` - Returns deployment URLs for all apps
- `getSystemHealth()` - Checks status of all projects

**Setup.gs:**
- `createMasterNTVLog()` - Sets up master tracking log
- `provisionAllProjects()` - Bulk project configuration

**Organizer.gs:**
- File organization and cleanup utilities
- Manages shared drive structure

**Recover.gs:**
- `manualKeyKeeperRecovery()` - Recovers Key Keeper data
- Emergency data restoration functions

---

## 📊 Data Sources

### Primary Integration:
The Workshop **doesn't store data** - it **aggregates** from:
1. Property Dashboard
2. Make Ready Board
3. Vacancy Dashboard
4. Demand Generator
5. Key Keeper
6. Utility Bill Audit
7. Owner Directory

### Shared Drive Access:
- **Folder ID:** `1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK` (configured in Code.gs)
- Must have access permissions to read/write
- Used for centralized file storage

---

## 🎨 UI Features

- **Dashboard Cards** - Quick links to all systems
- **Health Indicators** - Green/red status for each app
- **Deployment Info** - Version numbers and last updated timestamps
- **Admin Mode** - Advanced controls (`?mode=admin`)
- **Data Upload** - Drag-and-drop CSV/Excel upload
- **System Provisioning** - One-click project setup
- **Easter Egg** - 4x Control triggers matrix animation

---

## ⚠️ Known Issues

### 1. Shared Drive Access Errors
**Symptom:** "Permission denied" when accessing folders  
**Cause:** Script doesn't have Drive permissions or folder not shared  
**Fix:**
1. In Apps Script: **Services** → Add **Drive API**
2. Share folder `1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK` with script's service account
3. Run `?test_access=true` to verify:
```
https://script.google.com/.../exec?test_access=true
```

### 2. Project Links Breaking
**Symptom:** Cards show "undefined" or old deployment URLs  
**Cause:** Deployment IDs changed after redeploy  
**Fix:** Update `DEPLOYMENT_IDS` object in `MasterHub.gs`:
```javascript
const DEPLOYMENT_IDS = {
  property_dashboard: 'AKfycbzEyLtO2ZmJ...',
  make_ready: 'AKfycbxEi4sb9uf5y...',
  // ... update with latest from FINAL_VERIFICATION doc
};
```

### 3. getData() Timeout
**Symptom:** Loading screen never goes away  
**Cause:** One of the connected apps is slow/broken  
**Fix:**
- Add timeout to each sub-request (30 seconds max)
- Cache results in `CacheService` for 5 minutes
- Add fallback data for critical sections

---

## 🚀 Deployment

### Standard Deployment:
1. Open Apps Script editor
2. **Deploy** → **New deployment**
3. **Type:** Web app
4. **Execute as:** Me
5. **Access:** Anyone with Google account
6. **Important:** Requires Drive API + Gmail API permissions

### Query Parameters:
- **Main hub:** `.../exec` (no params)
- **Admin:** `.../exec?mode=admin`
- **Uploader:** `.../exec?upload=true`
- **Provisioning:** `.../exec?links=true`
- **Test access:** `.../exec?test_access=true`
- **Cleanup:** `.../exec?cleanup=true`
- **Rebuild:** `.../exec?rebuild=true`

---

## 🔧 Common Fixes

### Dashboard Shows No Data
1. Check browser console for errors
2. Verify all connected apps are deployed
3. Test each app individually
4. Check `MasterHub.gs` - ensure deployment IDs are current
5. Clear cache: `CacheService.getScriptCache().removeAll()`

### Upload Not Working
1. Verify file is CSV or Excel format
2. Check file size (< 50MB)
3. Ensure Drive API is enabled
4. Check `uploader.html` - verify `google.script.run` calls
5. Test with sample file first

### System Provisioning Fails
1. Check all folder IDs are correct
2. Verify shared drive permissions
3. Run manually: `provisionAllProjects()` in script editor
4. Check logs: View → Logs

---

## 📝 Quick Edits

### Add New Project Card
Edit `index.html`:
```html
<div class="project-card" onclick="window.open('URL', '_blank')">
  <div class="card-icon">🏢</div>
  <h3>New Project</h3>
  <p>Project description</p>
  <div class="card-status online">Online</div>
</div>
```

### Update Deployment URLs
Edit `MasterHub.gs`:
```javascript
const DEPLOYMENT_IDS = {
  new_project: 'AKfycbz...exec_url...',
  // Add new entries
};
```

### Add New Admin Function
1. Create function in appropriate .gs file
2. Add query parameter handler in `Code.gs` doGet():
```javascript
if (e && e.parameter && e.parameter.my_function === 'true') {
  return ContentService.createTextOutput(myFunction());
}
```

---

## 🔗 Integration Points

### Provides Data TO:
- **All projects** - Acts as registry and health monitor

### Gets Data FROM:
- **Property Dashboard** - Portfolio metrics
- **Make Ready Board** - Vacant unit tracking
- **Vacancy Dashboard** - Occupancy data
- **Demand Generator** - Notice generation stats
- **Key Keeper** - Key inventory status
- **Utility Bill Audit** - Utility tracking
- **Owner Directory** - Owner contact info

---

## 💡 Tips for Future AI Agents

1. **The Workshop is the MASTER** - When in doubt about deployment IDs, check FINAL_VERIFICATION doc
2. **Shared Drive access is CRITICAL** - Nothing works without proper Drive permissions
3. **Query parameters are your friend** - Use them to access different interfaces
4. **Cache aggressively** - `getData()` is expensive, cache for 5-10 minutes
5. **Test access first** - Always run `?test_access=true` before deploying
6. **Don't break the hub** - This controls everything else, test thoroughly
7. **Easter Egg is mandatory** - Keep the matrix/neon version
8. **Admin mode exists** - Use `?mode=admin` for advanced features

---

## 🐛 Debugging Checklist

- [ ] Drive API enabled in Services
- [ ] Shared folder `1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK` accessible
- [ ] All deployment IDs current in `MasterHub.gs`
- [ ] `include()` function exists in Code.gs
- [ ] `easter_egg.html` file present
- [ ] All connected apps are deployed and accessible
- [ ] Browser console clear of errors
- [ ] Cache cleared if showing stale data

---

## 🔐 Required Permissions

This app requires extensive permissions:
- **Google Drive** - Read/write shared folders
- **Gmail** - Read emails (for some recovery functions)
- **Spreadsheets** - Read/write data
- **Script** - Execute external scripts

**First-time setup:** User must authorize ALL permissions when deploying.
