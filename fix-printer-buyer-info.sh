#!/bin/bash

# Script untuk fix printer - tambah informasi pembeli dari PO
echo "🔧 Fixing printer - adding buyer information from PO..."

# Check git status
echo "📋 Checking git status..."
git status

# Add all changes
echo "➕ Adding all changes..."
git add .

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Fix: Tambah informasi pembeli dari PO ke printer surat jalan

- Tambah interface PurchaseOrder ke SuratJalanPrinter
- Load data PO di PrintSuratJalan component
- Update template printer untuk menampilkan nama pembeli dan telepon
- Tambah data PO ke generatePrintContent dan generateExcelContent
- Pass purchaseOrders data ke SuratJalanPrinter component

Fixes: 
- Nama pembeli tidak muncul di print output
- Telepon pembeli tidak muncul di print output
- Data pembeli sekarang diambil dari detail PO yang sesuai"

# Push to main branch
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Buyer info fix deployed!"
echo "🔗 Check your GitHub repository for the changes"
echo ""
echo "📝 Changes made:"
echo "  - src/components/SuratJalanPrinter.tsx: Added PO data integration"
echo "  - src/components/PrintSuratJalan.tsx: Added PO loading and passing"
echo ""
echo "🎯 Issues resolved:"
echo "  - Nama pembeli sekarang muncul di print output"
echo "  - Telepon pembeli sekarang muncul di print output"
echo "  - Data pembeli diambil dari detail PO yang sesuai"


