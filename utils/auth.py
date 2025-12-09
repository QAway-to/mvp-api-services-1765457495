"""
Simple authentication system with two user types
Uses cookies for session management
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import Request, Response
from fastapi.responses import JSONResponse

# User credentials
USERS = {
    "sadovsky": {
        "password": "ghp_523442wM35234",
        "role": "admin",  # Full access
        "name": "Admin"
    },
    "user": {
        "password": "12345",
        "role": "user",  # Limited access
        "name": "User"
    }
}

# In-memory session storage (in production, use Redis or database)
sessions: Dict[str, Dict] = {}


def generate_session_id() -> str:
    """Generate a secure session ID"""
    return secrets.token_urlsafe(32)


def create_session(username: str, role: str) -> str:
    """Create a new session and return session ID"""
    session_id = generate_session_id()
    sessions[session_id] = {
        "username": username,
        "role": role,
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(days=7)  # 7 days session
    }
    return session_id


def get_session(session_id: Optional[str]) -> Optional[Dict]:
    """Get session data by session ID"""
    if not session_id:
        return None
    
    session = sessions.get(session_id)
    if not session:
        return None
    
    # Check if session expired
    if datetime.now() > session["expires_at"]:
        del sessions[session_id]
        return None
    
    return session


def authenticate(username: str, password: str) -> Optional[Dict]:
    """Authenticate user and return user info"""
    user = USERS.get(username)
    if not user:
        return None
    
    if user["password"] != password:
        return None
    
    return {
        "username": username,
        "role": user["role"],
        "name": user["name"]
    }


def get_user_from_request(request: Request) -> Optional[Dict]:
    """Get current user from request cookies"""
    session_id = request.cookies.get("session_id")
    if not session_id:
        return None
    
    session = get_session(session_id)
    if not session:
        return None
    
    return {
        "username": session["username"],
        "role": session["role"]
    }


def is_admin(user: Optional[Dict]) -> bool:
    """Check if user is admin"""
    return user and user.get("role") == "admin"


def set_session_cookie(response: Response, session_id: str):
    """Set session cookie in response"""
    response.set_cookie(
        key="session_id",
        value=session_id,
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )


def clear_session_cookie(response: Response):
    """Clear session cookie"""
    response.delete_cookie(key="session_id")

