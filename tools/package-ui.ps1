$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stageRoot = Join-Path $projectRoot 'output\techcare-pixel-ui-v1'
$uiTarget = Join-Path $stageRoot 'public\assets\ui'
$sourceTarget = Join-Path $stageRoot 'ui-source'
$reactTarget = Join-Path $stageRoot 'src\ui'
$toolTarget = Join-Path $stageRoot 'tools'
New-Item -ItemType Directory -Path $uiTarget,$sourceTarget,$reactTarget,$toolTarget -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'public\assets\ui\png') -Destination $uiTarget -Recurse -Force
foreach ($name in @('atlas.png','atlas.json','manifest.json')) { Copy-Item -LiteralPath (Join-Path $projectRoot "public\assets\ui\$name") -Destination $uiTarget -Force }
Copy-Item -LiteralPath (Join-Path $projectRoot 'ui-source\svg') -Destination $sourceTarget -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'ui-source\overview.png') -Destination $sourceTarget -Force
foreach ($name in @('PixelUI.tsx','pixel.css','manifest.generated.json')) { Copy-Item -LiteralPath (Join-Path $projectRoot "src\ui\$name") -Destination $reactTarget -Force }
foreach ($name in @('build-ui.mjs','export-ui.mjs')) { Copy-Item -LiteralPath (Join-Path $projectRoot "tools\$name") -Destination $toolTarget -Force }
Copy-Item -LiteralPath (Join-Path $projectRoot 'UI_KIT.md') -Destination (Join-Path $stageRoot 'README.md') -Force
$package = @{ name='techcare-pixel-ui'; version='1.0.0'; private=$true; type='module'; scripts=@{ build='node tools/build-ui.mjs'; 'export:svg'='node tools/export-ui.mjs' }; devDependencies=@{ sharp='^0.34.5' }; peerDependencies=@{ react='>=18' } }
$package | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $stageRoot 'package.json') -Encoding utf8
@'
TechCare Pixel UI v1.0
Original pixel geometry authored for TechCare with coding assistance.
You may use, modify and distribute these original UI images and source files for personal and commercial projects without attribution.
This permission applies only to the 55 original UI sprites, their SVG sources, and the UI generator/components in this archive.
It does not grant rights to the reference pack, third-party fonts, or the game's supplied character/city art. None of those are included here.
'@ | Set-Content -LiteralPath (Join-Path $stageRoot 'LICENSE.txt') -Encoding utf8
$archive = Join-Path $projectRoot 'output\techcare-pixel-ui-v1.zip'
$items = @('public','ui-source','src','tools','README.md','package.json','LICENSE.txt') | ForEach-Object { Join-Path $stageRoot $_ }
Compress-Archive -LiteralPath $items -DestinationPath $archive -CompressionLevel Optimal -Force
Copy-Item -LiteralPath $archive -Destination (Join-Path $projectRoot 'public\assets\ui\techcare-pixel-ui.zip') -Force
Copy-Item -LiteralPath $archive -Destination (Join-Path (Split-Path -Parent $projectRoot) 'techcare-pixel-ui-v1.zip') -Force
Get-Item -LiteralPath $archive | Select-Object FullName,Length
