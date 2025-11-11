import json
import logging
from typing import Dict, Any

import google.generativeai as genai
from config import Config

# Configure logging
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=Config.GEMINI_API_KEY)


def review_code(file_name: str, code: str) -> Dict[str, Any]:
    """Review code for quality and correctness"""
    try:
        logger.info(f"🔍 Reviewing {file_name}")

        # Validate input
        if not code or not code.strip():
            return {"status": "reject", "comments": ["Empty or invalid code provided"]}

        reviewer = genai.GenerativeModel(Config.GEMINI_MODEL)

        # Truncate code if too long for review
        review_code = code[:Config.MAX_CODE_LENGTH] if len(code) > Config.MAX_CODE_LENGTH else code

        prompt = build_review_prompt(file_name, review_code)

        # Review with retries
        for attempt in range(Config.MAX_RETRIES):
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
                if attempt == Config.MAX_RETRIES - 1:
                    break

        # Fallback review result
        logger.error(f"❌ All review attempts failed for {file_name}")
        return {"status": "reject", "comments": ["Review system failed - manual review required"]}

    except Exception as e:
        logger.error(f"❌ Critical error reviewing {file_name}: {e}")
        return {"status": "reject", "comments": [f"Critical review error: {str(e)}"]}

def build_review_prompt(file_name: str, code: str) -> str:
    """Build the code review prompt"""
    is_ui_file = any(ext in file_name.lower() for ext in ['.js', '.jsx', '.tsx', '.html', '.css'])
    is_nextjs_file = 'pages' in file_name.lower() or 'components' in file_name.lower() or file_name.endswith(('.js', '.jsx', '.tsx'))
    
    ui_guidelines = ""
    nextjs_issues = ""
    
    if is_ui_file:
        ui_guidelines = """
UI/UX STRUCTURE REQUIREMENTS (CRITICAL):
- Navigation: ALL pages MUST have a navigation bar/panel with at least "Back" and "Home" links
- Button consistency: ALL buttons MUST have fixed dimensions (minWidth, minHeight, or fixed width/height in styles)
- Layout: Use grid/flexbox layouts to minimize empty spaces (padding 16-20px, not 24-32px)
- Responsive: Mobile-first approach with responsive breakpoints
- Interactive elements: All buttons/links MUST have hover states and visual feedback
- Empty states: Handle empty data gracefully with informative messages
- Loading states: Show loading indicators for async operations
- Error handling: Display user-friendly error messages
- Accessibility: Use semantic HTML, proper ARIA labels where needed
"""
    
    if is_nextjs_file:
        nextjs_issues = """
NEXT.JS / REACT CRITICAL ISSUES (MUST CHECK - Known production bugs):

1. REACT ERROR #31 - Invalid Component Type (CRITICAL):
   - ALWAYS verify imports/exports match: default export requires default import, named export requires named import
   - Check that imported components are actually functions/components, not objects or undefined
   - Example: If file exports "export const MyComponent = ...", import MUST be "import { MyComponent } from ..."
   - Example: If file exports "export default MyComponent", import MUST be "import MyComponent from ..."
   - REJECT if: import MyComponent from './file' but file has named export, or vice versa
   - REJECT if: component is undefined or an object when used in JSX

2. GETSERVER SIDEPROPS / SERVER-SIDE RENDERING (CRITICAL):
   - getServerSideProps MUST always return valid props object with all required fields
   - ALL props from getServerSideProps MUST have safe defaults (use || [] for arrays, || {} for objects, || '' for strings)
   - Component MUST handle undefined/null props gracefully with default values in useState initialization
   - Example: useState(initialUsers || []) not useState(initialUsers)
   - REJECT if: props used without null/undefined checks
   - REJECT if: getServerSideProps doesn't have try/catch with fallback return

3. FETCH IN SERVER CONTEXT (CRITICAL):
   - In getServerSideProps, fetch() may not be available in all Node.js versions
   - MUST use try/catch around fetch calls
   - MUST provide fallback data if fetch fails
   - Consider using node-fetch or checking typeof fetch !== 'undefined'
   - REJECT if: fetch used without error handling in getServerSideProps

4. JSON IMPORTS (CRITICAL):
   - JSON imports MUST use default import: import data from './file.json'
   - MUST check if imported JSON exists and has expected structure
   - REJECT if: JSON imported incorrectly or used without existence checks

5. ARRAY/OBJECT SAFETY (CRITICAL):
   - ALWAYS use Array.isArray() before calling .map(), .slice(), .filter() on data
   - ALWAYS check object existence before accessing nested properties (use optional chaining ?.)
   - Example: users?.length, user?.name?.first, Array.isArray(users) && users.map(...)
   - REJECT if: array methods called on potentially undefined/null values
   - REJECT if: nested property access without optional chaining or existence checks

6. STATE INITIALIZATION (CRITICAL):
   - useState MUST initialize with safe defaults: useState(prop || defaultValue)
   - NEVER use useState(undefined) or useState(null) without fallback
   - Example: useState(initialUsers || []), useState(initialMetrics || {})
   - REJECT if: state initialized with potentially undefined props without defaults
"""
    
    return f"""
You are a strict senior code reviewer. Review the following code for quality, correctness, and best practices.

File: {file_name}
{ui_guidelines}
{nextjs_issues}
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
- "reject" if there are bugs, security issues, poor practices, incomplete implementation, UI structure violations, or Next.js/React critical issues
- Comments should be specific, actionable, and concise
- Focus on: syntax errors, logic errors, security vulnerabilities, performance issues, code style, documentation
{("- UI structure violations (missing navigation, inconsistent button sizes, poor layout)" if is_ui_file else "")}
{("- Next.js/React critical issues (import/export mismatches, unsafe props, server-side rendering problems)" if is_nextjs_file else "")}

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
