"""
MVP Generator - creates deployable applications from templates
"""
import os
import shutil
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional

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
        """Push project to GitHub (mock implementation)"""
        log_agent_action("Agent B", f"🚀 Pushing {project_name} to GitHub...")

        # In real implementation, this would:
        # 1. Create GitHub repository
        # 2. Initialize git repo
        # 3. Add files
        # 4. Push to GitHub

        # Mock response
        await asyncio.sleep(2)
        github_url = f"https://github.com/{Config.GITHUB_USER}/{project_name}"

        log_agent_action("Agent B", f"✅ Pushed to GitHub: {github_url}")
        return github_url

    async def _deploy_to_vercel(self, project_name: str, github_url: str) -> str:
        """Deploy to Vercel (mock implementation)"""
        log_agent_action("Agent B", f"🎯 Deploying {project_name} to Vercel...")

        # In real implementation, this would:
        # 1. Use Vercel API or CLI
        # 2. Trigger deployment from GitHub repo
        # 3. Wait for deployment completion

        # Mock response
        await asyncio.sleep(2)
        deploy_url = f"https://{project_name}.vercel.app"

        log_agent_action("Agent B", f"🎉 Deployed to Vercel: {deploy_url}")
        return deploy_url
