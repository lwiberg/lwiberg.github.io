param(
  [string]$FrameDirectory = 'C:\tmp'
)

$ErrorActionPreference = 'Stop'

foreach ($tool in @('ffmpeg', 'magick')) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "$tool is required and must be available on PATH."
  }
}

$startFrame = 0
if (-not (Test-Path -LiteralPath (Join-Path $FrameDirectory '0000.png') -PathType Leaf)) {
  $startFrame = 1
  Write-Warning '0000.png was not found; using frames 0001 through 0120.'
}

for ($frame = $startFrame; $frame -le 120; $frame++) {
  $path = Join-Path $FrameDirectory ('{0:D4}.png' -f $frame)
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Missing frame: $path"
  }
}

$imagesDirectory = Join-Path $PSScriptRoot 'images'
$stagingDirectory = Join-Path $imagesDirectory ('.background-render-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stagingDirectory | Out-Null

try {
  $inputPattern = Join-Path $FrameDirectory '%04d.png'
  $frameCount = 121 - $startFrame
  $desktop = Join-Path $stagingDirectory 'homepage-background-render.mp4'
  $mobile = Join-Path $stagingDirectory 'homepage-background-render-half.mp4'
  $poster = Join-Path $stagingDirectory 'homepage-background-render-poster.webp'
  $firstFrame = Join-Path $FrameDirectory ('{0:D4}.png' -f $startFrame)

  & ffmpeg -hide_banner -loglevel warning -n -framerate 24 -start_number $startFrame -start_number_range 1 -i $inputPattern -frames:v $frameCount -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -threads 4 $desktop
  if ($LASTEXITCODE -ne 0) { throw 'Desktop video encoding failed.' }

  & ffmpeg -hide_banner -loglevel warning -n -framerate 24 -start_number $startFrame -start_number_range 1 -i $inputPattern -frames:v $frameCount -vf 'scale=trunc(iw/4)*2:trunc(ih/4)*2:flags=lanczos' -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -threads 4 $mobile
  if ($LASTEXITCODE -ne 0) { throw 'Mobile video encoding failed.' }

  & magick $firstFrame -strip -quality 82 $poster
  if ($LASTEXITCODE -ne 0) { throw 'Poster conversion failed.' }

  foreach ($asset in @($desktop, $mobile, $poster)) {
    Move-Item -LiteralPath $asset -Destination (Join-Path $imagesDirectory (Split-Path $asset -Leaf)) -Force
  }
  Write-Host "Updated homepage background assets from frames $startFrame through 120 at 24 fps."
}
finally {
  Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
}
