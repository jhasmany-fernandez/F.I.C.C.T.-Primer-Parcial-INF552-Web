$bytes = [System.IO.File]::ReadAllBytes("test_face.jpg")
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File -FilePath "test_face_base64_clean.txt" -Encoding ascii -NoNewline
Write-Host "Base64 string length: $($base64.Length)"
