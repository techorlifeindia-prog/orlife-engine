@echo off
echo ========================================================
echo   OrLife Connect - 1-Click Code Push & Deployment
echo ========================================================

echo 1. Committing & Pushing local code to GitHub...
git add .
git commit -m "update: Auto deploy update"
git push origin master

echo 2. Connecting to Oracle Cloud VM & Updating Server...
ssh -i "%~dp0oracle-ssh-key.key" -o StrictHostKeyChecking=no ubuntu@129.225.118.77 "cd /app && git pull origin master && npm install && npm run build && pm2 restart all && pm2 status"

echo ========================================================
echo   Deployment Complete! Live at https://api.orlifeindia.com
echo ========================================================
pause
