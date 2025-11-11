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
            github_url = await self._push_to_github(project_name, repo_name)

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

        # Copy template
        if project_path.exists():
            shutil.rmtree(project_path)
        shutil.copytree(template_path, project_path)

        # Verify critical files were copied
        critical_files = [
            "package.json",
            "pages/index.js",
            "src/lib/randomuser.js",
        ]
        missing_files = []
        for file_rel in critical_files:
            file_path = project_path / file_rel
            if not file_path.exists():
                missing_files.append(file_rel)
        
        if missing_files:
            log_agent_action("Agent B", f"⚠️ Warning: Missing files after copy: {', '.join(missing_files)}")
        else:
            log_agent_action("Agent B", f"✅ All critical files copied successfully")

        # Customize project
        await self._customize_project(project_path, project_name, description)

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

                # Add project description as comment
                content = f"// Project: {description[:200]}...\n{content}"

                with open(mock_file, 'w', encoding='utf-8') as f:
                    f.write(content)

        log_agent_action("Agent B", "✅ Project customization completed")

    async def _push_to_github(self, project_name: str, repo_name: str) -> str:
        """Push project to GitHub (supports reusable or per-project repositories)"""
        if not Config.GITHUB_USER or not Config.GITHUB_TOKEN:
            raise RuntimeError("GitHub credentials are not configured")

        project_path = self.templates_dir.parent / "generated" / project_name

        if not project_path.exists():
            raise FileNotFoundError(f"Generated project folder not found: {project_path}")

        await asyncio.to_thread(self._sync_repository, repo_name, project_path, project_name)

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

    def _sync_repository(self, repo_name: str, project_path: Path, project_name: str) -> None:
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
        self._upload_directory(repo_name, project_path, headers, branch, project_name)
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
    ) -> None:
        uploaded_count = 0
        skipped_count = 0
        error_count = 0
        
        for file_path in project_path.rglob('*'):
            if file_path.is_dir():
                continue

            parts = file_path.relative_to(project_path).parts
            if parts and parts[0] in {'.git', '.next', 'node_modules', '__pycache__', '.venv'}:
                skipped_count += 1
                continue

            if file_path.is_file():
                try:
                    relative_path = file_path.relative_to(project_path).as_posix()
                    
                    # Skip binary files that might cause issues
                    if file_path.suffix in {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'}:
                        skipped_count += 1
                        continue
                    
                    url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{relative_path}"

                    existing = requests.get(url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
                    sha = existing.json().get("sha") if existing.status_code == 200 else None

                    # Read file content
                    try:
                        content_bytes = file_path.read_bytes()
                    except Exception as e:
                        log_agent_action("Agent B", f"⚠️ Failed to read {relative_path}: {e}")
                        error_count += 1
                        continue
                    
                    encoded = base64.b64encode(content_bytes).decode()

                    data = {
                        "message": f"Update MVP files from {project_name}",
                        "content": encoded,
                        "branch": branch,
                    }
                    if sha:
                        data["sha"] = sha

                    put_resp = requests.put(url, headers=headers, json=data, timeout=Config.REQUEST_TIMEOUT)
                    if put_resp.status_code >= 400:
                        self._raise_for_status_verbose(put_resp, f"Upload {relative_path}")
                    else:
                        uploaded_count += 1
                        # Log critical files explicitly
                        if 'randomuser.js' in relative_path or 'package.json' in relative_path or 'index.js' in relative_path:
                            log_agent_action("Agent B", f"✅ Uploaded critical file: {relative_path}")
                        if uploaded_count % 10 == 0:
                            log_agent_action("Agent B", f"📤 Uploaded {uploaded_count} files...")
                except Exception as e:
                    log_agent_action("Agent B", f"❌ Error uploading {relative_path}: {e}")
                    error_count += 1
                    continue
        
        log_agent_action("Agent B", f"✅ Upload complete: {uploaded_count} files uploaded, {skipped_count} skipped, {error_count} errors")

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
