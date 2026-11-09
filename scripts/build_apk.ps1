$ErrorActionPreference = "Stop"

# 1. Map short virtual drive T: to bypass Windows 260-character MAX_PATH limit in CMake/Ninja
if (-not (Test-Path "T:\package.json")) {
    Write-Host "Mapping virtual drive T: -> D:\Repo\thrivingskill.app..." -ForegroundColor Cyan
    subst T: "D:\Repo\thrivingskill.app"
}

$env:JAVA_HOME = "C:\Users\deenb\tools\jdk17"
$env:ANDROID_HOME = "C:\Users\deenb\tools"
$env:ANDROID_SDK_ROOT = "C:\Users\deenb\tools"
$env:PATH = "C:\Users\deenb\tools\jdk17\bin;C:\Users\deenb\tools\platform-tools;C:\Users\deenb\tools\cmdline-tools\latest\bin;" + $env:PATH

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting Local Android APK Build on Drive T:..." -ForegroundColor Cyan
Write-Host "Workspace: T:\" -ForegroundColor Gray
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location "T:\android"

# Run gradlew assembleRelease
.\gradlew.bat assembleRelease --no-daemon

if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "BUILD SUCCESSFUL! Checking generated APKs..." -ForegroundColor Green
$apks = Get-ChildItem -Recurse -Filter "*.apk" "T:\android\app\build\outputs\apk"
$apks | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize

# Copy release APK to project root for easy user access
$releaseApk = $apks | Where-Object { $_.Name -like "*release*.apk" } | Select-Object -First 1
if ($releaseApk) {
    $dest = "D:\Repo\thrivingskill.app\thrivingskill-release.apk"
    Copy-Item $releaseApk.FullName -Destination $dest -Force
    Write-Host "Copied release APK to: $dest" -ForegroundColor Green
}
Write-Host "==========================================" -ForegroundColor Green
