import time
import json
import base64
import requests
import google.generativeai as genai
import re
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

from config import Config
from coder_agent import generate_code
from reviewer_agent import review_code

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=Config.GEMINI_API_KEY)

@dataclass
class ModuleResult:
    """Result of module processing"""
    path: str
    code: str
    status: str
    feedback: Optional[Dict] = None
    error: Optional[str] = None


# ---------- GitHub ----------
def create_repo(repo_name: str) -> Dict[str, Any]:
    """Create a new GitHub repository"""
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"Bearer {Config.GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }
    data = {"name": repo_name, "private": True, "auto_init": True}

    try:
        r = requests.post(url, headers=headers, json=data, timeout=Config.REQUEST_TIMEOUT)
        r.raise_for_status()
        repo_data = r.json()
        logger.info(f"📦 Репозиторий создан: {repo_data['html_url']}")
        return repo_data
    except requests.RequestException as e:
        logger.error(f"❌ Ошибка создания репозитория: {e}")
        raise Exception(f"GitHub repository creation failed: {e}")


def push_to_github(repo_name: str, file_path: str, content: str, commit_msg: str) -> bool:
    """Publish file or update existing file on GitHub"""
    if file_path.endswith("/"):
        logger.info(f"📂 Пропущен пуш директории {file_path}")
        return True

    url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{file_path}"
    headers = {
        "Authorization": f"Bearer {Config.GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }

    try:
        # Check if file exists
        sha = None
        check = requests.get(url, headers=headers, timeout=Config.REQUEST_TIMEOUT)
        if check.status_code == 200:
            sha = check.json().get("sha")

        # Prepare data
        data = {
            "message": commit_msg,
            "content": base64.b64encode(content.encode('utf-8')).decode(),
        }
        if sha:
            data["sha"] = sha

        # Upload/update file
        r = requests.put(url, headers=headers, json=data, timeout=Config.REQUEST_TIMEOUT)
        r.raise_for_status()

        action = "обновлён" if sha else "создан новый файл"
        logger.info(f"🚀 {file_path} пушнут в GitHub ({action})")
        return True

    except requests.RequestException as e:
        logger.error(f"⚠️ Ошибка пуша {file_path}: {e}")
        return False


# ---------- Module Processing ----------
def process_module(module: Dict[str, Any], project_context: str, max_retries: int = 3) -> ModuleResult:
    """Process a single module: generate -> review -> fix if needed"""
    path = module['path']
    logger.info(f"→ Генерация {path} ...")

    try:
        # Generate code
        code = generate_code(module, project_context)
        if not code or code.startswith("# Generation failed"):
            return ModuleResult(path=path, code="", status="failed", error="Code generation failed")

        # Review code
        feedback = review_code(path, code)

        # If approved, return result
        if feedback["status"] == "approve":
            return ModuleResult(path=path, code=code, status="approved", feedback=feedback)

        # If rejected, try to fix with feedback
        logger.warning(f"⚠️ {path} rejected, trying to fix...")
        refined_code = generate_code(module, project_context, feedback["comments"])
        if refined_code and not refined_code.startswith("# Generation failed"):
            return ModuleResult(path=path, code=refined_code, status="fixed", feedback=feedback)
        else:
            return ModuleResult(path=path, code=code, status="failed_fix", feedback=feedback, error="Fix failed")

    except Exception as e:
        logger.error(f"❌ Error processing {path}: {e}")
        return ModuleResult(path=path, code="", status="error", error=str(e))

def process_modules_parallel(modules: List[Dict[str, Any]], project_context: str) -> List[ModuleResult]:
    """Process multiple modules in parallel"""
    results = []

    with ThreadPoolExecutor(max_workers=min(len(modules), 5)) as executor:
        # Submit all tasks
        future_to_module = {
            executor.submit(process_module, module, project_context): module
            for module in modules
        }

        # Collect results as they complete
        for future in as_completed(future_to_module):
            result = future.result()
            results.append(result)

    return results

# ---------- Архитектор ----------
def run_architect(project_description: str) -> None:
    """Main orchestrator for project generation"""
    logger.info("🤖 Starting AI Multi-Agent Project Generation")
    logger.info(f"📝 Project description: {project_description[:100]}...")

    try:
        # Generate project architecture
        architect = genai.GenerativeModel(Config.GEMINI_MODEL)
        structure = generate_project_structure(architect, project_description)

        logger.info(f"🏗️ Проект: {structure['project_type']}")
        repo_name = f"ai-multiagent-{int(time.time())}"
        repo = create_repo(repo_name)

        # Process phases
        for phase in structure["phases"]:
            logger.info(f"\n=== ⚙️ Фаза {phase['phase']}: {phase['goal']} ===")

            # Process modules in parallel
            if phase["modules"]:
                logger.info(f"🔄 Processing {len(phase['modules'])} modules in parallel...")
                results = process_modules_parallel(phase["modules"], project_description)

                # Push successful modules to GitHub
                successful_pushes = 0
                for result in results:
                    if result.status in ["approved", "fixed"] and result.code:
                        success = push_to_github(repo_name, result.path, result.code,
                                               f"Add {result.path} ({result.status})")
                        if success:
                            successful_pushes += 1
                    else:
                        logger.warning(f"⚠️ Skipping {result.path}: {result.error or 'No code generated'}")

                logger.info(f"✅ Successfully pushed {successful_pushes}/{len(results)} modules")

            # Create phase documentation
            phase_doc = generate_phase_documentation(phase)
            push_to_github(repo_name, f"docs/phase_{phase['phase']}.md", phase_doc,
                          f"Add phase {phase['phase']} summary")

        # Generate README
        readme_content = generate_readme(architect, structure)
        push_to_github(repo_name, "README.md", readme_content, "Add README.md")

        logger.info("🎉 Проект опубликован!")
        logger.info(f"🔗 {repo['html_url']}")

    except Exception as e:
        logger.error(f"❌ Critical error in project generation: {e}")
        raise

def generate_project_structure(architect, project_description: str) -> Dict[str, Any]:
    """Generate project structure using AI"""
    logger.info("🧩 Генерация архитектуры проекта...")

    # Load UI guidelines if available
    ui_guidelines = ""
    try:
        guidelines_path = Path(__file__).parent / "ui_design_guidelines.md"
        if guidelines_path.exists():
            ui_guidelines = f"\n\nUI Design Guidelines (for UI components):\n{guidelines_path.read_text(encoding='utf-8')[:2000]}...\n\nWhen designing UI components, ensure they follow these ergonomic principles.\n"
    except Exception:
        pass

    plan_prompt = f"""
    You are a senior software architect.
    Design a modular Python project based on this description:
    "{project_description}"
    {ui_guidelines}
    Return JSON only with this structure:
    {{
      "project_type": "Python application",
      "phases": [
        {{
          "phase": 1,
          "goal": "Define base structure",
          "modules": [
            {{"path": "main.py", "purpose": "entry point"}},
            {{"path": "config.py", "purpose": "configuration"}}
          ]
        }}
      ]
    }}

    Keep modules limited (max 8 per phase) and focused on core functionality.
    For UI components (React/Next.js), ensure compact, information-dense layouts with minimal empty spaces.
    """

    for attempt in range(Config.MAX_RETRIES):
        try:
            response = architect.generate_content(plan_prompt)
            text = clean_json_response(response.text or "")

            structure = json.loads(text)
            validate_project_structure(structure)
            return structure

        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"⚠️ Attempt {attempt + 1} failed: {e}")
            if attempt == Config.MAX_RETRIES - 1:
                raise Exception(f"Failed to generate valid project structure after {Config.MAX_RETRIES} attempts")

    raise Exception("Unexpected error in structure generation")

def clean_json_response(text: str) -> str:
    """Clean and extract JSON from AI response"""
    text = text.replace("```json", "").replace("```", "").strip()
    # Remove markdown and model hints
    text = re.sub(r'^[^{\[]*', '', text)  # Trim before first '{' or '['
    text = re.sub(r'[^}\]]*$', '', text)  # Trim after last '}' or ']'
    # Remove comments and fix trailing commas
    text = re.sub(r'//.*', '', text)
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    return text

def validate_project_structure(structure: Dict[str, Any]) -> None:
    """Validate generated project structure"""
    if not isinstance(structure, dict):
        raise ValueError("Structure must be a dictionary")

    required_keys = ["project_type", "phases"]
    for key in required_keys:
        if key not in structure:
            raise ValueError(f"Missing required key: {key}")

    if not isinstance(structure["phases"], list):
        raise ValueError("Phases must be a list")

    for phase in structure["phases"]:
        if not isinstance(phase, dict) or "modules" not in phase:
            raise ValueError("Each phase must have modules")
        if not isinstance(phase["modules"], list):
            raise ValueError("Modules must be a list")

def generate_phase_documentation(phase: Dict[str, Any]) -> str:
    """Generate documentation for a phase"""
    return f"""## Phase {phase['phase']}: {phase['goal']}

### Goal
{phase['goal']}

### Modules
{chr(10).join(f"- **{m['path']}**: {m['purpose']}" for m in phase['modules'])}

### Status
✅ Completed
"""

def generate_readme(architect, structure: Dict[str, Any]) -> str:
    """Generate README.md for the project"""
    readme_prompt = f"""
    Write a professional README.md for this AI-generated project:

    Project Structure:
    {json.dumps(structure, indent=2)}

    Include:
    - Project title and description
    - Architecture overview
    - Key modules and their purposes
    - Setup/installation instructions
    - Usage examples
    - Generated by AI Multi-Agent System

    Keep it concise and professional.
    """

    response = architect.generate_content(readme_prompt)
    return response.text.replace("```markdown", "").replace("```", "").strip()
