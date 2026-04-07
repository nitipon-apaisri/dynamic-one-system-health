#!/bin/bash

# 1. Check if we should skip
if [ "$SKIP_OSV" = "true" ]; then
    echo "⏩ SKIP_OSV is true. Skipping security scan..."
    exit 0
fi

# 2. Check if osv-scanner exists
if ! command -v osv-scanner &> /dev/null; then
    echo "⚠️  osv-scanner not found. Skipping local scan."
    echo "💡 Install it: brew install osv-scanner"
    exit 0 # Soft fail: don't block teammates who don't have it
fi

# 3. Run the scan
echo "🛡️  Running OSV-Scanner..."
osv-scanner scan source -r .

# 4. Handle results
if [ $? -eq 0 ]; then
    echo "✅ No vulnerabilities found."
    exit 0
else
    echo "🛑 Vulnerabilities detected! Push aborted."
    echo "💡 To bypass: SKIP_OSV=true git push"
    exit 1
fi