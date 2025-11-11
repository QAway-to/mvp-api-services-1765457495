import asyncio
import time
import re
import os
from datetime import datetime
from typing import List, Dict, Any
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium_stealth import stealth
from fake_useragent import UserAgent
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from urllib.parse import quote_plus

from config import config
from utils.logger import logger, log_agent_action
from evaluation.evaluator import ProjectEvaluator
from telegram_bot import TelegramNotifier

class AgentA:
    def __init__(self):
        self.driver = None
        self.evaluator = ProjectEvaluator()
        self.telegram = TelegramNotifier() if config.TELEGRAM_BOT_TOKEN else None
        self.status = "stopped"
        self.last_run_time = None
        self.found_projects: List[Dict[str, Any]] = []
        self.running = False
        self.current_session_start = None
        self.current_session_end = None
        self.session_steps: List[Dict[str, Any]] = []
        # Live streaming of projects during Selenium run
        self.live_queue = None  # type: ignore
        self._loop = None  # event loop captured per session for thread-safe puts

    def setup_driver(self):
        """Setup stealth browser"""
        log_agent_action("Agent A", "🔧 Starting browser setup...")

        if config.MODE == "demo":
            log_agent_action("Agent A", "🔧 Demo mode: skipping browser setup")
            self.driver = None
            return

        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        ua = UserAgent()
        user_agent = ua.random
        options.add_argument(f"--user-agent={user_agent}")

        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--disable-extensions")
        options.add_argument("--window-size=1920,1080")

        chrome_bin = os.getenv("CHROME_BIN") or os.getenv("GOOGLE_CHROME_BIN")
        if chrome_bin:
            options.binary_location = chrome_bin

        try:
            self.driver = webdriver.Chrome(options=options)
            log_agent_action("Agent A", "✅ Browser ready")
        except Exception as e:
            error_msg = str(e)[:500]
            log_agent_action("Agent A", f"❌ Browser setup failed: {error_msg}")
            raise Exception(f"Could not setup Chrome driver: {error_msg}")

        try:
            stealth(self.driver,
                    languages=["en-US", "en"],
                    vendor="Google Inc.",
                    platform="Win32",
                    webgl_vendor="Intel Inc.",
                    renderer="Intel Iris OpenGL Engine",
                    fix_hairline=True)
        except Exception as e:
            log_agent_action("Agent A", f"⚠️ Stealth setup failed: {str(e)[:100]}")

        log_agent_action("Agent A", "✅ Browser setup complete")

    def human_delay(self, min_sec: float = None, max_sec: float = None):
        """Human-like delay between actions"""
        if min_sec is None:
            min_sec = config.DELAY_BETWEEN_ACTIONS_MIN
        if max_sec is None:
            max_sec = config.DELAY_BETWEEN_ACTIONS_MAX

        delay = min_sec + (max_sec - min_sec) * (time.time() % 1)  # Pseudo-random
        time.sleep(delay)
        return delay

    def _is_title_preliminary_relevant(self, title: str) -> bool:
        """
        Preliminary title filtering - only filters out obviously irrelevant projects.
        Since we're already searching by relevant keywords on Kwork, most results should be relevant.
        We only filter out clearly unrelated projects (like 'лифт', 'дизайн', etc.).
        """
        if not title:
            return False

        title_lower = title.lower()

        # Hard filter: Must NOT contain obviously irrelevant words
        # These are projects that have nothing to do with bots/data/scripts/parsing
        irrelevant_words = [
            'лифт', 'проект лифта', 'строительств', 'ремонт', 'мебель',
            'дизайн', 'логотип', 'баннер', 'фото', 'видео', 'монтаж', 'графика',
            'текст', 'копирайтинг', 'копирайт', 'перевод', 'статья', 'презентация',
            'верстка', 'html', 'css', 'фронтенд', 'ui/ux', 'анимация',
            'чертеж', 'чертежи', 'ванна', 'столик', 'выдвижные ящики',  # Example from logs
            'экспертные тексты', 'блог wordpress'  # Content writing
        ]

        # Check for irrelevant words (hard filter)
        has_irrelevant = any(word in title_lower for word in irrelevant_words)
        if has_irrelevant:
            return False

        # Since we're already searching by relevant keywords on Kwork,
        # we assume that most results are relevant unless they contain irrelevant words.
        # This allows more projects to pass through for detailed evaluation.
        return True

    def simulate_reading(self, duration: int = None):
        """Simulate human reading"""
        if duration is None:
            duration = config.READING_TIME_MIN + int((config.READING_TIME_MAX - config.READING_TIME_MIN) * (time.time() % 1))

        log_agent_action("Agent A", f"Simulating reading for {duration} seconds")

        if self.driver:
            # Scroll to simulate reading
            scroll_steps = min(5, duration // 2)
            for i in range(scroll_steps):
                try:
                    self.driver.execute_script("window.scrollBy(0, 200);")
                    time.sleep(duration / scroll_steps)
                except Exception:
                    break

        time.sleep(duration % 2)  # Remaining time

    def search_projects(self) -> List[Dict[str, Any]]:
        """Search for projects with keywords"""
        keywords_str = ", ".join(config.SEARCH_KEYWORDS_LIST)
        log_agent_action("Agent A", f"Searching projects with keywords: {keywords_str}")

        if config.MODE == "demo":
            # Demo mode: generate fake projects
            return self._generate_demo_projects()
        else:
            # Full mode: real search on Kwork
            return self._search_real_projects()

    def _generate_demo_projects(self) -> List[Dict[str, Any]]:
        """Generate demo projects - DISABLED: Returns empty list"""
        log_agent_action("Agent A", "🎭 [DEMO] Demo mode: Fake projects are disabled")
        log_agent_action("Agent A", "🎭 [DEMO] To get real projects, set MODE=full and provide Kwork credentials")
        log_agent_action("Agent A", "🎭 [DEMO] Agent will only process real projects from Kwork with browser automation")
        return []

    def _check_proposal_button_available(self) -> bool:
        """Check if 'Предложить услугу' button is available on project page"""
        try:
            # Check page source for button text
            page_source = self.driver.page_source.lower()
            
            # Look for proposal button text
            proposal_keywords = ['предложить услугу', 'предложить', 'отправить предложение']
            has_proposal_text = any(keyword in page_source for keyword in proposal_keywords)
            
            if not has_proposal_text:
                log_agent_action("Agent A", f"⚠️ [SELENIUM] Proposal button text not found (proposal may already be sent)")
                return False
            
            # Try to find button element by various methods
            try:
                # Method 1: XPath with text content
                proposal_button = self.driver.find_element(By.XPATH, 
                    "//button[contains(translate(text(), 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'), 'предложить услугу')] | " +
                    "//a[contains(translate(text(), 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'), 'предложить услугу')]")
                
                if proposal_button and proposal_button.is_displayed():
                    # Check if button is enabled (not disabled)
                    if proposal_button.is_enabled():
                        log_agent_action("Agent A", f"✅ [SELENIUM] Proposal button found and enabled")
                        return True
                    else:
                        log_agent_action("Agent A", f"⚠️ [SELENIUM] Proposal button found but disabled")
                        return False
            except NoSuchElementException:
                pass
            
            # Method 2: Try common button selectors
            try:
                buttons = self.driver.find_elements(By.CSS_SELECTOR, "button, a.btn, a[class*='button']")
                for button in buttons:
                    button_text = button.text.lower()
                    if any(keyword in button_text for keyword in proposal_keywords):
                        if button.is_displayed() and button.is_enabled():
                            log_agent_action("Agent A", f"✅ [SELENIUM] Proposal button found via CSS selector")
                            return True
            except Exception:
                pass
            
            # If button text exists but element not found, assume it might be available
            # (could be dynamically loaded or hidden)
            log_agent_action("Agent A", f"⚠️ [SELENIUM] Proposal button text found but element not accessible, assuming available")
            return True
            
        except Exception as e:
            log_agent_action("Agent A", f"⚠️ [SELENIUM] Error checking proposal button: {str(e)[:100]}")
            # On error, assume button is available (to be safe)
            return True

    def _search_real_projects(self) -> List[Dict[str, Any]]:
        """Real search on Kwork with pagination, proposal button check, and semantic ranking"""
        log_agent_action("Agent A", "🔍 Searching projects...")

        keywords_str = ','.join(config.SEARCH_KEYWORDS_LIST)
        keywords_encoded = quote_plus(keywords_str)

        # Search parameters
        max_pages = 3  # Maximum pages to search
        max_relevant_projects = 10  # Search for up to 10 relevant projects
        output_limit = 5  # Output top 5 most relevant
        
        all_projects = []  # All projects found (with full details)
        page = 1
        
        while page <= max_pages and len(all_projects) < max_relevant_projects:
            search_url = f"{config.KWORK_PROJECTS_URL}?keyword={keywords_encoded}&page={page}&a=1"
            
            try:
                self.driver.get(search_url)
            except Exception as e:
                log_agent_action("Agent A", f"❌ Error loading page {page}: {str(e)[:50]}")
                break

            # Wait for page to stabilize
            if page == 1:
                self.human_delay(2, 4)
                self.simulate_reading()
            else:
                self.human_delay(1, 2)

            # Wait for projects to load
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "h1 a[href*='/projects/']"))
                )
            except TimeoutException:
                log_agent_action("Agent A", f"⚠️ No projects on page {page}")
                break

            # Find all project elements on current page
            project_elements = self.driver.find_elements(By.CSS_SELECTOR, "h1 a[href*='/projects/']")

            if len(project_elements) == 0:
                log_agent_action("Agent A", f"⚠️ No more projects on page {page}")
                break

            # Collect project URLs and titles from current page
            page_projects = []
            filtered_count = 0
            
            for i, link_element in enumerate(project_elements):
                try:
                    title = link_element.text.strip()
                    url = link_element.get_attribute("href")
                    
                    # SOFT FILTERING - only skip obviously irrelevant projects
                    if not self._is_title_preliminary_relevant(title):
                        filtered_count += 1
                        continue
                    
                    # Ensure URL has /view suffix
                    if url and '/projects/' in url:
                        if '?' in url:
                            url = url.split('?')[0]
                        if not url.endswith('/view'):
                            if url.endswith('/'):
                                url = url.rstrip('/') + '/view'
                            else:
                                url = url + '/view'
                    
                    # Extract project ID
                    project_id = ""
                    if '/' in url:
                        url_parts = url.split('/')
                        last_part = url_parts[-1].split('?')[0]
                        if last_part == 'view' and len(url_parts) >= 2:
                            project_id = url_parts[-2].split('?')[0]
                        else:
                            project_id = last_part.split('?')[0]
                    else:
                        project_id = f"page{page}_item{i}"
                    
                    page_projects.append({
                        "id": project_id,
                        "title": title,
                        "url": url,
                        "page": page,
                        "index_on_page": i + 1
                    })
                except Exception as e:
                    continue
            
            # Process each project from current page
            for project_info in page_projects:
                if len(all_projects) >= max_relevant_projects:
                    break
                    
                try:
                    project_id = project_info["id"]
                    title = project_info["title"]
                    url = project_info["url"]
                    page_num = project_info["page"]

                    # Navigate to project page
                    try:
                        self.driver.get(url)
                        self.human_delay(2, 4)
                    except Exception as e:
                        continue
                    
                    # CHECK: Is "Предложить услугу" button available?
                    try:
                        if not self._check_proposal_button_available():
                            continue  # Skip this project - proposal already sent
                    except Exception as e:
                        pass  # Assume button is available if we can't check
                    
                    try:
                        # Extract project data
                        description = ""
                        try:
                            desc_selectors = [
                                ".wants-card__description-text",
                                ".task__description",
                                "[class*='description-text']",
                                "[class*='wants-card__text']",
                                ".project-description",
                                "[data-test-id='task-description']",
                                ".break-word"
                            ]
                            
                            for selector in desc_selectors:
                                try:
                                    desc_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                                    if desc_elements:
                                        desc_texts = [elem.text.strip() for elem in desc_elements if elem.text.strip()]
                                        if desc_texts:
                                            description = '\n'.join(desc_texts)
                                            if len(description) > 100:
                                                break
                                except Exception:
                                    continue
                            
                            if not description or len(description) < 100:
                                try:
                                    main_content = self.driver.find_element(By.CSS_SELECTOR, "main, .content, .container, [class*='wants-card']")
                                    description = main_content.text.strip()
                                    if title in description:
                                        desc_start = description.find(title) + len(title)
                                        description = description[desc_start:].strip()
                                except Exception:
                                    pass
                                except Exception:
                                    pass
                            
                        # Get budget
                        budget = ""
                        try:
                            budget_selectors = [
                                ".wants-card__header-price",
                                "[class*='price-text']",
                                "[class*='budget']",
                                "[class*='price']",
                                "[data-test-id='task-price']",
                                ".task__price",
                                ".project-price",
                            ]
                            for selector in budget_selectors:
                                try:
                                    budget_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                                    for elem in budget_elements:
                                        budget_text = elem.text.strip()
                                        if budget_text and (re.search(r'\d', budget_text) or '₽' in budget_text or 'руб' in budget_text.lower()):
                                            budget = budget_text
                                            break
                                    if budget:
                                        break
                                except Exception:
                                    continue
                            
                            if not budget:
                                try:
                                    page_source = self.driver.page_source
                                    price_patterns = [
                                        r'(\d{1,3}(?:\s?\d{3})*)\s*[₽руб]',
                                        r'[₽руб]\s*(\d{1,3}(?:\s?\d{3})*)',
                                        r'цена[:\s]*(\d{1,3}(?:\s?\d{3})*)',
                                        r'бюджет[:\s]*(\d{1,3}(?:\s?\d{3})*)'
                                    ]
                                    for pattern in price_patterns:
                                        matches = re.findall(pattern, page_source, re.IGNORECASE)
                                        if matches:
                                            price_num = matches[0].replace(' ', '')
                                            budget = f"{price_num} ₽"
                                            break
                                except Exception:
                                    pass
                        except Exception:
                            pass

                        # Get proposals and hired counts
                        proposals = 0
                        hired = 0
                        try:
                            page_text = ""
                        try:
                            page_text = self.driver.page_source
                            except Exception:
                                page_text = ""

                            # Proposals (first try DOM elements, then fallback to raw HTML)
                            proposals_xpath = [
                                "//*[contains(translate(., 'ОТКЛИКИПРЕДЛОЖЕНИЙ', 'откликипредложений'), 'отклик')]",
                                "//*[contains(translate(., 'ОТКЛИКИПРЕДЛОЖЕНИЙ', 'откликипредложений'), 'предлож')]",
                                "//*[contains(@class,'responses') or contains(@class,'proposals')]"
                            ]
                            for xp in proposals_xpath:
                                try:
                                    elem = WebDriverWait(self.driver, 5).until(
                                        EC.presence_of_element_located((By.XPATH, xp))
                                    )
                                    if elem and elem.text:
                                        match = re.search(r'(\d+)', elem.text.replace('\xa0', ' '))
                                        if match:
                                            proposals = int(match.group(1))
                                            break
                                except Exception:
                                    continue

                            if proposals == 0 and page_text:
                            proposals_patterns = [
                                    r'откликов[:\s]+(\d+)',
                                    r'предложений[:\s]+(\d+)',
                                r'(\d+)\s+отклик',
                                r'(\d+)\s+откликов',
                                    r'(\d+)\s+предложен',
                                    r'(\d+)\s+предложений'
                            ]
                            for pattern in proposals_patterns:
                                match = re.search(pattern, page_text, re.IGNORECASE)
                                if match:
                                    proposals = int(match.group(1))
                                    break
                            
                            # Hired
                            if page_text:
                            hired_patterns = [
                                r'(\d+)\s+исполнител',
                                r'нанят[:\s]+(\d+)',
                                r'исполнитель.*нанят',
                                r'нанято[:\s]+(\d+)'
                            ]
                            for pattern in hired_patterns:
                                match = re.search(pattern, page_text, re.IGNORECASE)
                                if match:
                                        hired = int(match.group(1)) if match.lastindex else 1
                                                break
                                except Exception:
                                    pass

                        # Create project data
                        project_data = {
                            "id": project_id,
                            "title": title,
                            "description": description,
                            "budget": budget,
                            "url": url,
                            "proposals": proposals,
                            "hired": hired,
                            "found_at": datetime.now().isoformat(),
                            "page": page_num
                        }

                        all_projects.append(project_data)
                        # Push to live queue for immediate evaluation/notification (from Selenium thread)
                        try:
                            if self.live_queue is not None and self._loop is not None:
                                asyncio.run_coroutine_threadsafe(self.live_queue.put(project_data), self._loop)
                        except Exception:
                            pass

                        # Human delay between projects
                        self.human_delay(1, 3)
                        
                    except Exception:
                        continue
                        
                except Exception as e:
                    log_agent_action("Agent A", f"❌ [SELENIUM] Error processing project: {str(e)[:200]}")
                    continue

            # Move to next page
            page += 1
            
            # Small delay before next page
            if page <= max_pages and len(all_projects) < max_relevant_projects:
                self.human_delay(1, 2)
        
        # Evaluate all projects and rank by semantic similarity
        if len(all_projects) > 0:
            evaluated_projects = []
            for project in all_projects:
                try:
                    score, reasons = self.evaluator.evaluate_project(project)
                    project["evaluation"] = {
                        "score": score,
                        "reasons": reasons,
                        "suitable": score >= config.EVALUATION_THRESHOLD
                    }
                    
                    # Extract semantic similarity if available
                    semantic_score = 0.0
                    for reason in reasons:
                        if "Similarity:" in reason:
                            try:
                                semantic_score = float(reason.split("Similarity:")[1].strip().split()[0])
                            except Exception:
                                pass
                    
                    project["semantic_score"] = semantic_score
                    evaluated_projects.append(project)
                    
                except Exception:
                    continue
            
            # Sort by semantic score (highest first), then by total score
            evaluated_projects.sort(key=lambda x: (x.get("semantic_score", 0.0), x.get("evaluation", {}).get("score", 0.0)), reverse=True)
            
            # Return top N most relevant projects
            top_projects = evaluated_projects[:output_limit]
            return top_projects
        else:
            return []

    async def evaluate_and_notify(self, projects: List[Dict[str, Any]]):
        """Evaluate projects and send notifications - projects are already evaluated in _search_real_projects"""
        log_agent_action("Agent A", f"📊 Evaluating {len(projects)} projects...")

        suitable_projects = []
        suitable_count = 0

        for i, project in enumerate(projects):
            try:
                evaluation = project.get("evaluation", {})
                score = evaluation.get("score", 0.0)
                reasons = evaluation.get("reasons", [])
                suitable = evaluation.get("suitable", False)

                if suitable:
                    suitable_projects.append(project)
                    suitable_count += 1
                    log_agent_action("Agent A", f"✅ Suitable project: {project['title'][:40]}...")

                    # Send notification immediately
                    if self.telegram:
                        await self.telegram.send_project_notification(project)

                    # Send summary after every 5 suitable projects
                    if suitable_count % 5 == 0:
                        summary_stats = {
                            "checked": len(self.found_projects) + suitable_count,
                            "suitable": len(self.found_projects) + suitable_count,
                            "timestamp": datetime.now().isoformat()
                        }
                        await self.telegram.send_summary_notification(summary_stats)
                        log_agent_action("Agent A", f"📈 Summary sent: {suitable_count} projects found")
                else:
                    log_agent_action("Agent A", f"❌ Rejected: {project['title'][:40]}...")

            except Exception as e:
                log_agent_action("Agent A", f"❌ Error processing project {i+1}: {str(e)[:50]}")

        self.found_projects.extend(suitable_projects)
        log_agent_action("Agent A", f"📊 Session complete: {suitable_count} suitable projects")

    async def run_session(self):
        """Run one search session"""
        # Prepare live streaming pipeline
        self.live_queue = asyncio.Queue()
        self._loop = asyncio.get_running_loop()

        session_start = datetime.now()
        self.current_session_start = session_start
        self.session_steps = []
        
        log_agent_action("Agent A", f"🚀 Starting search session...")
        
        if not self.driver:
            self.setup_driver()
            log_agent_action("Agent A", "✅ Browser ready")

        self.status = "running"
        self.last_run_time = datetime.now().isoformat()

        try:
            # Start consumer to evaluate and notify as projects appear
            consumer_task = asyncio.create_task(self._consume_and_notify_live(max_notifications=5))

            # Run blocking Selenium search off the event loop to avoid blocking notifications
            projects = await asyncio.to_thread(self.search_projects)
            log_agent_action("Agent A", f"🔍 Found {len(projects)} projects")

            # Signal consumer that producer finished
            await self.live_queue.put(None)
            await consumer_task

            # Session summary
            session_duration = (datetime.now() - session_start).total_seconds()
            self.current_session_end = datetime.now()
            suitable_count = len([p for p in projects if p.get('evaluation', {}).get('suitable', False)])
            log_agent_action("Agent A", f"✅ Session complete: {suitable_count}/{len(projects)} suitable projects in {session_duration:.0f}s")

        except Exception as e:
            session_duration = (datetime.now() - session_start).total_seconds()
            log_agent_action("Agent A", f"❌ [SESSION] Session error after {session_duration:.2f}s: {str(e)}")
        finally:
            self.status = "waiting"
            self.current_session_start = None
            self.current_session_end = None
            self.live_queue = None
            self._loop = None

    async def _consume_and_notify_live(self, max_notifications: int = 5):
        """
        Consume projects from live_queue, evaluate them, and send Telegram
        notifications immediately while Selenium continues collecting.
        """
        sent = 0
        live_suitable: List[Dict[str, Any]] = []

        while True:
            item = await self.live_queue.get()
            if item is None:
                break

            try:
                score, reasons = self.evaluator.evaluate_project(item)
                item["evaluation"] = {
                    "score": score,
                    "reasons": reasons,
                    "suitable": score >= config.EVALUATION_THRESHOLD
                }

                if item["evaluation"]["suitable"] and sent < max_notifications:
                    live_suitable.append(item)
                    if self.telegram:
                        await self.telegram.send_project_notification(item)
                    sent += 1

                    if sent == max_notifications:
                        # Send summary after the 5th suitable project
                        summary_stats = {
                            "checked": len(self.found_projects) + sent,
                            "suitable": len(self.found_projects) + sent,
                            "timestamp": datetime.now().isoformat()
                        }
                        if self.telegram:
                            await self.telegram.send_summary_notification(summary_stats)
                        log_agent_action("Agent A", f"📈 Summary sent: {sent} projects found")

            except Exception as e:
                log_agent_action("Agent A", f"❌ Live notify error: {str(e)[:80]}")

        # Persist suitable projects discovered live
        self.found_projects.extend(live_suitable)

    async def run_continuous(self):
        """Run continuous monitoring"""
        if self.running:
            return

        self.running = True
        log_agent_action("Agent A", "🚀 Starting continuous monitoring")

        try:
            while self.running:
                await self.run_session()

                if self.running:
                    await asyncio.sleep(config.PAUSE_BETWEEN_CHECKS)

        except Exception as e:
            log_agent_action("Agent A", f"❌ Continuous monitoring error: {str(e)}")
        finally:
            self.running = False
            self.status = "stopped"

    async def stop(self):
        """Stop the agent"""
        log_agent_action("Agent A", "Stopping agent")
        self.running = False
        self.status = "stopped"

        if self.driver:
            try:
                self.driver.quit()
                self.driver = None
            except Exception as e:
                log_agent_action("Agent A", f"Error closing driver: {e}")
