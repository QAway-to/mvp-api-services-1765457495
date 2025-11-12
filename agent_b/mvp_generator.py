"""
MVP Generator - creates deployable applications from templates
"""
import os
import shutil
import time
import logging
import base64
import json
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

import requests
from requests import Response, exceptions as req_exc
import asyncio
import google.generativeai as genai

from template_selector import AITemplateSelector
from config import Config
from reviewer_agent import review_project_structure

# Import shared logger
from shared_logger import logger, log_agent_action

# Configure Gemini
genai.configure(api_key=Config.GEMINI_API_KEY)

class MVPGenerator:
    """Generates MVP applications from templates"""

    def __init__(self):
        self.template_selector = AITemplateSelector()
        self.templates_dir = Path(__file__).parent / "mvp_templates"

    def _wait_for_repo_ready(self, repo_name: str, headers: Dict[str, str], branch: str = "main", timeout: int = 60) -> None:
        """Wait until GitHub branch/contents are accessible (helps Vercel pick up repo)."""
        branch_url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/branches/{branch}"
        pkg_url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/package.json"

        start = time.time()
        while time.time() - start < timeout:
            branch_resp = requests.get(branch_url, headers=headers, timeout=Config.REQUEST_TIMEOUT)
            if branch_resp.status_code == 200 and branch_resp.json().get("commit", {}).get("sha"):
                pkg_resp = requests.get(pkg_url, headers=headers, timeout=Config.REQUEST_TIMEOUT)
                if pkg_resp.status_code in (200, 404):
                    return
            time.sleep(2)

        raise RuntimeError(f"GitHub repo '{repo_name}' is not ready within {timeout}s")

    def _raise_for_status_verbose(self, resp: Response, context: str):
        """Log verbose HTTP error details before raising."""
        try:
            body_text = resp.text
        except Exception:
            body_text = "<no response text>"
        # Print to console (helps on Render logs)
        print("❌", resp.status_code, body_text)
        # Log to shared logger (UI)
        try:
            parsed = resp.json()
        except Exception:
            parsed = body_text
        log_agent_action("Agent B", f"❌ {context} failed: HTTP {resp.status_code} - {parsed}")
        resp.raise_for_status()

    async def generate_mvp(self, project_description: str) -> Dict[str, Any]:
        """Generate MVP application based on project description"""
        try:
            log_agent_action("Agent B", f"🎯 Starting MVP generation...")

            # 1. Select template using AI
            template_match = await self.template_selector.select_template(project_description)
            template_id = template_match.template_id

            # 2. Generate unique project name
            project_name = self._generate_project_name(template_id)
            # Always create a new repository per MVP run (no more single mvp-test reuse)
            repo_name = project_name

            # 3. Copy and customize template
            await self._create_project_from_template(template_id, project_name, project_description)

            # 4. Push to GitHub
            github_url = await self._push_to_github(project_name, repo_name, template_id)

            # 5. Trigger Vercel deployment
            deploy_url = await self._deploy_to_vercel(project_name, repo_name, github_url, template_id)

            log_agent_action("Agent B", f"✅ MVP created: {deploy_url}")

            return {
                "status": "success",
                "template": template_id,
                "project_name": project_name,
                "repository": repo_name,
                "github_url": github_url,
                "deploy_url": deploy_url,
                "confidence": template_match.confidence,
                "reasoning": template_match.reasoning
            }

        except req_exc.HTTPError as e:
            detail = ""
            try:
                detail = e.response.text  # type: ignore[attr-defined]
            except Exception:
                detail = str(e)
            log_agent_action("Agent B", f"❌ MVP generation failed (HTTP): {detail}")
            print("❌ HTTPError:", detail)
            raise
        except Exception as e:
            log_agent_action("Agent B", f"❌ MVP generation failed: {str(e)}")
            print("❌ Exception:", str(e))
            raise

    def _generate_project_name(self, template_id: str) -> str:
        """Generate unique project name"""
        timestamp = int(time.time())
        return f"mvp-{template_id}-{timestamp}"

    async def _create_project_from_template(self, template_id: str, project_name: str, description: str):
        """Create project directory from template"""
        log_agent_action("Agent B", f"🔧 Creating project from template: {template_id}")

        template_path = self.templates_dir / template_id
        project_path = self.templates_dir.parent / "generated" / project_name
        project_path.parent.mkdir(parents=True, exist_ok=True)

        if not template_path.exists():
            raise FileNotFoundError(f"Template {template_id} not found")

        # Check template structure (file may not exist, we'll generate it if needed)
        # Only check randomuser.js for mini-etl-pipeline template
        template_randomuser = None
        if template_id == "mini-etl-pipeline":
            template_randomuser = template_path / "src" / "lib" / "randomuser.js"
            if template_randomuser.exists():
                file_size = template_randomuser.stat().st_size
                log_agent_action("Agent B", f"✅ Template file exists: src/lib/randomuser.js ({file_size} bytes)")
            else:
                log_agent_action("Agent B", f"⚠️ Template file src/lib/randomuser.js does NOT exist in template")
                log_agent_action("Agent B", f"🤖 Will generate it via AI agents if needed after template copy")

        # Copy template
        if project_path.exists():
            shutil.rmtree(project_path)
        
        log_agent_action("Agent B", f"📋 Copying template from {template_path} to {project_path}")
        try:
            shutil.copytree(template_path, project_path, dirs_exist_ok=False)
            log_agent_action("Agent B", f"✅ Template copied successfully")
        except Exception as e:
            log_agent_action("Agent B", f"❌ Error copying template: {e}")
            import traceback
            log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
            raise

        # Verify critical files were copied - with detailed logging
        # Critical files depend on template structure
        critical_files = [
            "package.json",
            "pages/index.js",
        ]
        
        # Add template-specific critical files
        if template_id == "mini-etl-pipeline":
            critical_files.append("src/lib/randomuser.js")
            critical_files.append("next.config.js")
        elif template_id in ["email-campaign-manager", "brand-mention-monitor", "data-formatter", "price-stock-parser"]:
            # These templates may have next.config.js but it's not critical
            pass
        
        missing_files = []
        for file_rel in critical_files:
            file_path = project_path / file_rel
            if file_path.exists():
                file_size = file_path.stat().st_size
                log_agent_action("Agent B", f"✅ Verified copy: {file_rel} exists ({file_size} bytes)")
            else:
                missing_files.append(file_rel)
                log_agent_action("Agent B", f"❌ MISSING: {file_rel} not found after copy!")
        
        # Review project structure using Reviewer agent
        structure_review = review_project_structure(template_id, project_path, critical_files)
        
        if structure_review["status"] == "reject":
            missing_from_review = structure_review.get("missing_files", [])
            log_agent_action("Agent B", f"🔍 Project structure review: {structure_review['comments']}")
            
            # Generate missing critical files via AI agents
            if "src/lib/randomuser.js" in missing_from_review and template_id == "mini-etl-pipeline":
                log_agent_action("Agent B", f"🤖 Generating src/lib/randomuser.js via AI agents...")
                dest_file = project_path / "src" / "lib" / "randomuser.js"
                success = await self._generate_critical_file_via_agents(
                    dest_file, 
                    "javascript", 
                    template_id, 
                    description
                )
                if success and dest_file.exists():
                    missing_files = [f for f in missing_files if f != "src/lib/randomuser.js"]
                    log_agent_action("Agent B", f"✅✅✅ Successfully generated src/lib/randomuser.js via AI agents")
                else:
                    log_agent_action("Agent B", f"❌ Failed to generate src/lib/randomuser.js via AI agents")
        
        # If randomuser.js is still missing, try to copy from template if it exists
        if "src/lib/randomuser.js" in missing_files and template_id == "mini-etl-pipeline" and template_randomuser and template_randomuser.exists():
            log_agent_action("Agent B", f"🔧 Attempting to manually copy src/lib/randomuser.js from template")
            try:
                # Ensure destination directory exists
                dest_lib_dir = project_path / "src" / "lib"
                dest_lib_dir.mkdir(parents=True, exist_ok=True)
                log_agent_action("Agent B", f"✅ Created directory: {dest_lib_dir}")
                
                # Copy the file explicitly
                dest_file = dest_lib_dir / "randomuser.js"
                shutil.copy2(template_randomuser, dest_file)
                
                if dest_file.exists():
                    file_size = dest_file.stat().st_size
                    log_agent_action("Agent B", f"✅✅✅ MANUALLY COPIED: src/lib/randomuser.js ({file_size} bytes)")
                    missing_files.remove("src/lib/randomuser.js")
                else:
                    log_agent_action("Agent B", f"❌ Failed to manually copy src/lib/randomuser.js")
            except Exception as e:
                log_agent_action("Agent B", f"❌ Error manually copying src/lib/randomuser.js: {e}")
                import traceback
                log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
        
        if missing_files:
            # List all files in src/lib directory for debugging
            lib_dir = project_path / "src" / "lib"
            if lib_dir.exists():
                lib_files = list(lib_dir.iterdir())
                log_agent_action("Agent B", f"📋 Files in src/lib: {[f.name for f in lib_files]}")
            else:
                log_agent_action("Agent B", f"❌ src/lib directory does not exist!")
            
            # List all files in project for debugging
            all_files = list(project_path.rglob('*'))
            file_count = len([f for f in all_files if f.is_file()])
            log_agent_action("Agent B", f"📋 Total files in project: {file_count}")
            
            raise FileNotFoundError(f"Critical files missing after copy: {', '.join(missing_files)}")
        else:
            log_agent_action("Agent B", f"✅ All critical files copied successfully")

        # Customize project
        await self._customize_project(project_path, project_name, description)

        # Verify critical files still exist after customization (template-specific)
        if template_id == "mini-etl-pipeline":
            randomuser_file = project_path / "src" / "lib" / "randomuser.js"
            if randomuser_file.exists():
                file_size = randomuser_file.stat().st_size
                log_agent_action("Agent B", f"✅ Verified: randomuser.js still exists after customization ({file_size} bytes)")
            else:
                log_agent_action("Agent B", f"❌❌❌ CRITICAL: randomuser.js was deleted during customization!")
                raise FileNotFoundError("randomuser.js was deleted during customization")

        log_agent_action("Agent B", f"✅ Project created at: {project_path}")

    async def _generate_critical_file_via_agents(
        self, 
        file_path: Path, 
        file_type: str, 
        template_id: str, 
        project_description: str
    ) -> bool:
        """Generate critical file using Architect-Coder-Reviewer architecture"""
        try:
            log_agent_action("Agent B", f"🤖 Generating critical file via AI agents: {file_path.name}")
            
            # Define file specifications based on template and file type
            if template_id == "mini-etl-pipeline" and file_path.name == "randomuser.js":
                file_spec = {
                    "path": str(file_path.relative_to(file_path.parent.parent.parent)),
                    "purpose": "Random User API data loader for ETL pipeline",
                    "requirements": """
                    - Export async function loadUsers(withMeta = false) that fetches from RANDOMUSER_API_URL env var
                    - Export function buildMetrics(users) that calculates ETL metrics
                    - Export function fallbackUsers() that returns 50 mock user objects
                    - Use fetch API for HTTP requests
                    - Handle errors gracefully with fallback data
                    - Return data structure: {users, fallbackUsed, sourceUrl, fetchedAt} when withMeta=true
                    - User object structure: {id: {value}, name: {first, last}, email, phone, location: {country, city}, registered: {date}, picture: {thumbnail}}
                    - Environment variable: process.env.RANDOMUSER_API_URL (default: 'https://randomuser.me/api/?results=500')
                    """
                }
            else:
                log_agent_action("Agent B", f"⚠️ Unknown critical file type: {file_path.name}")
                return False
            
            # Generate code using Gemini (Coder)
            coder = genai.GenerativeModel(Config.GEMINI_MODEL)
            
            prompt = f"""
You are a senior JavaScript developer. Generate a complete, production-ready JavaScript/ES6 module.

File: {file_spec['path']}
Purpose: {file_spec['purpose']}
Project Context: {project_description[:500]}

Requirements:
{file_spec['requirements']}

Additional requirements:
- Use ES6 module syntax (export async function, export function)
- Use async/await for asynchronous operations
- Include proper error handling with try/catch
- Provide fallback data if API fails
- Code should be clean, readable, and well-structured
- No comments or explanations, only code
- Output ONLY valid JavaScript code (no markdown, no code blocks)

Generate the complete code for this file:
"""
            
            log_agent_action("Agent B", f"🔧 Generating code for {file_path.name}...")
            response = coder.generate_content(prompt)
            
            if not response or not response.text:
                log_agent_action("Agent B", f"❌ Empty response from AI for {file_path.name}")
                return False
            
            # Clean response (remove markdown code blocks if present)
            code = response.text.strip()
            if code.startswith("```"):
                # Remove markdown code blocks
                lines = code.split('\n')
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].strip() == "```":
                    lines = lines[:-1]
                code = '\n'.join(lines)
            
            # Review the generated code (Reviewer)
            log_agent_action("Agent B", f"🔍 Reviewing generated code for {file_path.name}...")
            reviewer = genai.GenerativeModel(Config.GEMINI_MODEL)
            
            review_prompt = f"""
You are a strict code reviewer. Review this JavaScript code for the file {file_spec['path']}.

Requirements to check:
1. Code must export the required functions: loadUsers, buildMetrics, fallbackUsers
2. Code must handle errors gracefully
3. Code must use environment variables correctly
4. Code must return correct data structures
5. Code must be valid JavaScript/ES6 syntax
6. Code must not have syntax errors
7. Code must handle edge cases (empty arrays, null values, etc.)

Respond ONLY with valid JSON:
{{
  "status": "approve",
  "comments": []
}}

or

{{
  "status": "reject",
  "comments": ["issue1", "issue2"]
}}

Code to review:
{code}
"""
            
            review_response = reviewer.generate_content(review_prompt)
            if review_response and review_response.text:
                try:
                    review_result = json.loads(review_response.text.strip())
                    if review_result.get("status") != "approve":
                        log_agent_action("Agent B", f"⚠️ Code rejected: {review_result.get('comments', [])}")
                        # Try to fix based on feedback
                        if review_result.get("comments"):
                            feedback_text = "\n".join(review_result["comments"])
                            fix_prompt = f"""
The previous code was rejected. Fix the following issues:

{feedback_text}

Original code:
{code}

Generate the fixed code (ONLY code, no markdown):
"""
                            fix_response = coder.generate_content(fix_prompt)
                            if fix_response and fix_response.text:
                                code = fix_response.text.strip()
                                if code.startswith("```"):
                                    lines = code.split('\n')
                                    if lines[0].startswith("```"):
                                        lines = lines[1:]
                                    if lines[-1].strip() == "```":
                                        lines = lines[:-1]
                                    code = '\n'.join(lines)
                                log_agent_action("Agent B", f"✅ Code fixed based on reviewer feedback")
                except Exception as e:
                    log_agent_action("Agent B", f"⚠️ Could not parse review result: {e}")
            
            # Ensure directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write the file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(code)
            
            if file_path.exists():
                file_size = file_path.stat().st_size
                log_agent_action("Agent B", f"✅✅✅ Generated {file_path.name} via AI agents ({file_size} bytes)")
                return True
            else:
                log_agent_action("Agent B", f"❌ Failed to create {file_path.name}")
                return False
                
        except Exception as e:
            log_agent_action("Agent B", f"❌ Error generating {file_path.name} via agents: {e}")
            import traceback
            log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
            return False

    async def _customize_project(self, project_path: Path, project_name: str, description: str):
        """Customize project files with project-specific data"""
        log_agent_action("Agent B", "🎨 Customizing project files...")

        # Customize package.json
        package_json = project_path / "package.json"
        if package_json.exists():
            with open(package_json, 'r', encoding='utf-8') as f:
                data = json.load(f)

            data["name"] = project_name
            data["description"] = f"MVP for: {description[:100]}..."

            with open(package_json, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        # Customize README
        readme = project_path / "README.md"
        if readme.exists():
            with open(readme, 'r', encoding='utf-8') as f:
                content = f.read()

            content = content.replace("AI-generated MVP", f"MVP for: {description[:100]}...")

            with open(readme, 'w', encoding='utf-8') as f:
                f.write(content)

        # Add project description to mock data
        mock_data_dir = project_path / "mock-data"
        if mock_data_dir.exists():
            for mock_file in mock_data_dir.glob("*.js"):
                with open(mock_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Add project description as comment
                content = f"// Project: {description[:200]}...\n{content}"

                with open(mock_file, 'w', encoding='utf-8') as f:
                    f.write(content)

        log_agent_action("Agent B", "✅ Project customization completed")

    async def _push_to_github(self, project_name: str, repo_name: str, template_id: str) -> str:
        """Push project to GitHub (supports reusable or per-project repositories)"""
        if not Config.GITHUB_USER or not Config.GITHUB_TOKEN:
            raise RuntimeError("GitHub credentials are not configured")

        project_path = self.templates_dir.parent / "generated" / project_name

        if not project_path.exists():
            raise FileNotFoundError(f"Generated project folder not found: {project_path}")

        await asyncio.to_thread(self._sync_repository, repo_name, project_path, project_name, template_id)

        github_url = f"https://github.com/{Config.GITHUB_USER}/{repo_name}"
        return github_url

    async def _deploy_to_vercel(self, project_name: str, repo_name: str, github_url: str, template_id: str) -> str:
        """Deploy to Vercel via REST API project creation."""
        if not Config.VERCEL_TOKEN:
            return f"https://{project_name}.vercel.app"

        # Ensure project linked with GitHub repo
        project_info = await asyncio.to_thread(self._ensure_vercel_project, project_name, repo_name)
        await asyncio.to_thread(self._configure_vercel_envs, project_name, project_info, template_id)
        # Give Vercel a short moment to pick up freshly linked GitHub repo
        await asyncio.sleep(2)
        # Trigger deployment and wait until ready
        deploy_url = await asyncio.to_thread(self._create_vercel_deployment, project_name, repo_name)
        return deploy_url

    def _sync_repository(self, repo_name: str, project_path: Path, project_name: str, template_id: str) -> None:
        """Synchronize generated project with GitHub repository."""
        headers = {
            "Authorization": f"Bearer {Config.GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
        }

        repo_info = self._ensure_repository(repo_name, headers)
        branch = repo_info.get("default_branch", "main")

        if Config.AGENT_B_TEST_MODE:
            log_agent_action("Agent B", f"🧹 Clearing previous contents of {repo_name} ({branch})")
            self._clear_repository(repo_name, headers, branch)

        log_agent_action("Agent B", f"📤 Uploading {project_path} to {repo_name}")
        self._upload_directory(repo_name, project_path, headers, branch, project_name, template_id)
        # Ensure GitHub returns latest commits/contents before Vercel deploy
        self._wait_for_repo_ready(repo_name, headers, branch)

    def _ensure_repository(self, repo_name: str, headers: Dict[str, str]) -> Dict[str, Any]:
        """Ensure repository exists. Create if needed (only in non-test mode)."""
        repo_url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}"
        response = requests.get(repo_url, headers=headers, timeout=Config.REQUEST_TIMEOUT)

        if response.status_code == 200:
            return response.json()

        log_agent_action("Agent B", f"📦 Repository {repo_name} not found. Creating...")
        create_payload = {
            "name": repo_name,
            "auto_init": True,
            # Public repo ensures Vercel (free tier) can pull and build without extra scopes
            "private": False,
            "description": "Auto-generated by Agent B"
        }
        create_resp = requests.post(
            "https://api.github.com/user/repos",
            headers=headers,
            json=create_payload,
            timeout=Config.REQUEST_TIMEOUT,
        )
        if create_resp.status_code == 422:
            # Repository may exist under different visibility settings
            log_agent_action("Agent B", f"⚠️ Repository {repo_name} already exists but could not be fetched; continuing")
            return {"name": repo_name, "default_branch": "main"}
        create_resp.raise_for_status()
        return create_resp.json()

    def _clear_repository(self, repo_name: str, headers: Dict[str, str], branch: str, path: str = "") -> None:
        contents = self._list_contents(repo_name, headers, branch, path)
        if not contents:
            return

        for item in contents:
            item_path = item["path"]
            if item["type"] == "dir":
                self._clear_repository(repo_name, headers, branch, item_path)
            elif item["type"] == "file":
                delete_url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{item_path}"
                delete_resp = requests.delete(
                    delete_url,
                    headers=headers,
                    json={"message": "Cleanup previous MVP", "sha": item["sha"], "branch": branch},
                    timeout=Config.REQUEST_TIMEOUT,
                )
                delete_resp.raise_for_status()

    def _upload_directory(
        self,
        repo_name: str,
        project_path: Path,
        headers: Dict[str, str],
        branch: str,
        project_name: str,
        template_id: str,
    ) -> None:
        uploaded_count = 0
        skipped_count = 0
        error_count = 0
        critical_files_to_upload = []
        
        # First pass: collect all files and identify critical ones
        all_files = []
        for file_path in project_path.rglob('*'):
            if file_path.is_dir():
                continue

            parts = file_path.relative_to(project_path).parts
            if parts and parts[0] in {'.git', '.next', 'node_modules', '__pycache__', '.venv'}:
                skipped_count += 1
                continue

            if file_path.is_file():
                relative_path = file_path.relative_to(project_path).as_posix()
                
                # Skip binary files
                if file_path.suffix in {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'}:
                    skipped_count += 1
                    continue
                
                all_files.append((file_path, relative_path))
                
                # Track critical files
                if 'randomuser.js' in relative_path:
                    critical_files_to_upload.append(relative_path)
                    file_size = file_path.stat().st_size
                    log_agent_action("Agent B", f"🎯 CRITICAL FILE FOUND: {relative_path} ({file_size} bytes) - will upload")
        
        log_agent_action("Agent B", f"📋 Total files to upload: {len(all_files)} (including {len(critical_files_to_upload)} critical)")
        
        # Upload all files
        for file_path, relative_path in all_files:
            try:
                url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{relative_path}"

                # Check if file exists in GitHub
                existing = requests.get(url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
                sha = None
                if existing.status_code == 200:
                    try:
                        sha = existing.json().get("sha")
                    except:
                        pass

                # Read file content
                try:
                    content_bytes = file_path.read_bytes()
                    if 'randomuser.js' in relative_path:
                        log_agent_action("Agent B", f"📖 Reading {relative_path}: {len(content_bytes)} bytes")
                except Exception as e:
                    log_agent_action("Agent B", f"⚠️ Failed to read {relative_path}: {e}")
                    error_count += 1
                    continue
                
                # Encode to base64
                try:
                    encoded = base64.b64encode(content_bytes).decode('utf-8')
                    if 'randomuser.js' in relative_path:
                        log_agent_action("Agent B", f"🔐 Encoded {relative_path}: {len(encoded)} chars")
                except Exception as e:
                    log_agent_action("Agent B", f"⚠️ Failed to encode {relative_path}: {e}")
                    error_count += 1
                    continue

                # Prepare upload data
                data = {
                    "message": f"Update MVP files from {project_name}",
                    "content": encoded,
                    "branch": branch,
                }
                if sha:
                    data["sha"] = sha

                # Upload file
                put_resp = requests.put(url, headers=headers, json=data, timeout=Config.REQUEST_TIMEOUT)
                
                if put_resp.status_code >= 400:
                    if 'randomuser.js' in relative_path:
                        log_agent_action("Agent B", f"❌ FAILED to upload {relative_path}: {put_resp.status_code}")
                        try:
                            error_detail = put_resp.json()
                            log_agent_action("Agent B", f"❌ Error detail: {error_detail}")
                        except:
                            log_agent_action("Agent B", f"❌ Error text: {put_resp.text[:500]}")
                    self._raise_for_status_verbose(put_resp, f"Upload {relative_path}")
                else:
                    uploaded_count += 1
                    if 'randomuser.js' in relative_path:
                        log_agent_action("Agent B", f"✅✅✅ SUCCESS: Uploaded {relative_path} to GitHub (status: {put_resp.status_code})")
                        # Verify immediately
                        verify_resp = requests.get(url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
                        if verify_resp.status_code == 200:
                            log_agent_action("Agent B", f"✅✅✅ VERIFIED: {relative_path} exists in GitHub after upload")
                        else:
                            log_agent_action("Agent B", f"⚠️⚠️⚠️ WARNING: {relative_path} NOT verified after upload (status: {verify_resp.status_code})")
                    elif 'package.json' in relative_path or 'index.js' in relative_path or 'next.config.js' in relative_path:
                        log_agent_action("Agent B", f"✅ Uploaded critical file: {relative_path}")
                    
                    if uploaded_count % 10 == 0:
                        log_agent_action("Agent B", f"📤 Uploaded {uploaded_count} files...")
                        
            except Exception as e:
                if 'randomuser.js' in relative_path:
                    log_agent_action("Agent B", f"❌❌❌ EXCEPTION uploading {relative_path}: {e}")
                    import traceback
                    log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
                else:
                    log_agent_action("Agent B", f"❌ Error uploading {relative_path}: {e}")
                error_count += 1
                continue
        
        log_agent_action("Agent B", f"✅ Upload complete: {uploaded_count} files uploaded, {skipped_count} skipped, {error_count} errors")
        
        # Wait a moment for GitHub to process
        import time
        time.sleep(2)
        
        # Verify critical files were uploaded to GitHub with retries
        # Critical files depend on template
        critical_files_to_verify = ["pages/index.js", "package.json"]
        if template_id == "mini-etl-pipeline":
            critical_files_to_verify.extend(["src/lib/randomuser.js", "next.config.js"])
        
        critical_uploaded = []
        for file_rel in critical_files_to_verify:
            check_url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{file_rel}"
            
            # Retry up to 3 times
            found = False
            for attempt in range(3):
                check_resp = requests.get(check_url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
                if check_resp.status_code == 200:
                    found = True
                    critical_uploaded.append(file_rel)
                    try:
                        file_info = check_resp.json()
                        file_size = file_info.get("size", 0)
                        log_agent_action("Agent B", f"✅✅✅ VERIFIED {file_rel} exists in GitHub (size: {file_size} bytes, attempt {attempt+1})")
                    except:
                        log_agent_action("Agent B", f"✅✅✅ VERIFIED {file_rel} exists in GitHub (attempt {attempt+1})")
                    break
                else:
                    if attempt < 2:
                        time.sleep(1)
                    else:
                        log_agent_action("Agent B", f"❌❌❌ FAILED to verify {file_rel} in GitHub (status: {check_resp.status_code} after 3 attempts)")
                        try:
                            error_detail = check_resp.json()
                            log_agent_action("Agent B", f"❌ Error detail: {error_detail}")
                        except:
                            log_agent_action("Agent B", f"❌ Error text: {check_resp.text[:200]}")
        
        if len(critical_uploaded) < 4:
            error_msg = f"Critical files missing in GitHub repository. Only {len(critical_uploaded)}/4 files found: {critical_uploaded}"
            log_agent_action("Agent B", f"❌❌❌ {error_msg}")
            raise RuntimeError(error_msg)
        else:
            log_agent_action("Agent B", f"✅✅✅ All {len(critical_uploaded)}/4 critical files verified in GitHub repository")

    def _list_contents(self, repo_name: str, headers: Dict[str, str], branch: str, path: str = "") -> Optional[List[Dict[str, Any]]]:
        url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{path}"
        resp = requests.get(url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        return resp.json()

    def _vercel_headers_params(self) -> Tuple[Dict[str, str], Dict[str, str]]:
        headers = {
            "Authorization": f"Bearer {Config.VERCEL_TOKEN}",
            "Content-Type": "application/json",
        }
        params: Dict[str, str] = {}
        if Config.VERCEL_TEAM_ID:
            params["teamId"] = Config.VERCEL_TEAM_ID
        return headers, params

    def _ensure_vercel_project(self, project_name: str, repo_name: str) -> Dict[str, Any]:
        """Create Vercel project if needed and return project metadata."""
        headers, params = self._vercel_headers_params()

        project_payload = {
            "name": project_name,
            "gitRepository": {
                "type": "github",
                "repo": f"{Config.GITHUB_USER}/{repo_name}"
            }
        }

        create_resp = requests.post(
            "https://api.vercel.com/v9/projects",
            headers=headers,
            params=params,
            json=project_payload,
            timeout=Config.REQUEST_TIMEOUT,
        )

        if create_resp.status_code == 409:
            log_agent_action("Agent B", f"ℹ️ Vercel project {project_name} already exists. Fetching metadata...")
            return self._get_vercel_project(project_name, headers, params)

        if create_resp.status_code >= 400:
            self._raise_for_status_verbose(create_resp, "Vercel create project")
        log_agent_action("Agent B", f"✅ Vercel project {project_name} created")
        return create_resp.json()

    def _get_vercel_project(self, project_name: str, headers: Dict[str, str], params: Dict[str, str]) -> Dict[str, Any]:
        resp = requests.get(
            f"https://api.vercel.com/v9/projects/{project_name}",
            headers=headers,
            params=params,
            timeout=Config.REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()

    def _create_vercel_deployment(self, project_name: str, repo_name: str) -> str:
        headers, params = self._vercel_headers_params()
        payload = {
            "name": project_name,
            "project": project_name,
            "target": "production",
            "source": "git",
            "gitSource": {
                "type": "github",
                "org": Config.GITHUB_USER,
                "repo": repo_name,
                "ref": "main"
            }
        }

        create = requests.post(
            "https://api.vercel.com/v13/deployments",
            headers=headers,
            params=params,
            json=payload,
            timeout=Config.REQUEST_TIMEOUT,
        )
        if create.status_code >= 400:
            self._raise_for_status_verbose(create, "Vercel create deployment")
        deployment = create.json()
        deployment_id = deployment["id"]

        # Poll status until deployment ready
        for _ in range(60):
            status_resp = requests.get(
                f"https://api.vercel.com/v13/deployments/{deployment_id}",
                headers=headers,
                params=params,
                timeout=Config.REQUEST_TIMEOUT,
            )
            if status_resp.status_code >= 400:
                self._raise_for_status_verbose(status_resp, "Vercel deployment status")
            status_data = status_resp.json()
            state = status_data.get("readyState")
            if state in {"READY", "FROZEN"}:
                url = status_data.get("url") or deployment.get("url")
                if url and not url.startswith("http"):
                    url = f"https://{url}"
                return url or f"https://{project_name}.vercel.app"
            if state in {"ERROR", "CANCELED"}:
                # Emit full status for diagnostics
                try:
                    print("❌", state, json.dumps(status_data, ensure_ascii=False))
                except Exception:
                    print("❌", state, "<unable to dump status>")
                log_agent_action("Agent B", f"❌ Vercel deployment failed: {state} - {status_data}")
                raise RuntimeError(f"Vercel deployment failed: {state}")
            time.sleep(3)

        return f"https://{project_name}.vercel.app"

    def _extract_vercel_domain(self, project_info: Dict[str, Any], project_name: str) -> str:
        link = project_info.get("link", {}) if isinstance(project_info, dict) else {}
        url = link.get("url") or link.get("domain")

        if not url:
            aliases = project_info.get("alias", []) if isinstance(project_info, dict) else []
            if isinstance(aliases, list) and aliases:
                url = aliases[0]

        if not url:
            url = f"{project_name}.vercel.app"

        if not url.startswith("http"):
            url = f"https://{url}"

        return url

    def _configure_vercel_envs(self, project_name: str, project_info: Dict[str, Any], template_id: str) -> None:
        """Configure template-specific environment variables on Vercel."""
        if not Config.VERCEL_TOKEN:
            return

        if template_id != "mini-etl-pipeline":
            return

        project_id = project_info.get("id") or project_info.get("projectId") or project_name
        if not project_id:
            log_agent_action("Agent B", f"⚠️ Unable to determine Vercel project id for {project_name}, skipping env configuration")
            return

        randomuser_url = Config.RANDOMUSER_API_URL
        if not randomuser_url:
            log_agent_action("Agent B", "ℹ️ RANDOMUSER_API_URL not set in environment; skipping Vercel env injection")
            return

        try:
            self._set_vercel_env_var(project_id, "RANDOMUSER_API_URL", randomuser_url)
            log_agent_action("Agent B", f"🔐 Vercel env configured for {project_name} (RANDOMUSER_API_URL)")
        except Exception as error:
            log_agent_action("Agent B", f"❌ Failed to configure Vercel env vars: {error}")

    def _set_vercel_env_var(self, project_id: str, key: str, value: str) -> None:
        """Create or update a Vercel environment variable (encrypted)."""
        headers, params = self._vercel_headers_params()
        base_url = f"https://api.vercel.com/v9/projects/{project_id}/env"
        payload = {
            "key": key,
            "value": value,
            "type": "encrypted",
            "target": ["production", "preview"]
        }

        resp = requests.post(
            base_url,
            headers=headers,
            params=params,
            json=payload,
            timeout=Config.REQUEST_TIMEOUT,
        )

        if resp.status_code == 409:
            # Environment variable exists — delete and recreate
            list_resp = requests.get(
                base_url,
                headers=headers,
                params=params,
                timeout=Config.REQUEST_TIMEOUT,
            )
            list_resp.raise_for_status()
            envs = list_resp.json().get("envs", [])
            for env in envs:
                if env.get("key") == key:
                    env_id = env.get("id")
                    if not env_id:
                        continue
                    delete_resp = requests.delete(
                        f"{base_url}/{env_id}",
                        headers=headers,
                        params=params,
                        timeout=Config.REQUEST_TIMEOUT,
                    )
                    delete_resp.raise_for_status()
            # Retry create
            resp = requests.post(
                base_url,
                headers=headers,
                params=params,
                json=payload,
                timeout=Config.REQUEST_TIMEOUT,
            )

        if resp.status_code >= 400:
            self._raise_for_status_verbose(resp, "Vercel set env var")
