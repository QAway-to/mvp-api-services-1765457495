"""
Lightweight SQLite-based project deduplicator for Agent A
Stores seen projects in a session to prevent duplicate notifications
"""

import sqlite3
import os
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path


class ProjectDeduplicator:
    """Lightweight SQLite-based deduplicator for projects"""
    
    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize deduplicator with SQLite database
        
        Args:
            db_path: Path to SQLite database file. If None, uses default location.
        """
        if db_path is None:
            # Use default location in project root
            project_root = Path(__file__).parent.parent
            db_path = str(project_root / "data" / "seen_projects.db")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.db_path = db_path
        self.conn = None
        self._init_db()
    
    def _init_db(self):
        """Initialize database schema"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS seen_projects (
                id TEXT PRIMARY KEY,
                url TEXT UNIQUE NOT NULL,
                title TEXT,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                seen_count INTEGER DEFAULT 1
            )
        """)
        
        # Create index on URL for faster lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_url ON seen_projects(url)
        """)
        
        self.conn.commit()
    
    def is_seen(self, project_id: str, url: Optional[str] = None) -> bool:
        """
        Check if project has been seen before
        
        Args:
            project_id: Unique project identifier
            url: Project URL (optional, used as fallback)
            
        Returns:
            True if project was seen before, False otherwise
        """
        cursor = self.conn.cursor()
        
        # Try by ID first
        cursor.execute("SELECT id FROM seen_projects WHERE id = ?", (project_id,))
        if cursor.fetchone():
            return True
        
        # Try by URL if provided
        if url:
            cursor.execute("SELECT id FROM seen_projects WHERE url = ?", (url,))
            if cursor.fetchone():
                return True
        
        return False
    
    def mark_seen(self, project_id: str, url: str, title: Optional[str] = None):
        """
        Mark project as seen
        
        Args:
            project_id: Unique project identifier
            url: Project URL
            title: Project title (optional)
        """
        cursor = self.conn.cursor()
        
        # Check if already exists
        cursor.execute("SELECT seen_count FROM seen_projects WHERE id = ? OR url = ?", 
                      (project_id, url))
        row = cursor.fetchone()
        
        if row:
            # Update existing record
            cursor.execute("""
                UPDATE seen_projects 
                SET last_seen = CURRENT_TIMESTAMP, 
                    seen_count = seen_count + 1,
                    title = COALESCE(?, title)
                WHERE id = ? OR url = ?
            """, (title, project_id, url))
        else:
            # Insert new record
            cursor.execute("""
                INSERT INTO seen_projects (id, url, title, first_seen, last_seen, seen_count)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
            """, (project_id, url, title))
        
        self.conn.commit()
    
    def clear_session(self):
        """Clear all seen projects (for new session)"""
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM seen_projects")
        self.conn.commit()
    
    def cleanup_old(self, days: int = 7):
        """
        Remove projects older than specified days
        
        Args:
            days: Number of days to keep projects
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            DELETE FROM seen_projects 
            WHERE last_seen < datetime('now', '-' || ? || ' days')
        """, (days,))
        self.conn.commit()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get deduplicator statistics"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM seen_projects")
        total = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as recent FROM seen_projects WHERE last_seen > datetime('now', '-1 day')")
        recent = cursor.fetchone()['recent']
        
        return {
            "total_seen": total,
            "recent_24h": recent
        }
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

