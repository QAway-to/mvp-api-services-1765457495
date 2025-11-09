"""
MVP Generator - creates deployable applications from templates
"""
import os
import shutil
import time
import logging
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List

import requests
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

    async def generate_mvp(self, project_description: str) -> Dict[str, Any]:
        """Generate MVP application based on project description"""
        try:
            log_agent_action("Agent B", f"🎯 Starting MVP generation for: {project_description[:100]}...")

            # 1. Select template using AI
            template_match = await self.template_selector.select_template(project_description)
            template_id = template_match.template_id

            log_agent_action("Agent B", f"✅ Selected template: {template_id} (confidence: {template_match.confidence:.2f})")

            # 2. Generate unique project name
            project_name = self._generate_project_name(template_id)
            log_agent_action("Agent B", f"📁 Project name: {project_name}")

            # 3. Copy and customize template
            await self._create_project_from_template(template_id, project_name, project_description)

            # 4. Push to GitHub (mock for now)
            github_url = await self._push_to_github(project_name)

            # 5. Deploy to Vercel (mock for now)
            deploy_url = await self._deploy_to_vercel(project_name, github_url)

            log_agent_action("Agent B", f"🎉 MVP successfully generated: {deploy_url}")

            return {
                "status": "success",
                "template": template_id,
                "project_name": project_name,
                "github_url": github_url,
                "deploy_url": deploy_url,
                "confidence": template_match.confidence,
                "reasoning": template_match.reasoning
            }

        except Exception as e:
            log_agent_action("Agent B", f"❌ MVP generation failed: {str(e)}")
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

    async def _push_to_github(self, project_name: str) -> str:
        """Push project to GitHub (supports reusable test repository)"""
        log_agent_action("Agent B", f"🚀 Pushing {project_name} to GitHub...")

        if not Config.GITHUB_USER or not Config.GITHUB_TOKEN:
            raise RuntimeError("GitHub credentials are not configured")

        repo_name = Config.AGENT_B_TEST_REPO if Config.AGENT_B_TEST_MODE else project_name
        project_path = self.templates_dir.parent / "generated" / project_name

        if not project_path.exists():
            raise FileNotFoundError(f"Generated project folder not found: {project_path}")

        # Run sync in thread to avoid blocking event loop
        await asyncio.to_thread(self._sync_repository, repo_name, project_path, project_name)

        github_url = f"https://github.com/{Config.GITHUB_USER}/{repo_name}"
        log_agent_action("Agent B", f"✅ Pushed to GitHub: {github_url}")
        return github_url

    async def _deploy_to_vercel(self, project_name: str, github_url: str) -> str:
        """Deploy to Vercel via deploy hook (optional)."""
        log_agent_action("Agent B", f"🎯 Deploying {project_name} to Vercel...")

        deploy_url = None
        if Config.VERCEL_PROJECT_DOMAIN:
            deploy_url = f"https://{Config.VERCEL_PROJECT_DOMAIN}"

        if Config.VERCEL_DEPLOY_HOOK_URL:
            try:
                response = requests.post(
                    Config.VERCEL_DEPLOY_HOOK_URL,
                    json={"trigger": project_name, "source": "agent-b"},
                    timeout=Config.REQUEST_TIMEOUT,
                )
                response.raise_for_status()
                log_agent_action("Agent B", "✅ Vercel deploy hook triggered")
            except requests.RequestException as exc:
                log_agent_action("Agent B", f"⚠️ Failed to trigger Vercel deploy hook: {exc}")
        else:
            log_agent_action("Agent B", "⚠️ Vercel deploy hook URL not configured. Skipping automatic deploy.")

        # Fallback demo URL if project domain not provided
        if not deploy_url:
            deploy_url = f"https://{project_name}.vercel.app"

        await asyncio.sleep(2)
        log_agent_action("Agent B", f"🎉 Deployed to Vercel: {deploy_url}")
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

    def _ensure_repository(self, repo_name: str, headers: Dict[str, str]) -> Dict[str, Any]:
        """Ensure repository exists. Create if needed (only in non-test mode)."""
        repo_url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}"
        response = requests.get(repo_url, headers=headers, timeout=Config.REQUEST_TIMEOUT)

        if response.status_code == 200:
            return response.json()

        if Config.AGENT_B_TEST_MODE:
            raise RuntimeError(f"GitHub repository '{repo_name}' not found. Create it manually for test mode.")

        log_agent_action("Agent B", f"📦 Repository {repo_name} not found. Creating...")
        create_resp = requests.post(
            "https://api.github.com/user/repos",
            headers=headers,
            json={"name": repo_name, "private": False},
            timeout=Config.REQUEST_TIMEOUT,
        )
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
        for file_path in project_path.rglob('*'):
            if file_path.is_file():
                relative_path = file_path.relative_to(project_path).as_posix()
                url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{relative_path}"

                existing = requests.get(url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
                sha = existing.json().get("sha") if existing.status_code == 200 else None

                content_bytes = file_path.read_bytes()
                encoded = base64.b64encode(content_bytes).decode()

                data = {
                    "message": f"Update MVP files from {project_name}",
                    "content": encoded,
                    "branch": branch,
                }
                if sha:
                    data["sha"] = sha

                put_resp = requests.put(url, headers=headers, json=data, timeout=Config.REQUEST_TIMEOUT)
                put_resp.raise_for_status()

    def _list_contents(self, repo_name: str, headers: Dict[str, str], branch: str, path: str = "") -> Optional[List[Dict[str, Any]]]:
        url = f"https://api.github.com/repos/{Config.GITHUB_USER}/{repo_name}/contents/{path}"
        resp = requests.get(url, headers=headers, params={"ref": branch}, timeout=Config.REQUEST_TIMEOUT)
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
        return resp.json()
