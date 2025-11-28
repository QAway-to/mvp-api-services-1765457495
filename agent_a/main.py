import asyncio
import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse
import logging
import json
from datetime import datetime

# Import from root config (unified configuration)
from config import config
from agents.agent_a import AgentA
from shared_logger import setup_logging, log_queue, log_agent_action

# Setup logging
setup_logging()

app = FastAPI(title="Freelance Agents MVP")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Global agent instance
agent_a = AgentA()

# Log current configuration on startup
log_agent_action("App", f"🚀 Application started in {config.MODE.upper()} mode")
log_agent_action("App", f"📋 Search keywords: {', '.join(config.SEARCH_KEYWORDS_LIST)}")
log_agent_action("App", f"📋 Primary keyword: {config.SEARCH_KEYWORD}")

@app.get("/")
async def dashboard(request: Request):
    """Main dashboard"""
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "mode": config.MODE,
        "keyword": ", ".join(config.SEARCH_KEYWORDS_LIST)
    })

@app.get("/logs/stream")
async def stream_logs():
    """Server-Sent Events for real-time logs with paced delivery"""
    async def event_generator():
        while True:
            try:
                try:
                    # Wait for the next log line with timeout to send keepalives
                    log_message = await asyncio.wait_for(log_queue.get(), timeout=1.0)
                    yield f"data: {log_message}\n\n"
                    await asyncio.sleep(0.05)  # brief pause for step-by-step effect

                    # Drain additional buffered messages, but keep short delays
                    drained = 0
                    while drained < 20:
                        try:
                            buffered_message = log_queue.get_nowait()
                            yield f"data: {buffered_message}\n\n"
                            drained += 1
                            await asyncio.sleep(0.05)
                        except asyncio.QueueEmpty:
                            break

                except asyncio.TimeoutError:
                    # Send keepalive comment so connection stays open
                    yield ": keepalive\n\n"
                    await asyncio.sleep(0.1)

            except Exception as e:
                error_payload = json.dumps({
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "ERROR",
                    "module": "logs",
                    "message": f"Stream error: {str(e)}"
                })
                yield f"data: {error_payload}\n\n"
                await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@app.post("/agent/start")
async def start_agent():
    """Start the agent"""
    try:
        # Check if agent is already running
        if agent_a.running:
            return {
                "status": "already_running", 
                "message": "Agent A is already running. Use /agent/stop to stop it first.",
                "agent_status": agent_a.status
            }
        
        # Start continuous monitoring
        asyncio.create_task(agent_a.run_continuous())
        log_agent_action("API", "Agent A start requested via API")
        return {
            "status": "started", 
            "message": "Agent A started successfully",
            "agent_status": agent_a.status
        }
    except Exception as e:
        log_agent_action("API", f"Error starting agent: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/agent/run-session")
async def run_single_session(request: Request):
    """Run a single search session with optional filters"""
    try:
        # Check if continuous mode is running
        if agent_a.running:
            return {
                "status": "busy",
                "message": "Agent A is running in continuous mode. Stop it first.",
                "agent_status": agent_a.status
            }
        
        # Check if a session is already running
        if agent_a.status == "running":
            return {
                "status": "busy",
                "message": "Agent A is currently running a session. Please wait.",
                "agent_status": agent_a.status
            }
        
        # Parse request body for search parameters
        search_params = {}
        try:
            body = await request.json()
            if body.get("keywords"):
                search_params["keywords"] = body["keywords"]
            if body.get("timeLeft") is not None:
                search_params["timeLeft"] = int(body["timeLeft"])
            if body.get("hiredMin") is not None:
                search_params["hiredMin"] = int(body["hiredMin"])
            if body.get("proposalsMax") is not None:
                search_params["proposalsMax"] = int(body["proposalsMax"])
        except Exception:
            pass  # Use default parameters if body parsing fails
        
        # Run single session with parameters
        asyncio.create_task(agent_a.run_session(**search_params))
        log_agent_action("API", f"Single session start requested via API with params: {search_params}")
        return {
            "status": "session_started",
            "message": "Single search session started",
            "agent_status": agent_a.status
        }
    except Exception as e:
        log_agent_action("API", f"Error starting session: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/agent/stop")
async def stop_agent():
    """Stop the agent"""
    try:
        await agent_a.stop()
        return {"status": "stopped", "message": "Agent A stopped successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/status")
async def get_status():
    """Get current agent status"""
    
    session_info = None
    if agent_a.current_session_start:
        elapsed = (datetime.now() - agent_a.current_session_start).total_seconds()
        session_info = {
            "started_at": agent_a.current_session_start.isoformat(),
            "elapsed_seconds": round(elapsed, 2),
            "steps": len(agent_a.session_steps)
        }
    
    # Count suitable projects
    suitable_count = len([p for p in agent_a.found_projects if p.get('evaluation', {}).get('suitable', False)])
    
    return {
        "agent_a_status": agent_a.status,
        "is_running": agent_a.running,
        "mode": config.MODE,
        "last_check": agent_a.last_run_time,
        "projects_found": len(agent_a.found_projects),
        "suitable_projects": suitable_count,
        "current_session": session_info,
        "search_keyword": config.SEARCH_KEYWORD
    }

@app.get("/projects")
async def get_projects():
    """Get list of all found projects"""
    suitable_count = len([p for p in agent_a.found_projects if p.get('evaluation', {}).get('suitable', False)])
    
    return {
        "total": len(agent_a.found_projects),
        "suitable": suitable_count,
        "projects": agent_a.found_projects
    }


@app.get("/projects/suitable")
async def get_suitable_projects():
    """Get only suitable projects"""
    suitable = [p for p in agent_a.found_projects if p.get('evaluation', {}).get('suitable', False)]
    return {
        "total": len(suitable),
        "projects": suitable
    }

# MVP Generation API
@app.post("/api/generate-mvp")
async def generate_mvp(request: Request):
    """Generate MVP based on template and project description"""
    try:
        data = await request.json()
        template = data.get("template", "").strip()
        description = data.get("description", "").strip()
        build_type = data.get("buildType", "mock")

        if not template:
            return {"status": "error", "error": "Не выбран шаблон MVP"}

        if description and len(description) < 10:
            return {"status": "error", "error": "Описание проекта слишком короткое (минимум 10 символов)"}

        log_agent_action("MVP", f"🎯 Generating MVP: {template}")

        # Import and use MVP generator
        try:
            from mvp_generator import MVPGenerator
            generator = MVPGenerator()

            if not description:
                template_descriptions = {
                    "telegram-shop-bot": "Создать Telegram бота для интернет-магазина с каталогом товаров, корзиной и оформлением заказов",
                    "news-parser": "Создать веб-приложение для парсинга и анализа новостей с визуализацией данных",
                    "analytics-dashboard": "Создать дашборд для визуализации данных и аналитики бизнеса",
                    "email-campaign-manager": "Создать панель управления email-рассылками с SendGrid интеграцией и автоответами",
                    "brand-mention-monitor": "Создать систему мониторинга упоминаний бренда в новостях, блогах и форумах",
                    "data-formatter": "Собрать сервис нормализации CSV/Excel с маппингом полей и предпросмотром преобразований",
                    "mini-etl-pipeline": "Создать mini-ETL конвейер с шагами Extract/Transform/Load и аналитикой выполнения",
                    "price-stock-parser": "Сделать мониторинг цен и наличия товаров по SKU с алертами и историей изменений"
                }
                description = template_descriptions.get(template, f"Создать MVP на основе шаблона {template}")

            result = await generator.generate_mvp(description)
            log_agent_action("MVP", f"✅ MVP created: {result['deploy_url']}")

            return {
                "status": "success",
                "template": result["template"],
                "deployUrl": result["deploy_url"],
                "projectName": result["project_name"],
                "repository": result.get("repository", result["project_name"]),
                "confidence": result["confidence"],
                "buildType": build_type,
                "message": "MVP успешно создан и развернут"
            }

        except ImportError:
            # Fallback to mock response if Agent B is not available
            log_agent_action("MVP", "⚠️ Agent B not available, using mock mode")

            import time
            await asyncio.sleep(3)  # Simulate work

            deploy_url = f"https://ai-mvp-{template}-{int(time.time())}.vercel.app"
            log_agent_action("MVP", f"✅ MVP created (mock): {deploy_url}")

            return {
                "status": "success",
                "template": template,
                "deployUrl": deploy_url,
                "buildType": build_type,
                "message": f"MVP успешно создан (mock mode)"
            }

    except Exception as e:
        # Expand error with possible HTTP response body for diagnostics
        err_msg = str(e)
        try:
            if hasattr(e, "response") and e.response is not None:
                err_msg = f"{err_msg} | {e.response.text}"
        except Exception:
            pass
        log_agent_action("MVP", f"❌ MVP generation failed: {err_msg}")
        return {"status": "error", "error": err_msg}

@app.post("/api/improve-mvp")
async def improve_mvp(request: Request):
    """Improve existing MVP based on user command"""
    try:
        data = await request.json()
        repository = data.get("repository", "").strip()
        command = data.get("command", "").strip()

        if not repository:
            return {"status": "error", "error": "Репозиторий не указан"}

        if not command:
            return {"status": "error", "error": "Команда для доработки не указана"}

        log_agent_action("MVP", f"🔧 Improving MVP: {repository}")
        log_agent_action("MVP", f"📝 Command: {command}")

        # Import and use MVP generator
        try:
            from mvp_generator import MVPGenerator
            generator = MVPGenerator()

            result = await generator.improve_mvp(repository, command)
            log_agent_action("MVP", f"✅ MVP improved: {result['message']}")

            return {
                "status": "success",
                "repository": result["repository"],
                "files_updated": result["files_updated"],
                "total_files": result["total_files"],
                "message": result["message"]
            }

        except ImportError:
            # Fallback to mock response if Agent B is not available
            log_agent_action("MVP", "⚠️ Agent B not available, using mock mode")
            await asyncio.sleep(2)  # Simulate work

            return {
                "status": "success",
                "repository": repository,
                "files_updated": 1,
                "total_files": 1,
                "message": f"MVP успешно доработан (mock mode)"
            }

    except Exception as e:
        err_msg = str(e)
        log_agent_action("MVP", f"❌ MVP improvement failed: {err_msg}")
        return {"status": "error", "error": err_msg}

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    return {"status": "healthy", "service": "agent-a"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production
        log_level=config.LOG_LEVEL.lower()
    )
