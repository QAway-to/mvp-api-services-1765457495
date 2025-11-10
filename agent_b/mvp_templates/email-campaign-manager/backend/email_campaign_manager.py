"""
Demo backend script for the Email Campaign Manager MVP.

Uses SendGrid for sending emails and IMAP for monitoring replies.
This version works with mock data and logs to SQLite for the demo UI.
"""
import asyncio
import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict

import sendgrid
from sendgrid.helpers.mail import Mail, Attachment
import imaplib
import email


class EmailCampaignManager:
    def __init__(self):
        self.email_service = self._init_email_service()
        self.db = sqlite3.connect("email_campaigns.db")
        self._init_db()
        self.templates = self._load_templates()
        self.rotation_counter = 0

    def _init_email_service(self):
        api_key = os.getenv("SENDGRID_API_KEY", "SG_DEMO_KEY")
        return sendgrid.SendGridAPIClient(api_key)

    def _init_db(self):
        cursor = self.db.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS email_sends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT,
                template_used TEXT,
                sent_at TIMESTAMP,
                rotation_counter INTEGER
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS incoming_replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_email TEXT,
                subject TEXT,
                received_at TIMESTAMP,
                content_preview TEXT
            )
            """
        )
        self.db.commit()

    def _load_templates(self) -> Dict:
        path = os.path.join(os.path.dirname(__file__), "email_templates.json")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _read_contacts(self, contacts_file: str) -> List[Dict]:
        contacts_path = os.path.join(os.path.dirname(__file__), contacts_file)
        with open(contacts_path, "r", encoding="utf-8") as f:
            rows = [row.strip().split(",") for row in f.readlines()[1:]]
        contacts = []
        for row in rows:
            email_address = row[0]
            name = row[1] if len(row) > 1 else ""
            contacts.append({"email": email_address, "name": name})
        return contacts

    async def send_campaign_emails(
        self,
        contacts_file: str,
        attach_files: bool = True,
        auto_reply_enabled: bool = False,
    ):
        contacts = self._read_contacts(contacts_file)
        for contact in contacts:
            template = self._get_rotated_template()
            await self._send_email(
                to_email=contact["email"],
                subject=template["subject"],
                body=template["body"].replace("{{ name }}", contact.get("name", "")),
                attachments=[],
            )
            self._log_send(contact, template)
            self.rotation_counter += 1
            await asyncio.sleep(0.1)

    async def _send_email(
        self, to_email: str, subject: str, body: str, attachments: List[str] = None
    ):
        attachments = attachments or []
        from_email = os.getenv("FROM_EMAIL", "demo@campaigns.dev")
        mail = Mail(from_email, to_email, subject, html_content=body)
        for attachment_path in attachments:
            with open(attachment_path, "rb") as f:
                attachment = Attachment(
                    file_content=f.read(), file_name=os.path.basename(attachment_path)
                )
                mail.add_attachment(attachment)
        # In demo mode we skip actual sending
        if os.getenv("DEMO_MODE", "true").lower() == "true":
            return 202
        response = self.email_service.send(mail)
        return response.status_code

    def _get_rotated_template(self) -> Dict:
        rotation_rules = [5, 10, 15, 20]
        for rule in rotation_rules:
            if self.rotation_counter % rule == 0:
                template_key = f"template_{rule}"
                if template_key in self.templates:
                    return self.templates[template_key]
        return self.templates.get("default", {})

    async def monitor_replies(self, email_account: str, password: str):
        while True:
            try:
                mail = imaplib.IMAP4_SSL(os.getenv("IMAP_SERVER", "imap.gmail.com"))
                mail.login(email_account, password)
                mail.select("inbox")
                status, messages = mail.search(None, "UNSEEN")
                for msg_id in messages[0].split():
                    status, msg_data = mail.fetch(msg_id, "(RFC822)")
                    email_body = msg_data[0][1]
                    email_message = email.message_from_bytes(email_body)
                    if self._is_reply_to_our_campaign(email_message):
                        await self._send_auto_reply(email_message["From"])
                        self._log_incoming_reply(email_message)
                mail.close()
                mail.logout()
            except Exception as e:
                print(f"Error monitoring emails: {e}")
            await asyncio.sleep(300)

    def _is_reply_to_our_campaign(self, email_message) -> bool:
        subject = email_message.get("Subject", "").lower()
        return "spring" in subject or "campaign" in subject

    async def _send_auto_reply(self, to_email: str):
        reply_body = (
            "Спасибо за ответ! Мы уже увидели ваше сообщение и скоро ответим."
        )
        await self._send_email(
            to_email=to_email,
            subject="Спасибо, что ответили",
            body=reply_body,
            attachments=[],
        )

    def _log_send(self, contact: Dict, template: Dict):
        cursor = self.db.cursor()
        cursor.execute(
            """
            INSERT INTO email_sends (email, template_used, sent_at, rotation_counter)
            VALUES (?, ?, ?, ?)
            """,
            (
                contact["email"],
                template.get("name"),
                datetime.now(),
                self.rotation_counter,
            ),
        )
        self.db.commit()

    def _log_incoming_reply(self, email_message):
        cursor = self.db.cursor()
        cursor.execute(
            """
            INSERT INTO incoming_replies
            (from_email, subject, received_at, content_preview)
            VALUES (?, ?, ?, ?)
            """,
            (
                email_message["From"],
                email_message["Subject"],
                datetime.now(),
                email_message.get_payload()[:200],
            ),
        )
        self.db.commit()


async def main():
    manager = EmailCampaignManager()
    await manager.send_campaign_emails(
        contacts_file="contacts.csv",
        attach_files=False,
        auto_reply_enabled=True,
    )
    # Run monitor in background (demo mode: stop after first iteration)
    if os.getenv("DEMO_MODE", "true").lower() != "true":
        await manager.monitor_replies(
            email_account=os.getenv("IMAP_EMAIL"),
            password=os.getenv("IMAP_PASSWORD"),
        )


if __name__ == "__main__":
    asyncio.run(main())

