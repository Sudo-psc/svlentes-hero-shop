#!/bin/bash
# Post-build script for Next.js standalone output
# Copies public and static files to standalone directory

set -e

echo "📦 Copying public files to standalone..."
if [ -d "public" ] && [ -d ".next/standalone" ]; then
    cp -r public .next/standalone/
    echo "✅ Public files copied"
else
    echo "⚠️  Warning: public or standalone directory not found"
fi

echo "📦 Copying static files to standalone..."
if [ -d ".next/static" ] && [ -d ".next/standalone/.next" ]; then
    cp -r .next/static .next/standalone/.next/
    echo "✅ Static files copied"
else
    echo "⚠️  Warning: static or standalone/.next directory not found"
fi

echo "✅ Post-build complete!"
