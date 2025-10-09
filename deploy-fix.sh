#!/bin/bash

# Script untuk deploy fix bug alamat dan tanggal
echo "🚀 Deploying bug fixes..."

# Check git status
echo "📋 Checking git status..."
git status

# Add all changes
echo "➕ Adding all changes..."
git add .

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Fix: Bug alamat tujuan dan tanggal pengiriman

- Perbaiki konflik destinationSearch vs formData.destination di form edit
- Tambahkan useEffect untuk sinkronisasi form data saat note prop berubah
- Perbaiki auto-fill destination dari PO agar tidak menimpa data existing
- Tambahkan logging untuk debugging di form, database, dan print
- Perbaiki linting errors dan type issues
- Memperbaiki fallback date handling

Fixes: Alamat tujuan kosong saat edit dan tanggal tidak sinkron"

# Push to main branch
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Deployment completed!"
echo "🔗 Check your GitHub repository for the changes"
