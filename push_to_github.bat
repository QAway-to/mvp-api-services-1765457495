@echo off
echo 🚀 Pushing AI Multi-Agent MVP System to GitHub...
echo.

cd /d "C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system"

echo 📋 Checking git status...
git status
echo.

echo ➕ Adding all files...
git add .
echo.

echo 💾 Creating commit...
git commit -m "feat: unified AI Multi-Agent MVP system

- Agent A: Freelance project search and qualification
- Agent B: AI-powered MVP generation with templates
- Shared configuration and logging system
- Deployment guides for Railway/Render + Vercel
- 3 MVP templates (Telegram Shop, News Parser, Discord Moderation)
- Real-time dashboard with MVP generation UI
- Comprehensive error handling and logging"
echo.

echo 🔗 Setting up remote origin...
git remote set-url origin https://github.com/QAway-to/render_agent_a_mvp.git
echo.

echo 📤 Pushing to GitHub...
git push -u origin master
echo.

echo ✅ Push completed! Repository URL: https://github.com/QAway-to/render_agent_a_mvp
echo.
echo 📝 Next steps:
echo 1. Rename repository to 'ai-multiagent-mvp-system' in GitHub settings
echo 2. Create test repository: https://github.com/QAway-to/ai-mvp-test (public)
echo 3. Connect Vercel to ai-mvp-test for auto-deployment
echo 4. Deploy Agent A and Agent B to Railway/Render
echo.

pause

