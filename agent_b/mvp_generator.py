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

from template_selector import AITemplateSelector
from config import Config

# Import shared logger
from shared_logger import logger, log_agent_action

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

    def _safe_json_parse(self, resp: Response, default=None):
        """Safely parse JSON response, return default if not JSON."""
        try:
            content_type = resp.headers.get('content-type', '').lower()
            if 'application/json' in content_type:
                return resp.json()
            # Try to parse anyway
            return resp.json()
        except (ValueError, TypeError):
            # Not JSON - return default or text preview
            if default is not None:
                return default
            try:
                text = resp.text[:200]  # Limit length
                return {"error": "Not JSON", "preview": text}
            except Exception:
                return {"error": "Failed to parse response"}

    def _raise_for_status_verbose(self, resp: Response, context: str):
        """Log verbose HTTP error details before raising."""
        try:
            body_text = resp.text
        except Exception:
            body_text = "<no response text>"
        # Print to console (helps on Render logs)
        print("❌", resp.status_code, body_text[:200])
        # Log to shared logger (UI)
        parsed = self._safe_json_parse(resp, default=body_text[:500])
        log_agent_action("Agent B", f"❌ {context} failed: HTTP {resp.status_code} - {parsed}")
        resp.raise_for_status()

    async def generate_mvp(self, project_description: str, template_id: str = None) -> Dict[str, Any]:
        """Generate MVP application based on project description and template_id"""
        try:
            log_agent_action("Agent B", f"🎯 Starting MVP generation...")

            # 1. Use provided template_id or select using AI (fallback)
            template_match = None
            if template_id:
                template_id = template_id.strip().lower()
                log_agent_action("Agent B", f"📋 Using provided template: {template_id}")
            else:
                # Fallback to AI selection if no template provided
                template_match = await self.template_selector.select_template(project_description)
                template_id = template_match.template_id
                log_agent_action("Agent B", f"🤖 AI selected template: {template_id}")

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
                "confidence": template_match.confidence if template_match else 1.0,
                "reasoning": template_match.reasoning if template_match else "Template selected manually by user"
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
        # Validate and sanitize template_id to prevent state leakage
        template_id = template_id.strip().lower()
        valid_templates = [
            "mini-etl-pipeline", "web-scraper", "brand-mention-monitor", "data-formatter",
            "email-campaign-manager", "price-stock-parser", "news-parser",
            "analytics-dashboard", "telegram-shop-bot", "api-services", "freelance-project-search"
        ]
        if template_id not in valid_templates:
            raise ValueError(f"Invalid template_id: {template_id}. Must be one of: {valid_templates}")
        
        log_agent_action("Agent B", f"🔧 Creating project from template: {template_id} (validated)")

        template_path = self.templates_dir / template_id
        project_path = self.templates_dir.parent / "generated" / project_name
        project_path.parent.mkdir(parents=True, exist_ok=True)

        if not template_path.exists():
            raise FileNotFoundError(f"Template {template_id} not found")

        # Verify template files exist BEFORE copying (template-specific)
        template_lib_file = None
        lib_file_name = None
        if template_id == "mini-etl-pipeline":
            template_lib_file = template_path / "src" / "lib" / "spacex.js"
            lib_file_name = "spacex.js"
        elif template_id == "web-scraper":
            template_lib_file = template_path / "src" / "lib" / "scraper_core.js"
            lib_file_name = "scraper_core.js"
        else:
            # For other templates, check if they have lib files
            template_lib = template_path / "src" / "lib"
            if template_lib.exists():
                lib_files = list(template_lib.glob("*.js"))
                if lib_files:
                    template_lib_file = lib_files[0]
                    lib_file_name = template_lib_file.name
        
        # Only check for mini-etl-pipeline (required), web-scraper will be handled during copy
        if template_id == "mini-etl-pipeline":
            if template_lib_file and template_lib_file.exists():
                file_size = template_lib_file.stat().st_size
                log_agent_action("Agent B", f"✅ Template file exists: src/lib/{lib_file_name} ({file_size} bytes)")
            else:
                log_agent_action("Agent B", f"❌❌❌ CRITICAL: Template file src/lib/spacex.js does NOT exist in template!")
                raise FileNotFoundError(f"Template file src/lib/spacex.js does not exist in template {template_id}. This file is required for mini-etl-pipeline.")
        elif template_id == "web-scraper" and template_lib_file and template_lib_file.exists():
            # Just log that file exists, don't fail if it doesn't - will be handled during copy
            file_size = template_lib_file.stat().st_size
            log_agent_action("Agent B", f"✅ Template file exists: src/lib/{lib_file_name} ({file_size} bytes)")

        # Copy template - ALWAYS remove existing directory first to prevent file contamination
        if project_path.exists():
            log_agent_action("Agent B", f"🧹 Removing existing project directory: {project_path}")
            shutil.rmtree(project_path)
            # Verify removal
            if project_path.exists():
                raise RuntimeError(f"Failed to remove existing project directory: {project_path}")
            log_agent_action("Agent B", f"✅ Existing directory removed successfully")
        
        # Special handling for api-services: copy adapters directory BEFORE main copytree
        # This ensures files are copied even if they're in .gitignore
        if template_id == "api-services":
            adapters_src = template_path / "src" / "lib" / "adapters"
            if adapters_src.exists():
                log_agent_action("Agent B", f"🔧 Pre-copying adapters directory for api-services from {adapters_src}")
                # List all files to ensure they exist
                wayback_dir = adapters_src / "wayback"
                if wayback_dir.exists():
                    wayback_files = list(wayback_dir.glob("*.js"))
                    log_agent_action("Agent B", f"🔍 Found wayback files: {[f.name for f in wayback_files]}")
        
        log_agent_action("Agent B", f"📋 Copying template from {template_path} to {project_path}")
        try:
            shutil.copytree(template_path, project_path, dirs_exist_ok=False)
            log_agent_action("Agent B", f"✅ Template copied successfully")
        except Exception as e:
            log_agent_action("Agent B", f"❌ Error copying template: {e}")
            import traceback
            log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
            raise

        # Immediately after copy, ensure src/lib files are copied for templates that need them
        # This is a proactive approach - copy before verification
        
        # Special handling for api-services: ensure adapters directory is copied
        if template_id == "api-services":
            adapters_src = template_path / "src" / "lib" / "adapters"
            adapters_dest = project_path / "src" / "lib" / "adapters"
            
            if adapters_src.exists():
                log_agent_action("Agent B", f"🔧 Post-verifying adapters directory for api-services")
                # Check if adapters were copied
                if not adapters_dest.exists():
                    log_agent_action("Agent B", f"⚠️ Adapters directory not found after copytree, copying now...")
                    try:
                        adapters_dest.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copytree(adapters_src, adapters_dest)
                        log_agent_action("Agent B", f"✅✅✅ Successfully copied adapters directory after copytree")
                    except Exception as e:
                        log_agent_action("Agent B", f"❌❌❌ CRITICAL: Error copying adapters directory: {e}")
                        import traceback
                        log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
                        raise
                
                # Verify critical adapter files
                wayback_index = adapters_dest / "wayback" / "index.js"
                wayback_client = adapters_dest / "wayback" / "waybackClient.js"
                if wayback_index.exists() and wayback_client.exists():
                    log_agent_action("Agent B", f"✅✅✅ Verified Wayback adapter files exist: {wayback_index.exists()}, {wayback_client.exists()}")
                    log_agent_action("Agent B", f"🔍 Wayback index size: {wayback_index.stat().st_size if wayback_index.exists() else 0} bytes")
                    log_agent_action("Agent B", f"🔍 Wayback client size: {wayback_client.stat().st_size if wayback_client.exists() else 0} bytes")
                else:
                    log_agent_action("Agent B", f"❌❌❌ CRITICAL: Adapter files missing! index: {wayback_index.exists()}, client: {wayback_client.exists()}")
                    # List what's actually in the directory
                    if adapters_dest.exists():
                        all_files = list(adapters_dest.rglob("*"))
                        log_agent_action("Agent B", f"🔍 Files in adapters dir: {[str(f.relative_to(adapters_dest)) for f in all_files if f.is_file()]}")
                    raise FileNotFoundError(f"Wayback adapter files not found after copy. Index exists: {wayback_index.exists()}, Client exists: {wayback_client.exists()}")
            else:
                log_agent_action("Agent B", f"❌❌❌ CRITICAL: Adapters source directory does not exist: {adapters_src}")
                raise FileNotFoundError(f"Adapters source directory does not exist: {adapters_src}")
        
        if template_id in ["web-scraper", "brand-mention-monitor", "data-formatter"]:
            lib_files_map = {
                "web-scraper": "scraper_core.js",
                "brand-mention-monitor": "news.js",
                "data-formatter": "quotes.js",
            }
            lib_file_name = lib_files_map.get(template_id)
            if lib_file_name:
                template_lib_file = template_path / "src" / "lib" / lib_file_name
                dest_lib_dir = project_path / "src" / "lib"
                dest_file = dest_lib_dir / lib_file_name
                
                # Check if template file exists FIRST - with detailed logging
                log_agent_action("Agent B", f"🔍 Checking template file: {template_lib_file}")
                log_agent_action("Agent B", f"🔍 Template path exists: {template_path.exists()}")
                log_agent_action("Agent B", f"🔍 Template lib file exists: {template_lib_file.exists()}")
                log_agent_action("Agent B", f"🔍 Template lib file path: {template_lib_file.absolute()}")
                
                if not template_lib_file.exists():
                    # List all files in src/lib to debug
                    lib_dir = template_path / "src" / "lib"
                    if lib_dir.exists():
                        lib_files = list(lib_dir.glob("*"))
                        log_agent_action("Agent B", f"🔍 Files in template src/lib: {[f.name for f in lib_files]}")
                    else:
                        log_agent_action("Agent B", f"🔍 Template src/lib directory does NOT exist!")
                    
                    log_agent_action("Agent B", f"❌❌❌ CRITICAL: Template file {template_lib_file} does NOT exist in template!")
                    raise FileNotFoundError(f"Template file src/lib/{lib_file_name} does not exist in template {template_id}")
                
                log_agent_action("Agent B", f"🔍 Checking {lib_file_name} after copytree...")
                log_agent_action("Agent B", f"🔍 Dest file exists: {dest_file.exists()}")
                log_agent_action("Agent B", f"🔍 Dest dir exists: {dest_lib_dir.exists()}")
                
                # ALWAYS copy the file, even if it exists (to ensure it's there)
                log_agent_action("Agent B", f"🔧 Copying {lib_file_name} to {dest_file}")
                try:
                    dest_lib_dir.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(template_lib_file, dest_file)
                    
                    # Verify copy immediately
                    if dest_file.exists():
                        file_size = dest_file.stat().st_size
                        log_agent_action("Agent B", f"✅✅✅ Successfully copied {lib_file_name} ({file_size} bytes)")
                    else:
                        log_agent_action("Agent B", f"❌❌❌ CRITICAL: File {lib_file_name} does NOT exist after copy!")
                        raise FileNotFoundError(f"Failed to copy {lib_file_name} - file does not exist after copy")
                except Exception as e:
                    log_agent_action("Agent B", f"❌❌❌ CRITICAL: Error copying {lib_file_name}: {e}")
                    import traceback
                    log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
                    raise

        # Verify critical files were copied - with detailed logging (template-specific)
        # IMPORTANT: Build critical_files list STRICTLY based on template_id to prevent state leakage
        # Use a dictionary approach to ensure no cross-template contamination
        template_critical_files_map = {
            "mini-etl-pipeline": ["package.json", "pages/index.js", "src/lib/spacex.js", "next.config.js"],
            "web-scraper": ["package.json", "pages/index.js", "src/lib/scraper_core.js", "next.config.js", "vercel.json"],
            "brand-mention-monitor": ["package.json", "pages/index.js", "src/lib/news.js", "vercel.json"],
            "data-formatter": ["package.json", "pages/index.js", "src/lib/quotes.js", "vercel.json"],
            "email-campaign-manager": ["package.json", "pages/index.js", "vercel.json"],
            "price-stock-parser": ["package.json", "pages/index.js", "vercel.json"],
            "news-parser": ["package.json", "pages/index.js", "vercel.json"],
            "analytics-dashboard": ["package.json", "pages/index.js", "vercel.json"],
            "telegram-shop-bot": ["package.json", "pages/index.js", "vercel.json"],
            "api-services": [
                "package.json", 
                "pages/index.js", 
                "pages/api/wayback/index.js",
                "pages/api/wayback/analyze-spam.js",
                "src/lib/adapters/wayback/index.js", 
                "src/lib/adapters/wayback/waybackClient.js",
                "src/lib/adapters/wayback/htmlParser.js",
                "src/lib/adapters/wayback/stopWords.js",
                "vercel.json", 
                "next.config.js"
            ],
            "freelance-project-search": [
                "package.json",
                "pages/index.js",
                "pages/api/projects/search.js",
                "pages/api/projects/parse.js",
                "vercel.json",
                "next.config.js"
            ],
        }
        
        # Get critical files for THIS template only - create a fresh list
        critical_files = template_critical_files_map.get(template_id, ["package.json", "pages/index.js"]).copy()
        
        # Add optional files if they exist (for templates that may have them)
        if template_id in ["brand-mention-monitor", "data-formatter"]:
            if (project_path / "next.config.js").exists():
                critical_files.append("next.config.js")
        elif template_id in ["email-campaign-manager", "price-stock-parser", "news-parser", "analytics-dashboard", "telegram-shop-bot", "api-services", "freelance-project-search"]:
            if (project_path / "next.config.js").exists():
                critical_files.append("next.config.js")
            if (project_path / "vercel.json").exists():
                critical_files.append("vercel.json")
        
        log_agent_action("Agent B", f"🔍 DEBUG: template_id={template_id}, critical_files={critical_files}")
        
        missing_files = []
        for file_rel in critical_files:
            file_path = project_path / file_rel
            if file_path.exists():
                file_size = file_path.stat().st_size
                log_agent_action("Agent B", f"✅ Verified copy: {file_rel} exists ({file_size} bytes)")
            else:
                missing_files.append(file_rel)
                log_agent_action("Agent B", f"❌ MISSING: {file_rel} not found after copy!")
        
        # Filter missing_files immediately to only include files required for this template
        # Use the same map to ensure consistency
        required_files_for_template = template_critical_files_map.get(template_id, ["package.json", "pages/index.js"])
        log_agent_action("Agent B", f"🔍 DEBUG: template_id={template_id}, required_files={required_files_for_template}")
        log_agent_action("Agent B", f"🔍 DEBUG: missing_files before filter={missing_files}")
        # STRICT filtering - only keep files that are in the required list for THIS template
        missing_files = [f for f in missing_files if f in required_files_for_template]
        log_agent_action("Agent B", f"🔍 DEBUG: missing_files after filter={missing_files}")
        
        # Double-check: ensure no files from other templates leaked in
        invalid_files = [f for f in missing_files if f not in required_files_for_template]
        if invalid_files:
            log_agent_action("Agent B", f"⚠️ WARNING: Found invalid files in missing_files: {invalid_files} - removing")
            missing_files = [f for f in missing_files if f in required_files_for_template]
        
        # If lib file is missing, try to copy it explicitly (template-specific)
        lib_file_to_copy = None
        template_lib_file = None
        if template_id == "mini-etl-pipeline" and "src/lib/spacex.js" in missing_files:
            lib_file_to_copy = "spacex.js"
            template_lib_file = template_path / "src" / "lib" / "spacex.js"
        elif template_id == "web-scraper" and "src/lib/scraper_core.js" in missing_files:
            lib_file_to_copy = "scraper_core.js"
            template_lib_file = template_path / "src" / "lib" / "scraper_core.js"
            log_agent_action("Agent B", f"🔍 DEBUG: web-scraper missing scraper_core.js")
            log_agent_action("Agent B", f"🔍 DEBUG: template_path = {template_path}")
            log_agent_action("Agent B", f"🔍 DEBUG: template_lib_file = {template_lib_file}")
            log_agent_action("Agent B", f"🔍 DEBUG: template_lib_file.exists() = {template_lib_file.exists()}")
        elif template_id == "brand-mention-monitor" and "src/lib/news.js" in missing_files:
            lib_file_to_copy = "news.js"
            template_lib_file = template_path / "src" / "lib" / "news.js"
        elif template_id == "data-formatter" and "src/lib/quotes.js" in missing_files:
            lib_file_to_copy = "quotes.js"
            template_lib_file = template_path / "src" / "lib" / "quotes.js"
        
        if lib_file_to_copy and template_lib_file:
            log_agent_action("Agent B", f"🔧 Checking template file for manual copy: {template_lib_file}")
            log_agent_action("Agent B", f"🔧 Template file exists: {template_lib_file.exists()}")
            if template_lib_file.exists():
                log_agent_action("Agent B", f"🔧 Attempting to manually copy src/lib/{lib_file_to_copy}")
                try:
                    # Ensure destination directory exists
                    dest_lib_dir = project_path / "src" / "lib"
                    dest_lib_dir.mkdir(parents=True, exist_ok=True)
                    log_agent_action("Agent B", f"✅ Created directory: {dest_lib_dir}")
                    
                    # Copy the file explicitly
                    dest_file = dest_lib_dir / lib_file_to_copy
                    log_agent_action("Agent B", f"🔧 Copying from {template_lib_file} to {dest_file}")
                    shutil.copy2(template_lib_file, dest_file)
                    
                    if dest_file.exists():
                        file_size = dest_file.stat().st_size
                        log_agent_action("Agent B", f"✅✅✅ MANUALLY COPIED: src/lib/{lib_file_to_copy} ({file_size} bytes)")
                        missing_files.remove(f"src/lib/{lib_file_to_copy}")
                    else:
                        log_agent_action("Agent B", f"❌ Failed to manually copy src/lib/{lib_file_to_copy} - file doesn't exist after copy")
                except Exception as e:
                    log_agent_action("Agent B", f"❌ Error manually copying src/lib/{lib_file_to_copy}: {e}")
                    import traceback
                    log_agent_action("Agent B", f"❌ Traceback: {traceback.format_exc()}")
            else:
                log_agent_action("Agent B", f"❌ Template file {template_lib_file} does NOT exist - cannot copy!")
        
        if missing_files:
            # Final fallback copy attempts for lib files (only for templates that need them)
            fallback_files = {
                "web-scraper": ("scraper_core.js", "src/lib/scraper_core.js"),
                "brand-mention-monitor": ("news.js", "src/lib/news.js"),
                "data-formatter": ("quotes.js", "src/lib/quotes.js"),
            }
            
            if template_id in fallback_files:
                lib_file_name, missing_file_path = fallback_files[template_id]
                if missing_file_path in missing_files:
                    template_lib_file = template_path / "src" / "lib" / lib_file_name
                    if template_lib_file.exists():
                        try:
                            dest_lib_dir = project_path / "src" / "lib"
                            dest_lib_dir.mkdir(parents=True, exist_ok=True)
                            dest_file = dest_lib_dir / lib_file_name
                            shutil.copy2(template_lib_file, dest_file)
                            if dest_file.exists():
                                log_agent_action("Agent B", f"✅✅✅ FINAL ATTEMPT SUCCESS: {lib_file_name} copied")
                                missing_files.remove(missing_file_path)
                        except Exception as e:
                            log_agent_action("Agent B", f"❌ Final copy attempt failed for {lib_file_name}: {e}")
            
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

        # Skip customization - use template as-is (strict template implementation)
        # await self._customize_project(project_path, project_name, description)
        log_agent_action("Agent B", "📋 Using template as-is (no customization)")

        # Verify critical files still exist after customization (template-specific)
        if template_id == "mini-etl-pipeline":
            spacex_file = project_path / "src" / "lib" / "spacex.js"
            if spacex_file.exists():
                file_size = spacex_file.stat().st_size
                log_agent_action("Agent B", f"✅ Verified: spacex.js still exists after customization ({file_size} bytes)")
            else:
                log_agent_action("Agent B", f"❌❌❌ CRITICAL: spacex.js was deleted during customization!")
                raise FileNotFoundError("spacex.js was deleted during customization")
        elif template_id == "web-scraper":
            scraper_core_file = project_path / "src" / "lib" / "scraper_core.js"
            if scraper_core_file.exists():
                file_size = scraper_core_file.stat().st_size
                log_agent_action("Agent B", f"✅ Verified: scraper_core.js still exists after customization ({file_size} bytes)")
            else:
                log_agent_action("Agent B", f"❌❌❌ CRITICAL: scraper_core.js was deleted during customization!")
                raise FileNotFoundError("scraper_core.js was deleted during customization")

        log_agent_action("Agent B", f"✅ Project created at: {project_path}")

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

                # Add project description as comment - sanitize to prevent JS syntax errors
                import re
                # Replace newlines and carriage returns with spaces
                cleaned_description = description.replace('\n', ' ').replace('\r', ' ')
                # Remove or replace characters that could break JS comments
                cleaned_description = re.sub(r'[*/\\]', '', cleaned_description)  # Remove */ and \
                # Limit length and ensure it's a single line
                cleaned_description = cleaned_description[:200].strip()
                if len(cleaned_description) > 200:
                    cleaned_description = cleaned_description[:197] + "..."
                
                content = f"// Project: {cleaned_description}\n{content}"

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
            return self._safe_json_parse(response, default={})

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
        template_id: str = None,
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
                
                # Track critical files for logging
                if 'spacex.js' in relative_path or 'randomuser.js' in relative_path:
                    critical_files_to_upload.append(relative_path)
                    file_size = file_path.stat().st_size
                    log_agent_action("Agent B", f"🎯 CRITICAL FILE FOUND: {relative_path} ({file_size} bytes) - will upload")
                elif 'wayback' in relative_path and 'adapters' in relative_path and relative_path.endswith('.js'):
                    # Track wayback adapter files as critical for api-services template
                    critical_files_to_upload.append(relative_path)
                    file_size = file_path.stat().st_size
                    log_agent_action("Agent B", f"🎯 CRITICAL WAYBACK FILE FOUND: {relative_path} ({file_size} bytes) - will upload")
                elif relative_path == "next.config.js" or relative_path == "vercel.json":
                    # Also track next.config.js and vercel.json as critical for templates that have them
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
                    if 'spacex.js' in relative_path or 'randomuser.js' in relative_path or ('wayback' in relative_path and 'adapters' in relative_path):
                        log_agent_action("Agent B", f"📖 Reading {relative_path}: {len(content_bytes)} bytes")
                except Exception as e:
                    log_agent_action("Agent B", f"⚠️ Failed to read {relative_path}: {e}")
                    error_count += 1
                    continue
                
                # Encode to base64
                try:
                    encoded = base64.b64encode(content_bytes).decode('utf-8')
                    if 'spacex.js' in relative_path or 'randomuser.js' in relative_path or ('wayback' in relative_path and 'adapters' in relative_path):
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
                    if 'spacex.js' in relative_path or 'randomuser.js' in relative_path or ('wayback' in relative_path and 'adapters' in relative_path):
                        log_agent_action("Agent B", f"❌ FAILED to upload {relative_path}: {put_resp.status_code}")
                        try:
                            error_detail = put_resp.json()
                            log_agent_action("Agent B", f"❌ Error detail: {error_detail}")
                        except:
                            log_agent_action("Agent B", f"❌ Error text: {put_resp.text[:500]}")
                    self._raise_for_status_verbose(put_resp, f"Upload {relative_path}")
                else:
                    uploaded_count += 1
                    if 'spacex.js' in relative_path or 'randomuser.js' in relative_path or ('wayback' in relative_path and 'adapters' in relative_path):
                        log_agent_action("Agent B", f"✅✅✅ SUCCESS: Uploaded {relative_path} to GitHub (status: {put_resp.status_code})")
                        # Verify immediately
                        verify_resp = requests.get(url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
                        if verify_resp.status_code == 200:
                            log_agent_action("Agent B", f"✅✅✅ VERIFIED: {relative_path} exists in GitHub after upload")
                        else:
                            log_agent_action("Agent B", f"⚠️⚠️⚠️ WARNING: {relative_path} NOT verified after upload (status: {verify_resp.status_code})")
                    elif 'package.json' in relative_path or 'index.js' in relative_path or 'next.config.js' in relative_path or 'vercel.json' in relative_path:
                        log_agent_action("Agent B", f"✅ Uploaded critical file: {relative_path}")
                    
                    if uploaded_count % 10 == 0:
                        log_agent_action("Agent B", f"📤 Uploaded {uploaded_count} files...")
                        
            except Exception as e:
                if 'spacex.js' in relative_path or 'randomuser.js' in relative_path or ('wayback' in relative_path and 'adapters' in relative_path):
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
        
        # Verify critical files were uploaded to GitHub with retries (template-specific)
        # Only verify files that actually exist in the project
        critical_files_to_verify = ["pages/index.js", "package.json"]
        if template_id == "mini-etl-pipeline":
            critical_files_to_verify.extend(["src/lib/spacex.js", "next.config.js"])
        elif template_id == "api-services":
            # Verify wayback adapter files for api-services
            if (project_path / "src/lib/adapters/wayback/index.js").exists():
                critical_files_to_verify.append("src/lib/adapters/wayback/index.js")
            if (project_path / "src/lib/adapters/wayback/waybackClient.js").exists():
                critical_files_to_verify.append("src/lib/adapters/wayback/waybackClient.js")
            if (project_path / "next.config.js").exists():
                critical_files_to_verify.append("next.config.js")
            if (project_path / "vercel.json").exists():
                critical_files_to_verify.append("vercel.json")
        else:
            # For other templates, only check next.config.js if it exists in the project
            # Check if next.config.js was actually uploaded by verifying it exists in project_path
            if (project_path / "next.config.js").exists():
                critical_files_to_verify.append("next.config.js")
            # vercel.json is critical for Vercel deployment
            if (project_path / "vercel.json").exists():
                critical_files_to_verify.append("vercel.json")
        
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
        
        expected_count = len(critical_files_to_verify)
        if len(critical_uploaded) < expected_count:
            error_msg = f"Critical files missing in GitHub repository. Only {len(critical_uploaded)}/{expected_count} files found: {critical_uploaded}"
            log_agent_action("Agent B", f"❌❌❌ {error_msg}")
            raise RuntimeError(error_msg)
        else:
            log_agent_action("Agent B", f"✅✅✅ All {len(critical_uploaded)}/{expected_count} critical files verified in GitHub repository")

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
        deployment = self._safe_json_parse(create, default={})
        if not deployment or "id" not in deployment:
            raise ValueError(f"Invalid deployment response: {deployment}")
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
            status_data = self._safe_json_parse(status_resp, default={})
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

        spacex_url = os.getenv("SPACEX_API_URL", "https://api.spacexdata.com/v5/launches")
        if not spacex_url:
            log_agent_action("Agent B", "ℹ️ SPACEX_API_URL not set in environment; using default")
            spacex_url = "https://api.spacexdata.com/v5/launches"

        try:
            self._set_vercel_env_var(project_id, "SPACEX_API_URL", spacex_url)
            log_agent_action("Agent B", f"🔐 Vercel env configured for {project_name} (SPACEX_API_URL)")
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
            envs = self._safe_json_parse(list_resp, default={}).get("envs", [])
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
