@echo off
cd /d C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system
echo Adding all files...
git add -A
echo.
echo Status:
git status --short
echo.
echo Committing...
git commit -m "feat: Remove MVP improvement functionality and add universal web-scraper template based on final_scraper"
echo.
echo Pushing to origin/main...
git push origin main
echo.
echo Done!
pause


