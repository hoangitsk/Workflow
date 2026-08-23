@echo off
echo Starting deployment process...
echo.

:: Get current date and time for the commit message
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set mydate=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%
set mytime=%datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%
set commit_message=Auto deploy at %mydate% %mytime%

echo Step 1: Adding changes to git...
git add .

echo Step 2: Committing changes with message: "%commit_message%"...
git commit -m "%commit_message%"

echo Step 3: Pushing to remote repository...
:: Pushing to the current branch
git push

echo.
echo =======================================================
echo Done! 
echo If your Github is linked to Vercel, it will auto-deploy.
echo =======================================================
echo.
pause
