$repoPath = "C:\Users\Rafif\Documents\intern BPR\bpr_elearning"
Set-Location $repoPath

Write-Host "Sedang menjalankan Auto-Push. JANGAN TUTUP jendela ini."
Write-Host "Setiap kamu melakukan 'Save' (CTRL+S), kodinganmu otomatis dikirim ke temanmu."

while ($true) {
    # Cek apakah ada file yang diubah
    $status = git status --porcelain
    
    if ($status -ne $null -and $status -ne "") {
        Write-Host "$(Get-Date -Format 'HH:mm:ss')  🚀 Mendeteksi perubahan kodingan, mengirim ke Github..."
        
        # Otomatis menambahkan dan commit
        git add .
        git commit -m "Auto-save dari laptop Rafif $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" > $null 2>&1
        
        # Push ke github
        git push origin master > $null 2>&1
        
        Write-Host "✅ Kodinganmu berhasil dikirim ke temanmu!"
    }
    
    # Tunggu 15 detik sebelum mengecek lagi
    Start-Sleep -Seconds 15
}
