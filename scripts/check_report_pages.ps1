$path = 'C:\Users\alfin\OneDrive\Desktop\log-my-class\index.docx'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($path, $false, $true)
$doc.Repaginate()
$pages = $doc.ComputeStatistics(2)
Write-Output ("PAGES=$pages")
$doc.Close()
$word.Quit()
