#!/bin/bash

# auto-pull.sh untuk Mac
# Pindah ke folder script ini berada
cd "$(dirname "$0")"

echo "Sedang menjalankan Auto-Pull. JANGAN TUTUP jendela khusus ini jika ingin tetap tersinkron."
echo "Menunggu perubahan dari temanmu..."

while true; do
    # Ambil info terbaru dari github
    git fetch origin > /dev/null 2>&1

    # Bandingkan versi laptop local dengan versi github (remote)
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse @{u})

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "$(date '+%H:%M:%S') 🔄 Ada kode baru! Mengunduh..."
        git pull --rebase origin master > /dev/null 2>&1
        echo "✅ Berhasil diperbarui!"
    fi

    # Tunggu 10 detik sebelum ngecek lagi
    sleep 10
done
