# This script automates the final cleanup of redundant API files.

# Set the base directory to the 'src' folder
$basePath = "C:\codeingproj\visual-dcs\datavue\src"
Set-Location -Path $basePath

# --- Step 1: Delete Redundant API Route File ---

Write-Host "--- Deleting redundant API route... (Running with -WhatIf)"
Write-Host "Remove -WhatIf from the script to perform the deletion."

# Delete the redundant status route
Remove-Item -Path ".\app\api\data-sources\status\route.ts" -Force -WhatIf

Write-Host ""
Write-Host "File deletion simulation complete."

# --- Step 2: Delete the now empty folder ---
# Check if the 'status' folder is now empty and remove it
$statusFolder = ".\app\api\data-sources\status"
if ((Get-Item -Path $statusFolder).GetFiles().Count -eq 0) {
    Write-Host "Removing now empty 'status' folder: $statusFolder"
    Remove-Item -Path $statusFolder -Recurse -Force -WhatIf
}

Write-Host ""
Write-Host "All cleanup tasks are complete."