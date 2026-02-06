import os
import subprocess
import datetime
import shutil
import time

# ==========================================
# PROJECT SENTRY - Automated Backup System v3
# ==========================================
# This script performs:
# 1. clasp pull (Sync from Google Apps Script)
# 2. git commit/push (Sync to GitHub/Gitea)
# 3. zip archiving (Local offline copy with exclusions)
# 4. cleanup (Retention of 14 days)
# ==========================================

BASE_DIR = "/Users/richgreen/.gemini/antigravity/scratch/_ACTIVE_PROJECTS"
BACKUP_ROOT = "/Users/richgreen/.gemini/antigravity/scratch/_PROJECT_BACKUPS"
LOG_DIR = os.path.join(BACKUP_ROOT, "logs")
RETENTION_DAYS = 14

# Ensure core directories exist
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, f"backup_{datetime.date.today()}.log")

def log(message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_msg = f"[{timestamp}] {message}"
    print(formatted_msg)
    with open(LOG_FILE, "a") as f:
        f.write(formatted_msg + "\n")

def run_cmd(cmd, cwd):
    try:
        env = os.environ.copy()
        env["PATH"] = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:" + env.get("PATH", "")
        
        result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, env=env)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def backup_project(project_path):
    project_name = os.path.basename(project_path)
    # Skip hidden folders and specific patterns
    if project_name.startswith(".") or "backup" in project_name.lower() or project_name == "_BACKUPS":
        return

    log(f"--- 💠 Processing: {project_name} ---")
    
    # 1. Clasp Pull (Sync from Google)
    if os.path.exists(os.path.join(project_path, ".clasp.json")):
        log(f"  > GAS project detected. Running clasp pull...")
        # Note: requires being logged in via 'clasp login'
        success, out, err = run_cmd("clasp pull", project_path)
        if success:
            log(f"    ✅ Pulled from Google")
        else:
            log(f"    ❌ Clasp pull failed: {err.strip()}")

    # 2. Git Backup
    if os.path.exists(os.path.join(project_path, ".git")):
        log(f"  > Git repository detected.")
        # Check status
        _, out, _ = run_cmd("git status --short", project_path)
        if out.strip():
            log(f"    > Found changes. Committing...")
            run_cmd('git add .', project_path)
            run_cmd(f'git commit -m "Automated nightly backup - {datetime.date.today()}"', project_path)
            
            # Check for remote
            success, out, _ = run_cmd("git remote", project_path)
            if out.strip():
                log(f"    > Pushing to remote...")
                # Get current branch
                _, branch, _ = run_cmd("git rev-parse --abbrev-ref HEAD", project_path)
                branch = branch.strip() or "main"
                
                push_success, _, p_err = run_cmd(f"git push origin {branch}", project_path)
                if push_success:
                    log(f"    ✅ Pushed to remote ({branch})")
                else:
                    log(f"    ⚠️  Push failed (try manual setup): {p_err.strip()}")
            else:
                log(f"    ℹ️  No remote found, local commit only.")
        else:
            log(f"    ✅ Local files up to date.")

    # 3. Local Archive (ZIP)
    # Use native zip with exclusions for performance
    date_str = datetime.date.today().strftime("%Y-%m-%d")
    archive_dir = os.path.join(BACKUP_ROOT, date_str)
    os.makedirs(archive_dir, exist_ok=True)
    
    archive_path = os.path.join(archive_dir, f"{project_name}.zip")
    
    # Exclude bloat directories to save space
    # Native zip patterns for common bloat
    zip_cmd = f'zip -r -q "{archive_path}" . -x "node_modules/*" "dist/*" ".cache/*" "venv/*" "__pycache__/*" "*/node_modules/*" "*/dist/*"'
    
    success, out, err = run_cmd(zip_cmd, project_path)
    if success:
        log(f"  ✅ ZIP Archive created.")
    else:
        log(f"  ❌ ZIP Archive failed: {err.strip()}")

def main():
    start_time = time.time()
    log("==========================================")
    log("🛰  PROJECT SENTRY: NIGHTLY BACKUP START")
    log("==========================================")
    
    if not os.path.exists(BASE_DIR):
        log(f"FATAL: Base directory {BASE_DIR} not found.")
        return

    items = os.listdir(BASE_DIR)
    subdirs = [os.path.join(BASE_DIR, d) for d in items if os.path.isdir(os.path.join(BASE_DIR, d))]
    subdirs.sort()
    
    for project in subdirs:
        backup_project(project)
        
    # 4. Retention Management
    log("--- 🧹 Cleaning up old backups ---")
    try:
        backups = [os.path.join(BACKUP_ROOT, d) for d in os.listdir(BACKUP_ROOT) 
                   if os.path.isdir(os.path.join(BACKUP_ROOT, d)) and d != "logs"]
        
        for b in backups:
            folder_name = os.path.basename(b)
            try:
                folder_date = datetime.datetime.strptime(folder_name, "%Y-%m-%d").date()
                age = (datetime.date.today() - folder_date).days
                if age > RETENTION_DAYS:
                    log(f"  > Removing expired backup ({age} days old): {folder_name}")
                    shutil.rmtree(b)
            except ValueError:
                continue
    except Exception as e:
        log(f"  ❌ Cleanup error: {str(e)}")
            
    duration = time.time() - start_time
    log("==========================================")
    log(f"🏁 BACKUP COMPLETE. Duration: {duration:.2f}s")
    log("==========================================")

if __name__ == "__main__":
    main()
