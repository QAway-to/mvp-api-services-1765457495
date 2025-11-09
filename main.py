"""
Main entry point for AI Multi-Agent MVP Generation System
Routes to Agent A (main application) by default
"""

import os
import sys
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Add agent directories to Python path
agent_a_dir = current_dir / "agent_a"
agent_b_dir = current_dir / "agent_b"
sys.path.insert(0, str(agent_a_dir))
sys.path.insert(0, str(agent_b_dir))

try:
    # Import and run Agent A application
    from agent_a.main import app

    # Override the app title for unified system
    app.title = "AI Multi-Agent MVP Generation System"
    app.description = "Unified system for freelance project search and MVP generation"

    print("🚀 Starting AI Multi-Agent MVP Generation System")
    print("📍 Agent A (Freelance Search) is active")
    print("🤖 Agent B (MVP Generation) integrated via API")

except ImportError as e:
    print(f"❌ Error importing Agent A: {e}")
    print("Make sure agent_a directory exists and contains main.py")
    sys.exit(1)

if __name__ == "__main__":
    # For local development
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable reload for development
        log_level="info"
    )