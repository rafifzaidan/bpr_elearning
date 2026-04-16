$repoPath = "C:\Users\Rafif\Documents\intern BPR\bpr_elearning"
Set-Location $repoPath

Write-Host "Sedang menjalankan Auto-Pull. JANGAN TUTUP jendela ini jika ingin tetap tersinkron."
Write-Host "Menunggu perubahan dari temanmu..."

while ($true) {
    # Ambil info terbaru dari github
    git fetch origin > $null 2>&1

    # Bandingkan versi laptopmu (local) dengan versi github (remote)
    $local  = git rev-parse @
    $remote = git rev-parse @{u}

    if ($local -ne $remote) {
        Write-Host "$(Get-Date -Format 'HH:mm:ss')  🔄 Ada kode baru dari temanmu! Mengunduh..."
        git pull --rebase origin master
        Write-Host "✅ Berhasil diperbarui!"
    }

    # Tunggu 10 detik sebelum ngecek lagi
    Start-Sleep -Seconds 10
}
