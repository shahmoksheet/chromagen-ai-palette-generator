#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.results = {
      unit: { status: 'pending', duration: 0, coverage: null },
      database: { status: 'pending', duration: 0 },
      e2e: { status: 'pending', duration: 0 },
      accessibility: { status: 'pending', duration: 0 },
      visual: { status: 'pending', duration: 0 },
      load: { status: 'pending', duration: 0 }
    };
    this.startTime = Date.now();
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      console.log(`\n🚀 Running: ${command} ${args.join(' ')}`);
      
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          console.log(`✅ Command completed in ${duration}ms`);
          resolve({ code, duration });
        } else {
          console.log(`❌ Command failed with code ${code} after ${duration}ms`);
          reject({ code, duration });
        }
      });

      child.on('error', (error) => {
        console.error(`❌ Command error:`, error);
        reject({ error, duration: Date.now() - startTime });
      });
    });
  }

  async runUnitTests() {
    console.log('\n📋 Running Unit Tests...');
    try {
      // Frontend tests
      const frontendResult = await this.runCommand('npm', ['run', 'test'], {
        cwd: path.join(process.cwd(), 'frontend')
      });
      
      // Backend tests
      const backendResult = await this.runCommand('npm', ['run', 'test'], {
        cwd: path.join(process.cwd(), 'backend')
      });

      this.results.unit.status = 'passed';
      this.results.unit.duration = frontendResult.duration + backendResult.duration;
      
      // Try to read coverage information
      try {
        const frontendCoverage = this.readCoverageReport('frontend');
        const backendCoverage = this.readCoverageReport('backend');
        this.results.unit.coverage = { frontend: frontendCoverage, backend: backendCoverage };
      } catch (error) {
        console.warn('Could not read coverage reports:', error.message);
      }
      
    } catch (error) {
      this.results.unit.status = 'failed';
      this.results.unit.duration = error.duration || 0;
      throw error;
    }
  }

  async runDatabaseTests() {
    console.log('\n🗄️ Running Database Integration Tests...');
    try {
      const result = await this.runCommand('npm', ['run', 'test:db'], {
        cwd: path.join(process.cwd(), 'e2e')
      });
      
      this.results.database.status = 'passed';
      this.results.database.duration = result.duration;
    } catch (error) {
      this.results.database.status = 'failed';
      this.results.database.duration = error.duration || 0;
      throw error;
    }
  }

  async runE2ETests() {
    console.log('\n🎭 Running End-to-End Tests...');
    try {
      // Install browsers if needed
      await this.runCommand('npx', ['playwright', 'install'], {
        cwd: path.join(process.cwd(), 'e2e')
      });
      
      const result = await this.runCommand('npm', ['run', 'test'], {
        cwd: path.join(process.cwd(), 'e2e')
      });
      
      this.results.e2e.status = 'passed';
      this.results.e2e.duration = result.duration;
    } catch (error) {
      this.results.e2e.status = 'failed';
      this.results.e2e.duration = error.duration || 0;
      throw error;
    }
  }

  async runAccessibilityTests() {
    console.log('\n♿ Running Accessibility Tests...');
    try {
      const result = await this.runCommand('npm', ['run', 'test:accessibility'], {
        cwd: path.join(process.cwd(), 'e2e')
      });
      
      this.results.accessibility.status = 'passed';
      this.results.accessibility.duration = result.duration;
    } catch (error) {
      this.results.accessibility.status = 'failed';
      this.results.accessibility.duration = error.duration || 0;
      throw error;
    }
  }

  async runVisualTests() {
    console.log('\n👁️ Running Visual Regression Tests...');
    try {
      const result = await this.runCommand('npm', ['run', 'test:visual'], {
        cwd: path.join(process.cwd(), 'e2e')
      });
      
      this.results.visual.status = 'passed';
      this.results.visual.duration = result.duration;
    } catch (error) {
      this.results.visual.status = 'failed';
      this.results.visual.duration = error.duration || 0;
      throw error;
    }
  }

  async runLoadTests() {
    console.log('\n⚡ Running Load Tests...');
    try {
      const result = await this.runCommand('npm', ['run', 'test:load'], {
        cwd: path.join(process.cwd(), 'e2e')
      });
      
      this.results.load.status = 'passed';
      this.results.load.duration = result.duration;
    } catch (error) {
      this.results.load.status = 'failed';
      this.results.load.duration = error.duration || 0;
      // Don't throw for load tests - they're optional
      console.warn('Load tests failed, but continuing...');
    }
  }

  readCoverageReport(project) {
    const coveragePath = path.join(process.cwd(), project, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      return {
        lines: coverage.total.lines.pct,
        functions: coverage.total.functions.pct,
        branches: coverage.total.branches.pct,
        statements: coverage.total.statements.pct
      };
    }
    return null;
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = Object.values(this.results).filter(r => r.status === 'passed').length;
    const failed = Object.values(this.results).filter(r => r.status === 'failed').length;
    const skipped = Object.values(this.results).filter(r => r.status === 'pending').length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
    console.log('');

    Object.entries(this.results).forEach(([testType, result]) => {
      const icon = result.status === 'passed' ? '✅' : 
                   result.status === 'failed' ? '❌' : '⏸️';
      const duration = result.duration ? `(${(result.duration / 1000).toFixed(2)}s)` : '';
      console.log(`${icon} ${testType.toUpperCase().padEnd(15)} ${result.status.padEnd(10)} ${duration}`);
      
      if (result.coverage) {
        Object.entries(result.coverage).forEach(([project, cov]) => {
          if (cov) {
            console.log(`   📈 ${project} coverage: ${cov.lines}% lines, ${cov.functions}% functions`);
          }
        });
      }
    });

    console.log('='.repeat(60));

    // Generate JSON report
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: { passed, failed, skipped },
      results: this.results
    };

    const reportPath = path.join(process.cwd(), 'test-results', 'comprehensive-test-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    return failed === 0;
  }

  async run() {
    console.log('🧪 Starting Comprehensive Test Suite...');
    console.log(`📅 ${new Date().toISOString()}`);
    
    const testSuites = [
      { name: 'Unit Tests', fn: () => this.runUnitTests() },
      { name: 'Database Tests', fn: () => this.runDatabaseTests() },
      { name: 'E2E Tests', fn: () => this.runE2ETests() },
      { name: 'Accessibility Tests', fn: () => this.runAccessibilityTests() },
      { name: 'Visual Tests', fn: () => this.runVisualTests() },
      { name: 'Load Tests', fn: () => this.runLoadTests() }
    ];

    let hasFailures = false;

    for (const suite of testSuites) {
      try {
        await suite.fn();
        console.log(`✅ ${suite.name} completed successfully`);
      } catch (error) {
        console.error(`❌ ${suite.name} failed:`, error.message || error);
        hasFailures = true;
        
        // Continue with other tests unless it's a critical failure
        if (suite.name === 'Unit Tests' || suite.name === 'Database Tests') {
          console.log('💥 Critical test failure - stopping execution');
          break;
        }
      }
    }

    const success = this.generateReport();
    
    if (!success || hasFailures) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
      process.exit(0);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;