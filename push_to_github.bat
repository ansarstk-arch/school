@echo off
echo Pushing School Management System to GitHub...
echo.
echo Step 1: Make sure you have a GitHub Personal Access Token
echo        Go to: https://github.com/settings/tokens
echo        Create token with 'repo' scope
echo.
echo Step 2: Enter your GitHub username:
set /p username="Username (ansarstk-arch): "
echo.
echo Step 3: Enter your Personal Access Token:
set /p token="Token: "
echo.
echo Pushing code to GitHub...
git push https://%username%:%token%@github.com/ansarstk-arch/school.git main
echo.
echo Done!