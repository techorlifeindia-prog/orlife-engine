@echo off
echo Connecting to Oracle Cloud Server (129.225.118.77)...
ssh -i "%~dp0oracle-ssh-key.key" ubuntu@129.225.118.77
pause
