#!/bin/bash
# Documentation Structure Verification Script

echo "🔍 Verifying Documentation Structure..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((FAIL++))
    fi
}

# Check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        ((FAIL++))
    fi
}

echo "📁 Checking Directory Structure..."
check_dir "docs"
check_dir "docs/diagrams"
echo ""

echo "📄 Checking Documentation Files..."
check_file "README.md"
check_file "docs/README.md"
check_file "docs/OBSERVABLE_PATTERN.md"
check_file "docs/OBSERVABLE_README.md"
check_file "docs/OBSERVABLE_REFACTOR.md"
check_file "docs/OBSERVABLE_DIAGRAMS.md"
check_file "docs/QUICK_REFERENCE.md"
check_file "docs/SERVER_SSE.md"
check_file "docs/TESTING.md"
check_file "docs/REFACTOR_SUMMARY.md"
check_file "docs/DOCUMENTATION_MIGRATION.md"
echo ""

echo "📊 Checking Client Diagram Files..."
check_file "docs/diagrams/README.md"
check_file "docs/diagrams/client-time-flow.mmd"
check_file "docs/diagrams/observable-architecture.mmd"
check_file "docs/diagrams/observable-dataflow.mmd"
check_file "docs/diagrams/pattern-comparison.mmd"
check_file "docs/diagrams/multiple-subscribers.mmd"
check_file "docs/diagrams/observable-lifecycle.mmd"
check_file "docs/diagrams/operator-chaining.mmd"
echo ""

echo "🖥️  Checking Server Diagram Files..."
check_file "docs/diagrams/server-sse-architecture.mmd"
check_file "docs/diagrams/server-sse-lifecycle.mmd"
check_file "docs/diagrams/server-sse-shutdown.mmd"
check_file "docs/diagrams/server-hooks.mmd"
echo ""

echo "🚫 Checking Old Locations (Should NOT Exist)..."
OLD_LOCATIONS=(
    "TESTING.md"
    "REFACTOR_SUMMARY.md"
    "public/javascripts/time.mmd"
    "src/modules/sse/sse.md"
    "src/modules/sse/sse.mmd"
    "src/modules/sse/Broadcast Server Sent Events Lifecycle.mmd"
    "src/modules/sse/sse-shutdown.mmd"
    "src/modules/hooks/hooks.mmd"
)

for file in "${OLD_LOCATIONS[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file (correctly moved)"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠${NC}  $file (still exists, should be deleted)"
        ((FAIL++))
    fi
done
echo ""

echo "📝 Summary:"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All documentation properly organized!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some issues found. Please review above.${NC}"
    exit 1
fi
