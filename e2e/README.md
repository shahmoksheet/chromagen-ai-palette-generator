# ChromaGen Comprehensive Testing Suite

This directory contains the comprehensive testing suite for ChromaGen, including end-to-end tests, visual regression tests, accessibility tests, database integration tests, and load tests.

## 🧪 Test Types

### 1. End-to-End Tests (Playwright)
- **Location**: `tests/*.spec.ts`
- **Purpose**: Test complete user workflows across the application
- **Coverage**: User interactions, form submissions, API integrations, file uploads
- **Run**: `npm run test`

### 2. Visual Regression Tests
- **Location**: `tests/02-visual-regression.spec.ts`
- **Purpose**: Detect visual changes in UI components and layouts
- **Coverage**: Screenshots comparison, color accuracy validation
- **Run**: `npm run test:visual`

### 3. Accessibility Tests
- **Location**: `tests/03-accessibility.spec.ts`
- **Purpose**: Ensure WCAG compliance and accessibility standards
- **Coverage**: Screen reader compatibility, keyboard navigation, color contrast
- **Run**: `npm run test:accessibility`

### 4. Database Integration Tests
- **Location**: `database-tests/*.test.ts`
- **Purpose**: Test database operations and data integrity
- **Coverage**: CRUD operations, relationships, constraints, concurrent access
- **Run**: `npm run test:db`

### 5. Load Tests
- **Location**: `load-tests/api-load-test.yml`
- **Purpose**: Test API performance under concurrent load
- **Coverage**: Response times, throughput, error rates
- **Run**: `npm run test:load`

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup
```bash
# Copy environment variables
cp ../.env.example .env

# Set test database URL
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/chromagen_test"
```

### Running Tests

```bash
# Run all E2E tests
npm run test

# Run specific test suites
npm run test:visual
npm run test:accessibility
npm run test:db
npm run test:load

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode
npm run test:debug
```

## 📊 Test Configuration

### Playwright Configuration
- **File**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Reporters**: HTML, JSON, JUnit
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

### Database Test Configuration
- **File**: `jest.config.js`
- **Environment**: Node.js
- **Setup**: `database-tests/setup.ts`
- **Cleanup**: Automatic before/after each test

### Load Test Configuration
- **File**: `load-tests/api-load-test.yml`
- **Tool**: Artillery
- **Phases**: Warm-up, Ramp-up, Sustained load, Peak load
- **Scenarios**: Text generation, Image upload, Export, History

## 🛠️ Test Utilities

### TestHelpers Class
```typescript
import { TestHelpers } from './utils/test-helpers';

const helpers = new TestHelpers(page);
await helpers.generateTestPalette('sunset colors');
await helpers.validateColorHexValues();
```

### Visual Comparison
```typescript
import { VisualComparison } from './utils/visual-comparison';

const visual = new VisualComparison();
const result = await visual.compareColorAccuracy(page, expectedColors);
```

## 📈 Coverage and Reporting

### Test Reports
- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/results.xml`
- **Coverage Report**: `coverage/index.html`

### Viewing Reports
```bash
# Open Playwright HTML report
npm run report

# View coverage report
open coverage/index.html
```

## 🔧 Debugging Tests

### Debug Mode
```bash
# Debug specific test
npx playwright test --debug tests/01-basic-functionality.spec.ts

# Debug with specific browser
npx playwright test --debug --project=chromium
```

### Screenshots and Videos
- Screenshots are taken on test failure
- Videos are recorded for failed tests
- Traces are captured on retry
- All artifacts are saved in `test-results/`

### Console Logs
```typescript
// Enable console logs in tests
page.on('console', msg => console.log(msg.text()));
```

## 🌐 Cross-Browser Testing

### Supported Browsers
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile
- **Viewports**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

### Browser-Specific Tests
```typescript
test.describe('Chrome-specific tests', () => {
  test.use({ browserName: 'chromium' });
  // Chrome-specific test logic
});
```

## 🔄 Continuous Integration

### GitHub Actions
- **File**: `../.github/workflows/test.yml`
- **Triggers**: Push to main/develop, Pull requests
- **Matrix**: Node.js 18.x, 20.x
- **Parallel**: Unit, E2E, Accessibility, Visual, Load tests

### Test Artifacts
- Test reports uploaded as artifacts
- Screenshots and videos for failed tests
- Coverage reports sent to Codecov

## 📝 Writing New Tests

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    const helpers = new TestHelpers(page);
    
    // Test implementation
    await helpers.generateTestPalette();
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Accessibility Test Template
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/feature');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Visual Test Template
```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/feature');
  await page.waitForLoadState('networkidle');
  
  await expect(page.locator('[data-testid="component"]')).toHaveScreenshot('component.png', {
    threshold: 0.2,
  });
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in `playwright.config.ts`
   - Add explicit waits for dynamic content
   - Check network conditions

2. **Visual tests failing**
   - Update baseline images if UI changes are intentional
   - Adjust threshold values for acceptable differences
   - Check for font rendering differences across environments

3. **Database tests failing**
   - Ensure test database is running
   - Check connection string
   - Verify migrations are applied

4. **Load tests failing**
   - Check API endpoints are accessible
   - Verify API keys are set
   - Ensure sufficient system resources

### Debug Commands
```bash
# Check Playwright installation
npx playwright --version

# List installed browsers
npx playwright list

# Check test files
npx playwright test --list

# Dry run tests
npx playwright test --dry-run
```

## 📚 Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and isolated
- Use data-testid attributes for reliable selectors

### Performance
- Use `page.waitForLoadState('networkidle')` for dynamic content
- Implement proper cleanup in beforeEach/afterEach
- Use parallel execution where possible
- Mock external services in unit tests

### Maintenance
- Update baselines when UI changes are intentional
- Review and update test data regularly
- Keep test dependencies up to date
- Monitor test execution times

### Accessibility
- Test with keyboard navigation
- Verify screen reader compatibility
- Check color contrast ratios
- Test with reduced motion preferences

## 🤝 Contributing

When adding new tests:
1. Follow the existing test structure
2. Add appropriate data-testid attributes to components
3. Include both positive and negative test cases
4. Update this README if adding new test types
5. Ensure tests are deterministic and reliable

## 📞 Support

For questions about the testing suite:
- Check existing test examples
- Review Playwright documentation
- Check GitHub issues for similar problems
- Contact the development team