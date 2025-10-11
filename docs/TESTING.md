# Testing Guide

## Available Test Commands

### Basic Testing
```powershell
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run only the SSE helper tests
npm run test:helper
```

### Coverage Reports
```powershell
# Run tests with coverage (text + HTML + lcov reports)
npm run coverage

# Run tests with coverage (text + HTML only)
npm run test:coverage

# Display coverage report from previous run
npm run test:coverage:report
```

## Coverage Output

Coverage reports are generated in multiple formats:

- **Text output**: Displayed in terminal
- **HTML report**: `coverage/index.html` (open in browser for detailed view)
- **LCOV format**: `coverage/lcov.info` (for CI/CD integration)

### Viewing HTML Coverage Report
```powershell
# Windows - open in default browser
start coverage/index.html

# Or navigate to the coverage/ folder and open index.html
```

## Current Test Coverage

```
File          | % Stmts | % Branch | % Funcs | % Lines
--------------|---------|----------|---------|----------
sseHelper.js  |   89.16 |    68.51 |     100 |   89.16
--------------|---------|----------|---------|----------
All files     |   89.52 |    61.90 |   93.33 |   89.52
```

**17 tests, all passing in ~35ms**

## Test Files

- `test/sseHelper.test.js` - Unit tests for SSE helper module (17 tests)

## Adding New Tests

1. Create test file in `test/` folder with `.test.js` extension
2. Import mocha/chai:
   ```javascript
   import { expect } from "chai";
   import { describe, it } from "mocha";
   ```
3. Run `npm test` to execute all tests

## CI/CD Integration

For CI pipelines, use:
```bash
npm run coverage
```

This generates:
- Terminal output for quick feedback
- HTML report for artifact storage
- LCOV format for coverage tracking services (Codecov, Coveralls, etc.)

## Quick Tips

- Tests run fast (~35ms) - no server startup needed
- Mock objects keep tests isolated and deterministic
- Coverage threshold: aiming for >85% statement coverage
- Uncovered lines are mostly error handling (defensive code)
