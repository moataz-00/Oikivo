$path = "d:\SHOGHL\sakna\packages\web\src\app\[locale]\hosting\experiences\new\page.tsx"
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("'use client';")
$lines.Add("")
Set-Content -LiteralPath $path -Value $lines -Encoding UTF8
Write-Host "Written $($lines.Count) lines"
