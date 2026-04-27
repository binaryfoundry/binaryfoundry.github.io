$ErrorActionPreference = 'Stop'

$bundleUrl = 'https://www.xordev.com/_astro/PostsGrid.BxKTlt6K.js'
$bundlePath = Join-Path $PSScriptRoot 'PostsGrid.chunk.js'
$outPath = Join-Path $PSScriptRoot 'shaders.json'

Write-Host "Downloading bundle..."
Invoke-WebRequest -Uri $bundleUrl -OutFile $bundlePath
$bundle = Get-Content -Raw -Path $bundlePath

# Extract id/title pairs from the minified object in the chunk.
$matches = [regex]::Matches($bundle, '"(\d{15,20})":\{title:"([^"]+)"')
if ($matches.Count -eq 0) {
  throw 'No shader IDs found in bundle.'
}

$idToTitle = @{}
foreach ($m in $matches) {
  $id = $m.Groups[1].Value
  $title = $m.Groups[2].Value
  if (-not $idToTitle.ContainsKey($id)) {
    $idToTitle[$id] = $title
  }
}

$ids = $idToTitle.Keys | Sort-Object {[decimal]$_} -Descending
Write-Host ("Found {0} shader IDs" -f $ids.Count)

function Clean-ShaderText([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) {
    return ''
  }

  $clean = $text -replace 'https?://\S+', ''
  $clean = $clean -replace '&lt;', '<'
  $clean = $clean -replace '&gt;', '>'
  $clean = $clean -replace '&amp;', '&'
  $clean = $clean.Trim()

  # Remove leading title line like "Twist"
  $lines = $clean -split "`r?`n"
  if ($lines.Count -gt 0 -and $lines[0] -match '^\s*".+"\s*$') {
    $lines = $lines[1..($lines.Count - 1)]
  }

  $clean = ($lines -join "`n").Trim()
  return $clean
}

function Looks-LikeShader([string]$code) {
  if ([string]::IsNullOrWhiteSpace($code)) {
    return $false
  }

  return (
    $code -match 'vec[234]\s' -or
    $code -match 'for\s*\(' -or
    $code -match 'mat[234]\s*\(' -or
    $code -match '\bo\.rgb\b' -or
    $code -match '\bgl_FragColor\b'
  )
}

$results = New-Object System.Collections.Generic.List[object]
$index = 0
foreach ($id in $ids) {
  $index++
  $api = "https://api.fxtwitter.com/XorDev/status/$id"

  try {
    $resp = Invoke-RestMethod -Uri $api -TimeoutSec 30
    $text = ''
    if ($resp.tweet -and $resp.tweet.text) {
      $text = [string]$resp.tweet.text
    }

    $code = Clean-ShaderText $text
    if (Looks-LikeShader $code) {
      $results.Add([pscustomobject]@{
        id = $id
        title = $idToTitle[$id]
        url = "https://x.com/XorDev/status/$id"
        code = $code
      })
    }
  } catch {
    Write-Warning ("Failed {0}/{1} for {2}: {3}" -f $index, $ids.Count, $id, $_.Exception.Message)
  }

  if (($index % 25) -eq 0) {
    Write-Host ("Processed {0}/{1}..." -f $index, $ids.Count)
  }
}

$results | ConvertTo-Json -Depth 5 | Out-File -FilePath $outPath -Encoding utf8
Write-Host ("Saved {0} shader snippets to {1}" -f $results.Count, $outPath)
