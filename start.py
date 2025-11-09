#!/usr/bin/env python3
"""
Unified startup script for AI Multi-Agent MVP System
"""
import os
import sys
import argparse
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import selenium
        import google.generativeai
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Run: pip install -r requirements.txt")
        return False

def check_config():
    """Check if configuration is valid"""
    try:
        from shared.config import config

        issues = config.validate_all()
        if issues:
            print("❌ Configuration issues:")
            for issue in issues:
                print(f"  - {issue}")
            print("Please check your .env file")
            return False

        print("✅ Configuration is valid")
        return True
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

def start_agent_a(port: int = 8000):
    """Start Agent A (Freelance Search)"""
    print("🚀 Starting Agent A (Freelance Search)...")
    os.chdir("agent_a")

    cmd = [sys.executable, "main.py"]
    if port != 8000:
        # Note: This would need modification of main.py to accept port argument
        pass

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n⏹️ Agent A stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Agent A failed to start: {e}")

def start_agent_b():
    """Start Agent B (MVP Generation)"""
    print("🎨 Starting Agent B (MVP Generation)...")
    os.chdir("agent_b")

    cmd = [sys.executable, "main.py"]

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n⏹️ Agent B stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Agent B failed to start: {e}")

def start_both():
    """Start both agents (requires running in background)"""
    print("🚀 Starting both agents...")

    # This would require more complex process management
    # For now, just show instructions
    print("For development, run agents separately:")
    print("Terminal 1: python start.py --agent-a")
    print("Terminal 2: python start.py --agent-b")

def main():
    parser = argparse.ArgumentParser(description="AI Multi-Agent MVP System")
    parser.add_argument("--agent-a", action="store_true", help="Start Agent A only")
    parser.add_argument("--agent-b", action="store_true", help="Start Agent B only")
    parser.add_argument("--both", action="store_true", help="Start both agents")
    parser.add_argument("--check", action="store_true", help="Check requirements and config")
    parser.add_argument("--port", type=int, default=8000, help="Port for Agent A (default: 8000)")

    args = parser.parse_args()

    print("🤖 AI Multi-Agent MVP Generation System")
    print("=" * 50)

    # Change to project root
    os.chdir(Path(__file__).parent)

    # Check requirements and config
    if not check_requirements():
        return 1

    if not check_config():
        return 1

    # Handle different startup modes
    if args.check:
        print("✅ All checks passed!")
        return 0

    elif args.agent_a:
        start_agent_a(args.port)

    elif args.agent_b:
        start_agent_b()

    elif args.both:
        start_both()

    else:
        print("Usage:")
        print("  python start.py --agent-a    # Start Agent A (Freelance Search)")
        print("  python start.py --agent-b    # Start Agent B (MVP Generation)")
        print("  python start.py --check      # Check requirements and config")
        print()
        print("For development, run agents in separate terminals:")
        print("Terminal 1: python start.py --agent-a")
        print("Terminal 2: python start.py --agent-b")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
