#!/usr/bin/env python3
# 2025-01-27: Comprehensive test runner for dirReactFinal Django backend
# Executes all test suites with coverage reporting and performance analysis

import os
import sys
import subprocess
import time
import json
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    start_time = time.time()
    # Set Django environment for all commands
    env = os.environ.copy()
    env['DJANGO_SETTINGS_MODULE'] = 'dirfinal.settings'
    result = subprocess.run(command, shell=True, capture_output=True, text=True, env=env)
    end_time = time.time()
    
    duration = end_time - start_time
    
    if result.returncode == 0:
        print(f"✅ {description} completed successfully in {duration:.2f}s")
        if result.stdout:
            print("Output:")
            print(result.stdout)
    else:
        print(f"❌ {description} failed after {duration:.2f}s")
        print("Error:")
        print(result.stderr)
        if result.stdout:
            print("Output:")
            print(result.stdout)
    
    return result.returncode == 0

def main():
    """Main test execution function"""
    print("🚀 dirReactFinal Django Backend - Comprehensive Test Suite")
    print("=" * 60)
    
    # Change to Django backend directory
    os.chdir(Path(__file__).parent)
    
    # Test execution results
    results = {}
    
    # 1. Unit Tests
    print("\n📋 Phase 1: Unit Testing")
    results['unit_tests'] = run_command(
        "python3 -m pytest --cov=dirReactFinal_core --cov=dirReactFinal_users --cov=dirReactFinal_directory --cov=dirReactFinal_family --cov=dirReactFinal_moderation --cov=dirReactFinal_scoring --cov-report=term-missing --cov-report=html:htmlcov/unit",
        "Unit Tests with Coverage"
    )
    
    # 2. Integration Tests
    print("\n📋 Phase 2: Integration Testing")
    results['integration_tests'] = run_command(
        "python3 -m pytest --cov=dirReactFinal_api --cov-report=term-missing --cov-report=html:htmlcov/integration",
        "Integration Tests with Coverage"
    )
    
    # 3. API Tests
    print("\n📋 Phase 3: API Testing")
    results['api_tests'] = run_command(
        "python3 -m pytest --cov=dirReactFinal_api --cov-report=term-missing --cov-report=html:htmlcov/api",
        "API Endpoint Tests with Coverage"
    )
    
    # 4. Authentication Tests
    print("\n📋 Phase 4: Authentication Testing")
    results['auth_tests'] = run_command(
        "python3 -m pytest --cov=dirReactFinal_core --cov=dirReactFinal_users --cov-report=term-missing --cov-report=html:htmlcov/auth",
        "Authentication & Authorization Tests"
    )
    
    # 5. Permission Tests
    print("\n📋 Phase 5: Permission Testing")
    results['permission_tests'] = run_command(
        "python3 -m pytest --cov=dirReactFinal_api --cov-report=term-missing --cov-report=html:htmlcov/permissions",
        "Permission System Tests"
    )
    
    # 6. Security Tests
    print("\n📋 Phase 6: Security Testing")
    results['security_tests'] = run_command(
        "python3 -m pytest --cov=dirReactFinal_api --cov-report=term-missing --cov-report=html:htmlcov/security",
        "Security Vulnerability Tests"
    )
    
    # 7. Performance Tests
    print("\n📋 Phase 7: Performance Testing")
    results['performance_tests'] = run_command(
        "python3 -m pytest --cov=dirReactFinal_api --cov-report=term-missing --cov-report=html:htmlcov/performance",
        "Performance & Load Tests"
    )
    
    # 8. Complete Test Suite
    print("\n📋 Phase 8: Complete Test Suite")
    results['complete_suite'] = run_command(
        "python3 -m pytest --cov=. --cov-report=html:htmlcov/complete --cov-report=term-missing --cov-report=xml:coverage.xml --cov-fail-under=95",
        "Complete Test Report Generation"
    )
    
    # 9. Generate Test Report
    print("\n📋 Phase 9: Test Report Generation")
    results['report_generation'] = run_command(
        "python3 -m coverage report --show-missing",
        "Coverage Report Generation"
    )
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST EXECUTION SUMMARY")
    print("="*60)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    failed_tests = total_tests - passed_tests
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} test phases passed")
    
    if failed_tests == 0:
        print("🎉 All test phases completed successfully!")
        print("📁 Coverage reports available in htmlcov/ directory")
        return 0
    else:
        print(f"⚠️  {failed_tests} test phase(s) failed - review required")
        return 1

if __name__ == "__main__":
    sys.exit(main())
