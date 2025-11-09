import json
import logging
from typing import Dict, Any

import google.generativeai as genai
from shared.config import config

# Configure logging
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=config.GEMINI_API_KEY)


def review_code(file_name: str, code: str) -> Dict[str, Any]:
    """Review code for quality and correctness"""
    try:
        logger.info(f"🔍 Reviewing {file_name}")

        # Validate input
        if not code or not code.strip():
            return {"status": "reject", "comments": ["Empty or invalid code provided"]}

        reviewer = genai.GenerativeModel(config.GEMINI_MODEL)

        # Truncate code if too long for review
        review_code = code[:config.MAX_CODE_LENGTH] if len(code) > config.MAX_CODE_LENGTH else code

        prompt = build_review_prompt(file_name, review_code)

        # Review with retries
        for attempt in range(config.MAX_RETRIES):
            try:
                response = reviewer.generate_content(prompt)
                if not response or not response.text:
                    raise ValueError("Empty response from reviewer")

                review_result = parse_review_response(response.text)

                # Validate review result
                if validate_review_result(review_result):
                    logger.info(f"✅ Review completed for {file_name}: {review_result['status']}")
                    return review_result
                else:
                    logger.warning(f"⚠️ Invalid review format for {file_name}, attempt {attempt + 1}")

            except Exception as e:
                logger.warning(f"⚠️ Review attempt {attempt + 1} failed for {file_name}: {e}")
                if attempt == config.MAX_RETRIES - 1:
                    break

        # Fallback review result
        logger.error(f"❌ All review attempts failed for {file_name}")
        return {"status": "reject", "comments": ["Review system failed - manual review required"]}

    except Exception as e:
        logger.error(f"❌ Critical error reviewing {file_name}: {e}")
        return {"status": "reject", "comments": [f"Critical review error: {str(e)}"]}

def build_review_prompt(file_name: str, code: str) -> str:
    """Build the code review prompt"""
    return f"""
You are a strict senior Python code reviewer. Review the following code for quality, correctness, and best practices.

File: {file_name}

Respond ONLY with valid JSON in this exact format:
{{
  "status": "approve",
  "comments": []
}}

or

{{
  "status": "reject",
  "comments": ["issue1", "issue2", "etc"]
}}

Guidelines:
- "approve" only if code is production-ready with no major issues
- "reject" if there are bugs, security issues, poor practices, or incomplete implementation
- Comments should be specific, actionable, and concise
- Focus on: syntax errors, logic errors, security vulnerabilities, performance issues, code style, documentation

Code to review:
{code}
"""

def parse_review_response(response_text: str) -> Dict[str, Any]:
    """Parse and clean review response"""
    text = response_text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse review JSON: {e}")
        # Try to extract JSON from mixed content
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Fallback
        return {"status": "reject", "comments": ["Invalid JSON response from reviewer"]}

def validate_review_result(result: Dict[str, Any]) -> bool:
    """Validate review result format"""
    if not isinstance(result, dict):
        return False

    if "status" not in result or result["status"] not in ["approve", "reject"]:
        return False

    if "comments" not in result or not isinstance(result["comments"], list):
        return False

    return True
