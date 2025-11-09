# PowerShell script to push AI Multi-Agent MVP System to GitHub
Write-Host "🚀 Pushing AI Multi-Agent MVP System to GitHub..." -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location "C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system"

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status
Write-Host ""

# Add all files
Write-Host "➕ Adding all files..." -ForegroundColor Yellow
git add .
Write-Host ""

# Create commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "feat: unified AI Multi-Agent MVP system

- Agent A: Freelance project search and qualification
- Agent B: AI-powered MVP generation with templates
- Shared configuration and logging system
- Deployment guides for Railway/Render + Vercel
- 3 MVP templates (Telegram Shop, News Parser, Discord Moderation)
- Real-time dashboard with MVP generation UI
- Comprehensive error handling and logging"
Write-Host ""

# Setup remote origin
Write-Host "🔗 Setting up remote origin..." -ForegroundColor Yellow
git remote set-url origin https://github.com/QAway-to/render_agent_a_mvp.git
Write-Host ""

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main
Write-Host ""

Write-Host "✅ Push completed! Repository URL: https://github.com/QAway-to/render_agent_a_mvp" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Rename repository to 'ai-multiagent-mvp-system' in GitHub settings" -ForegroundColor White
Write-Host "2. Create test repository: https://github.com/QAway-to/ai-mvp-test (public)" -ForegroundColor White
Write-Host "3. Connect Vercel to ai-mvp-test for auto-deployment" -ForegroundColor White
Write-Host "4. Deploy Agent A and Agent B to Railway/Render" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"

