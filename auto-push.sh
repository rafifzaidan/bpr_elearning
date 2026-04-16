#!/bin/bash

# auto-push.sh untuk Mac
# Pindah ke folder script ini berada
cd "$(dirname "$0")"

echo "Sedang menjalankan Auto-Push. JANGAN TUTUP jendela khusus ini."
echo "Setiap kamu melakukan 'Save' (CMD+S), kodinganmu otomatis dikirim ke temanmu."

while true; do
    # Benda yang baru diubah atau diparsing
    status=$(git status --porcelain)
    
    if [ -n "$status" ]; then
        echo "$(date '+%H:%M:%S') 🚀 Mendeteksi perubahan kodingan, mengirim..."
        
        git add .
        git commit -m "Auto-save dari Mac $(date '+%Y-%m-%d %H:%M:%S')" > /dev/null 2>&1
        git push origin master > /dev/null 2>&1
        
        echo "✅ Kodingan berhasil dikirim ke temanmu!"
    fi
    
    # Tunggu 15 detik sebelum mengecek lagi
    sleep 15
done
