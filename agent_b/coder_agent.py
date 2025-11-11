import logging
from typing import Dict, Any, Optional, Union, List

import google.generativeai as genai
from config import Config

# Configure logging
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=Config.GEMINI_API_KEY)


def generate_code(module_info: Dict[str, Any], project_context: str, review_feedback: Optional[Union[List, Dict, str]] = None) -> str:
    """Generate code for a module with optional review feedback"""
    try:
        coder = genai.GenerativeModel(Config.GEMINI_MODEL)
        path = module_info.get('path', 'unknown.py')
        purpose = module_info.get('purpose', 'General module')

        logger.info(f"🔧 Generating code for {path}")

        # Prepare feedback text
        feedback_text = prepare_feedback_text(review_feedback)

        # Truncate context if too long
        truncated_context = truncate_text(project_context, Config.MAX_PROMPT_LENGTH // 2)
        truncated_feedback = truncate_text(feedback_text, Config.MAX_PROMPT_LENGTH // 4)

        prompt = build_code_generation_prompt(path, purpose, truncated_context, truncated_feedback)

        # Generate with retries
        for attempt in range(Config.MAX_RETRIES):
            try:
                response = coder.generate_content(prompt)
                if not response or not response.text:
                    raise ValueError("Empty response from Gemini")

                code = clean_code_response(response.text)

                # Validate code length
                if len(code) > Config.MAX_CODE_LENGTH:
                    logger.warning(f"⚠️ Code for {path} too long ({len(code)} chars), truncating...")
                    code = code[:Config.MAX_CODE_LENGTH] + "\n# Code truncated due to length limit"

                # Basic syntax check
                if not is_basic_syntax_valid(code):
                    logger.warning(f"⚠️ Generated code for {path} may have syntax issues")

                logger.info(f"✅ Successfully generated code for {path} ({len(code)} chars)")
                return code

            except Exception as e:
                logger.warning(f"⚠️ Attempt {attempt + 1} failed for {path}: {e}")
                if attempt == Config.MAX_RETRIES - 1:
                    raise

        raise Exception(f"Failed to generate code after {Config.MAX_RETRIES} attempts")

    except Exception as e:
        error_msg = f"# Generation failed for {module_info.get('path', 'unknown.py')}\n# Error: {str(e)}"
        logger.error(f"❌ Error generating {module_info.get('path', 'unknown.py')}: {e}")
        return error_msg

def prepare_feedback_text(review_feedback: Optional[Union[List, Dict, str]]) -> str:
    """Prepare feedback text for inclusion in prompt"""
    if not review_feedback:
        return ""

    if isinstance(review_feedback, list):
        return "\n".join(str(x) for x in review_feedback)
    elif isinstance(review_feedback, dict):
        return "\n".join(str(v) for v in review_feedback.values())
    elif isinstance(review_feedback, str):
        return review_feedback.strip()

    return str(review_feedback)

def truncate_text(text: str, max_length: int) -> str:
    """Truncate text to maximum length"""
    if len(text) <= max_length:
        return text

    truncated = text[:max_length - 3] + "..."
    logger.debug(f"Text truncated from {len(text)} to {len(truncated)} characters")
    return truncated

def build_code_generation_prompt(path: str, purpose: str, context: str, feedback: str) -> str:
    """Build the code generation prompt"""
    feedback_section = f"Incorporate reviewer feedback:\n{feedback}\n\n" if feedback else ""

    return f"""
You are a senior Python developer specializing in clean, maintainable code.

File: {path}
Purpose: {purpose}
Project Context: {context}

{feedback_section}Requirements:
- Output only valid Python code (no markdown, no explanations)
- Follow PEP8 standards and clean architecture principles
- Use type hints where appropriate
- Include docstrings for functions and classes
- Handle errors gracefully
- Keep the code focused and modular
- Limit to ~100 lines maximum

Generate the complete code for this module:
"""

def clean_code_response(response_text: str) -> str:
    """Clean and extract code from AI response"""
    code = response_text.strip()

    # Remove markdown code blocks
    if code.startswith("```"):
        parts = code.split("```")
        if len(parts) >= 2:
            code = parts[1]
            # Remove language identifier if present
            if code.lstrip().startswith(("python", "py")):
                code = code.split("\n", 1)[1] if "\n" in code else ""

    return code.strip()

def is_basic_syntax_valid(code: str) -> bool:
    """Perform basic syntax validation"""
    try:
        compile(code, '<string>', 'exec')
        return True
    except SyntaxError:
        return False
