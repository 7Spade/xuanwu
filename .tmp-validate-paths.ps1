$ErrorActionPreference = "Stop"
$root = "D:\7s\xuanwu"
Set-Location $root

$files = @("AGENTS.md", ".github/copilot-instructions.md")
$files += Get-ChildItem ".github/instructions" -Filter "*.md" -File | ForEach-Object { $_.FullName.Replace($root + "\\", "") }
$files += Get-ChildItem ".github/skills" -Filter "AGENTS.md" -File -Recurse | ForEach-Object { $_.FullName.Replace($root + "\\", "") }

$prefixes = @("docs/","src/","skills/","public/","config/","app/","firebase/",".github/",".claude/","README.md","AGENTS.md","D:/","D:\\")
$results = @()

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  $tokens = $content -split "\s+"
  foreach ($t in $tokens) {
    $candidate = $t.Trim('`','"','''','(',')','[',']','{','}','<','>',',',';')
    if ([string]::IsNullOrWhiteSpace($candidate)) { continue }

    $matchPrefix = $false
    foreach ($p in $prefixes) {
      if ($candidate.StartsWith($p, [System.StringComparison]::OrdinalIgnoreCase)) { $matchPrefix = $true; break }
    }
    if (-not $matchPrefix) { continue }

    if ($candidate -match '^(https?:|copilot-skill:|nextjs-docs:|file:|vscode:)') { continue }
    if ($candidate -match '[\*\?\{\}]') { continue }

    $candidate = $candidate.TrimEnd('.',':')
    $candidate = $candidate -replace '/', '\\'
    if ($candidate -match '^\.\\') { $candidate = $candidate.Substring(2) }
    if ($candidate -match '^\.\.\\') { continue }

    if ($candidate -match '[<>|]') { continue }
    if ($candidate -match '"') { continue }

    $full = if ($candidate -match '^[A-Za-z]:\\') { $candidate } else { Join-Path $root $candidate }
    $exists = $false
    try { $exists = Test-Path -LiteralPath $full } catch { $exists = $false }

    $results += [pscustomobject]@{
      Source = $f
      Ref = $t
      Normalized = $candidate
      Exists = $exists
    }
  }
}

$uniq = $results | Sort-Object Source, Normalized -Unique
$invalid = $uniq | Where-Object { -not $_.Exists }
$valid = $uniq | Where-Object { $_.Exists }

Write-Output ("CHECKED_FILES=" + $files.Count)
Write-Output ("UNIQUE_REFS=" + $uniq.Count)
Write-Output ("VALID_REFS=" + $valid.Count)
Write-Output ("INVALID_REFS=" + $invalid.Count)
Write-Output "--- INVALID DETAILS ---"
$invalid | Sort-Object Source, Normalized | ForEach-Object {
  Write-Output ("{0} | {1} | {2}" -f $_.Source, $_.Ref, $_.Normalized)
}
