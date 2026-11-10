$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $Desktop)) {
    $Desktop = Join-Path $env:USERPROFILE "OneDrive\Desktop"
    if (-not (Test-Path $Desktop)) {
        $Desktop = Join-Path $env:USERPROFILE "Desktop"
    }
}

$ExePath = Join-Path $PSScriptRoot "..\dist\win-unpacked\AI Mortgage Assistant.exe"
$ExeFullPath = [System.IO.Path]::GetFullPath($ExePath)
$WorkingDir = [System.IO.Path]::GetDirectoryName($ExeFullPath)

# 1. Native Desktop App Shortcut
$ShortcutPath = Join-Path $Desktop "AI Mortgage Assistant.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $ExeFullPath
$Shortcut.WorkingDirectory = $WorkingDir
$Shortcut.Description = "Canadian AI Mortgage Assistant & Underwriting Cockpit (OSFI B-20 & Steve's Desk)"
$Shortcut.IconLocation = "$ExeFullPath,0"
$Shortcut.Save()

# 2. Browser 1-Click Internet Shortcut
$UrlPath = Join-Path $Desktop "Canadian Mortgage Platform.url"
$UrlContent = "[InternetShortcut]`r`nURL=http://localhost:3000`r`nIconIndex=0`r`nIconFile=$ExeFullPath`r`n"
[System.IO.File]::WriteAllText($UrlPath, $UrlContent)

# 3. Quick Launch Batch File
$BatPath = Join-Path $Desktop "Launch Canadian Mortgage Cockpit.bat"
$BatContent = "@echo off`r`ntitle Canadian Mortgage Assistant`r`necho Opening Canadian Mortgage Assistant in your browser...`r`nstart http://localhost:3000`r`n"
[System.IO.File]::WriteAllText($BatPath, $BatContent)

Write-Host "✅ Desktop shortcut created at: $ShortcutPath"
Write-Host "✅ Desktop web shortcut created at: $UrlPath"
Write-Host "✅ Desktop batch launcher created at: $BatPath"
Write-Host "Target: $ExeFullPath"
Write-Host "Verification: $(Test-Path $ShortcutPath)"
