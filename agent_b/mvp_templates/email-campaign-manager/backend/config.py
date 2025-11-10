import os

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "SG_DEMO_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "demo@campaigns.dev")
IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.gmail.com")
IMAP_EMAIL = os.getenv("IMAP_EMAIL", "demo@campaigns.dev")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD", "app_password")
LOG_DB_PATH = os.getenv("LOG_DB_PATH", "email_campaigns.db")

