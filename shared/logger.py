"""
Unified logging system for AI Multi-Agent MVP System
"""
import logging
import asyncio
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
import os

# Global log queue for real-time streaming
log_queue: asyncio.Queue = asyncio.Queue()

# Log storage for cross-agent communication
log_storage: List[Dict[str, Any]] = []
MAX_LOG_STORAGE = 1000

class AgentLogFormatter(logging.Formatter):
    """Custom formatter for agent logs"""

    def format(self, record):
        # Add agent info if available
        if hasattr(record, 'agent'):
            record.agent_name = getattr(record, 'agent', 'Unknown')
        else:
            record.agent_name = 'System'

        # Format timestamp
        record.timestamp = datetime.fromtimestamp(record.created).isoformat()

        return super().format(record)

def setup_logging(
    level: str = "INFO",
    log_file: str = "ai_agent.log",
    enable_queue: bool = True
) -> logging.Logger:
    """Setup unified logging system"""

    # Clear existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Set log level
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    root_logger.setLevel(numeric_level)

    # Create formatter
    formatter = AgentLogFormatter(
        '%(timestamp)s | %(agent_name)s | %(levelname)s | %(message)s'
    )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(numeric_level)
    root_logger.addHandler(console_handler)

    # File handler
    if log_file:
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setFormatter(formatter)
        file_handler.setLevel(numeric_level)
        root_logger.addHandler(file_handler)

    # Create main logger
    logger = logging.getLogger('ai_agents')
    logger.setLevel(numeric_level)

    return logger

def log_agent_action(agent: str, message: str, level: str = "INFO", **kwargs):
    """Log action with agent context"""
    logger = logging.getLogger('ai_agents')

    # Create log record with agent info
    extra = {'agent': agent}
    extra.update(kwargs)

    # Log to standard logger
    log_method = getattr(logger, level.lower(), logger.info)
    log_method(message, extra=extra)

    # Add to queue for real-time streaming (if available)
    try:
        if log_queue and not log_queue._closed:
            log_data = {
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "message": message,
                "module": agent,
                **kwargs
            }

            # Try to add to queue (non-blocking)
            try:
                log_queue.put_nowait(log_data)
            except asyncio.QueueFull:
                pass  # Skip if queue is full

            # Add to storage
            log_storage.append(log_data)
            if len(log_storage) > MAX_LOG_STORAGE:
                log_storage.pop(0)

    except Exception:
        pass  # Ignore queue errors

def get_recent_logs(limit: int = 100) -> List[Dict[str, Any]]:
    """Get recent logs from storage"""
    return log_storage[-limit:] if log_storage else []

def clear_log_storage():
    """Clear log storage"""
    global log_storage
    log_storage.clear()

def export_logs(filepath: str, format: str = "json"):
    """Export logs to file"""
    if format.lower() == "json":
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(log_storage, f, ensure_ascii=False, indent=2)
    else:
        # Plain text format
        with open(filepath, 'w', encoding='utf-8') as f:
            for log in log_storage:
                f.write(f"{log['timestamp']} | {log.get('module', 'Unknown')} | {log['level']} | {log['message']}\n")

# Global logger instance
logger = setup_logging()
