#!/bin/bash

# Script untuk fix bug printer surat jalan
echo "🔧 Fixing printer bugs..."

# Check git status
echo "📋 Checking git status..."
git status

# Add all changes
echo "➕ Adding all changes..."
git add .

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Fix: Bug printer surat jalan - alamat hardcoded dan tanggal salah

- Perbaiki alamat penerima yang hardcoded di printer
- Ganti alamat hardcoded dengan data destination dari form
- Perbaiki tanggal yang menggunakan createdAt menjadi date
- Tambahkan property date ke safeDeliveryNote object
- Fix linting errors

Fixes: 
- Alamat tujuan tidak sesuai dengan PO yang dipilih
- Tanggal print tidak sesuai dengan input form"

# Push to main branch
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Bug fixes deployed!"
echo "🔗 Check your GitHub repository for the changes"
echo ""
echo "📝 Changes made:"
echo "  - src/components/SuratJalanPrinter.tsx: Fixed hardcoded address and date"
echo ""
echo "🎯 Issues resolved:"
echo "  - Alamat tujuan sekarang menggunakan data dari form"
echo "  - Tanggal print sekarang menggunakan date dari form"
