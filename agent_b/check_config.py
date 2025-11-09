#!/usr/bin/env python3
"""
Configuration checker for AI Multi-Agent System
"""
import os
import sys
from pathlib import Path

def check_environment():
    """Check if .env file exists and has required variables"""
    env_file = Path('.env')

    if not env_file.exists():
        print("ERROR: .env file not found!")
        print("Please create .env file based on SETUP.md")
        return False

    print("OK: .env file found")

    # Check required variables
    required_vars = ['GEMINI_API_KEY', 'GITHUB_USER', 'GITHUB_TOKEN']
    missing = []

    for var in required_vars:
        value = os.getenv(var, '')
        if not value or value.startswith('your_'):
            missing.append(var)
        else:
            print(f"OK: {var} is configured")

    if missing:
        print(f"ERROR: Missing or placeholder values for: {', '.join(missing)}")
        return False

    print("OK: All required configuration variables are set")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'google.generativeai',
        'requests',
        'dotenv'
    ]

    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('.', ''))
            print(f"OK: {package} is installed")
        except ImportError:
            missing.append(package)
            print(f"ERROR: {package} is missing")

    if missing:
        print(f"\nInstall missing packages: pip install {' '.join(missing)}")
        return False

    return True

def check_python_version():
    """Check Python version compatibility"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"OK: Python {version.major}.{version.minor}.{version.micro} is compatible")
        return True
    else:
        print(f"ERROR: Python {version.major}.{version.minor}.{version.micro} is not supported. Need Python 3.8+")
        return False

def main():
    """Run all checks"""
    print("AI Multi-Agent System Configuration Check")
    print("=" * 50)

    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("Environment Configuration", check_environment),
    ]

    passed = 0
    total = len(checks)

    for name, check_func in checks:
        print(f"\n{name}:")
        if check_func():
            passed += 1

    print("\n" + "=" * 50)
    if passed == total:
        print("All checks passed! System is ready to use.")
        return 0
    else:
        print(f"{total - passed}/{total} checks failed. Please fix issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
