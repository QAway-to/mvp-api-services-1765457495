@echo off
cd /d "C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system"
echo Renaming local branch to main...
git branch -m master main
echo Setting remote origin...
git remote set-url origin https://github.com/QAway-to/render_agent_a_mvp.git
echo Pushing to GitHub...
git push -u origin main
echo Done!
pause
