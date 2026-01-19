Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Header($Text) {
  Write-Host ""
  Write-Host "== $Text =="
}

function Write-Note($Text) {
  Write-Host " - $Text"
}

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Header "Windows developer setup"

if (-not (Test-Command "winget") -and -not (Test-Command "choco")) {
  Write-Note "Install winget (App Installer) or Chocolatey to automate dependencies."
} else {
  if (Test-Command "winget") {
    Write-Header "Installing dependencies via winget"
    winget install -e --id OpenJS.NodeJS.LTS
    winget install -e --id Rustlang.Rustup
    winget install -e --id Microsoft.VisualStudio.2022.BuildTools
    Write-Note "If prompted, select the 'Desktop development with C++' workload."
  } else {
    Write-Header "Installing dependencies via Chocolatey"
    choco install -y nodejs-lts rust visualstudio2022buildtools
    Write-Note "If prompted, select the 'Desktop development with C++' workload."
  }
}

Write-Header "Tooling check"
$missing = @()
foreach ($tool in @("node", "npm", "cargo", "rustc")) {
  if (-not (Test-Command $tool)) {
    $missing += $tool
  }
}

if ($missing.Count -eq 0) {
  Write-Note "Node.js and Rust toolchains are available"
} else {
  Write-Note ("Missing tools: " + ($missing -join ", "))
  Write-Note "Install Node.js (>=18) and Rust (rustup) before running the app."
}

Write-Header "Done"
Write-Note "Next: npm install"
