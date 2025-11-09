@echo off
echo 🔧 Fixing branch name and pushing to GitHub...
echo.

cd /d "C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system"

echo 📋 Checking current branch...
git branch
echo.

echo 🔄 Renaming local branch from master to main...
git branch -m master main
echo.

echo ✅ Local branch renamed to main
echo.

echo 🔗 Setting remote origin...
git remote set-url origin https://github.com/QAway-to/render_agent_a_mvp.git
echo.

echo 📤 Pushing to GitHub (main branch)...
git push -u origin main
echo.

if %errorlevel% equ 0 (
    echo ✅ Successfully pushed to GitHub!
    echo 📦 Repository: https://github.com/QAway-to/render_agent_a_mvp
) else (
    echo ❌ Push failed. Check the error above.
    echo.
    echo 💡 If remote repository is empty, you might need to:
    echo    git push -u origin main --force
)

echo.
pause
