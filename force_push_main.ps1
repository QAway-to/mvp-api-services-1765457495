# Force Push to GitHub (main branch)
Set-Location "C:\Users\sadov\PycharmProjects\ai-multiagent-mvp-system"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Force Push to GitHub (main branch)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Aborting any ongoing rebase..." -ForegroundColor Yellow
try {
    git rebase --abort 2>$null
    Write-Host "Rebase aborted." -ForegroundColor Green
} catch {
    Write-Host "No rebase in progress or already aborted." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 2: Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Setting remote origin..." -ForegroundColor Yellow
git remote set-url origin https://github.com/QAway-to/render_agent_a_mvp.git
Write-Host "Remote origin set." -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Staging all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Step 5: Checking for uncommitted changes..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "Creating commit for uncommitted changes..." -ForegroundColor Yellow
    git commit -m "chore: finalize unified project structure"
} else {
    Write-Host "No uncommitted changes." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 6: Force pushing to origin/main..." -ForegroundColor Yellow
$pushResult = git push -u origin main --force 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Code pushed to GitHub" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Push failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"




