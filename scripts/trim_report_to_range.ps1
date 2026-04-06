$path = 'C:\Users\alfin\OneDrive\Desktop\log-my-class\index.docx'
$minPages = 60
$maxPages = 70

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($path)

try {
  $doc.Repaginate()
  $pages = $doc.ComputeStatistics(2)

  while ($pages -gt $maxPages -and $doc.Paragraphs.Count -gt 20) {
    $deleteCount = [Math]::Min(20, $doc.Paragraphs.Count - 1)

    for ($i = 0; $i -lt $deleteCount; $i++) {
      $lastIndex = $doc.Paragraphs.Count
      if ($lastIndex -le 1) { break }
      $doc.Paragraphs.Item($lastIndex).Range.Delete() | Out-Null
    }

    $doc.Repaginate()
    $pages = $doc.ComputeStatistics(2)
  }

  $doc.Save()
  $doc.Repaginate()
  $finalPages = $doc.ComputeStatistics(2)
  Write-Output "TRIM_DONE"
  Write-Output "PAGES=$finalPages"
  Write-Output "PATH=$path"
}
finally {
  $doc.Close() | Out-Null
  $word.Quit()
}
