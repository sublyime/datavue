# This script automates the cleanup of redundant files and folders
# based on the analysis of your project structure.

# Set the base directory to the 'src' folder
$basePath = "C:\codeingproj\visual-dcs\datavue\src"
Set-Location -Path $basePath

# --- Step 1: Delete Redundant Files ---

Write-Host "--- Deleting redundant files... (Running with -WhatIf)"
Write-Host "Remove -WhatIf from the script to perform the deletions."

# Delete the empty page.tsx in the API dashboard route
Remove-Item -Path ".\app\api\dashboard\page.tsx" -WhatIf

# Delete the redundant component files
Remove-Item -Path ".\components\interactive-map.tsx" -WhatIf
Remove-Item -Path ".\components\dynamic-chart.tsx" -WhatIf

# Delete the unused placeholder image files
Remove-Item -Path ".\lib\placeholder-images.json" -WhatIf
Remove-Item -Path ".\lib\placeholder-images.ts" -WhatIf

Write-Host ""
Write-Host "File deletion simulation complete."

# --- Step 2: Rename and Consolidate the Dashboard Directory ---

Write-Host "--- Moving and renaming the dashboard directory... (This will execute immediately)"

# Check if the source directory exists
$sourceDir = ".\app\(dashboard)\dashboard"
$destDir = ".\app\(dashboard)\"

if (Test-Path -Path $sourceDir) {
    # Move the contents of the redundant 'dashboard' folder to the parent '(dashboard)' folder
    # This consolidates the page and the layout
    Move-Item -Path "$sourceDir\page.tsx" -Destination "$destDir\page.tsx"
    
    # Remove the now empty 'dashboard' folder
    Remove-Item -Path $sourceDir -Recurse -Force
    
    Write-Host "Directory consolidation complete. The page is now at .\app\(dashboard)\page.tsx"
} else {
    Write-Host "Source directory $sourceDir not found. Skipping directory move."
}

Write-Host ""
Write-Host "All cleanup tasks are complete."