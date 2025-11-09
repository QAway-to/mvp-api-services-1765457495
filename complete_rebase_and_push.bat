@echo off
cd /d "C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system"

echo Checking Git status...
git status

echo.
echo Resolving conflicts and continuing rebase...
git add .gitignore README.md requirements.txt
git rebase --continue

echo.
echo Setting remote origin...
git remote set-url origin https://github.com/QAway-to/render_agent_a_mvp.git

echo.
echo Pushing to GitHub (main branch)...
git push -u origin main --force

echo.
echo Done!
pause


