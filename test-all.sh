#!/bin/bash

echo "🧪 Running all tests for FreeTrackingPixel..."
echo ""

# Run unit tests
echo "📝 Running unit tests..."
pnpm test:unit
UNIT_EXIT=$?

# Run e2e tests
echo ""
echo "🌐 Running e2e tests..."
pnpm test:e2e
E2E_EXIT=$?

# Summary
echo ""
echo "📊 Test Summary:"
echo "=================="

if [ $UNIT_EXIT -eq 0 ]; then
    echo "✅ Unit tests: PASSED"
else
    echo "❌ Unit tests: FAILED"
fi

if [ $E2E_EXIT -eq 0 ]; then
    echo "✅ E2E tests: PASSED"
else
    echo "❌ E2E tests: FAILED"
fi

# Exit with error if any tests failed
if [ $UNIT_EXIT -ne 0 ] || [ $E2E_EXIT -ne 0 ]; then
    exit 1
fi

echo ""
echo "🎉 All tests passed!"