@echo off
cd /d "C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system"

echo ========================================
echo Force Push to GitHub (main branch)
echo ========================================
echo.

echo Step 1: Aborting any ongoing rebase...
git rebase --abort 2>nul
if %errorlevel% neq 0 (
    echo No rebase in progress or already aborted.
)

echo.
echo Step 2: Checking current branch...
git branch --show-current

echo.
echo Step 3: Setting remote origin...
git remote set-url origin https://github.com/QAway-to/render_agent_a_mvp.git

echo.
echo Step 4: Staging all changes...
git add .

echo.
echo Step 5: Checking for uncommitted changes...
git status --short
if %errorlevel% equ 0 (
    echo Creating commit for any uncommitted changes...
    git commit -m "chore: finalize unified project structure"
)

echo.
echo Step 6: Force pushing to origin/main...
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Push failed
    echo ========================================
)

echo.
pause


