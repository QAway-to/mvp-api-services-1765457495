// Dashboard JavaScript for real-time updates
class Dashboard {
    constructor() {
        this.eventSource = null;
        this.logsContainer = document.getElementById('logs');
        this.agentStatus = document.getElementById('agent-status');
        this.projectsCount = document.getElementById('projects-count');
        this.suitableCount = document.getElementById('suitable-count');
        this.lastCheck = document.getElementById('last-check');
        this.startBtn = document.getElementById('start-btn');
        this.runSessionBtn = document.getElementById('run-session-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.clearLogsBtn = document.getElementById('clear-logs');
        this.sessionInfo = document.getElementById('session-info');
        this.sessionTime = document.getElementById('session-time');
        this.sessionStep = document.getElementById('session-step');

        // MVP generation elements
        this.mvpTemplate = document.getElementById('mvp-template');
        this.projectDescription = document.getElementById('project-description');
        this.generateMvpBtn = document.getElementById('generate-mvp-btn');
        this.mvpStatus = document.getElementById('mvp-status');
        this.buildTypeInputs = document.querySelectorAll('input[name="build-type"]');

        // Log queue for step-by-step rendering
        this.logQueue = [];
        this.isProcessingLogs = false;
        this.logProcessTimer = null;
        this.maxLogEntries = 1000;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateMVPButtonText(); // Initialize button text if controls exist
        // Load status immediately on init
        this.updateStatus().then(() => {
            // Start log stream after status is loaded
            this.startLogStream();
            // Update session info every second
            setInterval(() => this.updateSessionInfo(), 1000);
        });
    }

    bindEvents() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startAgent());
        }
        if (this.runSessionBtn) {
            this.runSessionBtn.addEventListener('click', () => this.runSingleSession());
        }
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopAgent());
        }
        if (this.clearLogsBtn) {
            this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        }

        // MVP generation events
        if (this.generateMvpBtn) {
            this.generateMvpBtn.addEventListener('click', () => this.generateMVP());
        }
        if (this.mvpTemplate) {
            this.mvpTemplate.addEventListener('change', () => this.updateMVPStatus());
        }
        if (this.projectDescription) {
            this.projectDescription.addEventListener('input', () => this.updateMVPStatus());
        }

        // Build type change events
        if (this.buildTypeInputs && this.buildTypeInputs.length) {
            this.buildTypeInputs.forEach(input => {
                input.addEventListener('change', () => this.updateMVPButtonText());
            });
        }
    }

    startLogStream() {
        this.eventSource = new EventSource('/logs/stream');

        this.eventSource.onmessage = (event) => {
            try {
                const logData = JSON.parse(event.data);
                this.addLogEntry(logData);
            } catch (e) {
                console.error('Error parsing log data:', e);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: 'Connection to log stream lost. Retrying...',
                module: 'dashboard'
            }, { immediate: true });

            // Auto-reconnect after 5 seconds
            setTimeout(() => {
                if (this.eventSource && this.eventSource.readyState === EventSource.CLOSED) {
                    this.startLogStream();
                }
            }, 5000);
        };

        // Initial connection message (show immediately)
        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Dashboard connected to log stream',
            module: 'dashboard'
        }, { immediate: true });
    }

    addLogEntry(logData, options = {}) {
        if (!logData) {
            return;
        }

        const { immediate = false } = options;

        if (immediate || !this.logsContainer) {
            this.renderLogEntry(logData);
            return;
        }

        this.logQueue.push(logData);

        // Prevent queue from growing without bounds
        if (this.logQueue.length > this.maxLogEntries) {
            this.logQueue.splice(0, this.logQueue.length - this.maxLogEntries);
        }

        if (!this.isProcessingLogs) {
            this.isProcessingLogs = true;
            this.processLogQueue();
        }
    }

    processLogQueue() {
        if (this.logQueue.length === 0) {
            this.isProcessingLogs = false;
            this.logProcessTimer = null;
            return;
        }

        const logData = this.logQueue.shift();
        this.renderLogEntry(logData);

        const delay = this.calculateLogDelay();
        this.logProcessTimer = setTimeout(() => this.processLogQueue(), delay);
    }

    calculateLogDelay() {
        const backlog = this.logQueue.length;
        if (backlog > 80) {
            return 30;
        }
        if (backlog > 30) {
            return 70;
        }
        if (backlog > 10) {
            return 130;
        }
        return 250;
    }

    renderLogEntry(logData) {
        if (!this.logsContainer) {
            return;
        }

        const entry = document.createElement('div');
        entry.className = `log-entry log-${logData.level.toLowerCase()}`;

        const timestamp = new Date(logData.timestamp).toLocaleTimeString();
        const level = logData.level.padEnd(8);
        const module = logData.module ? `[${logData.module}]` : '';
        let message = logData.message;

        // Highlight different log types with specific colors
        if (message.includes('[SELENIUM]')) {
            entry.style.color = '#4fc3f7';
            entry.style.borderLeftColor = '#4fc3f7';
            entry.style.fontWeight = '500';
        } else if (message.includes('[SESSION]')) {
            entry.style.color = '#ba68c8';
            entry.style.borderLeftColor = '#ba68c8';
            entry.style.fontWeight = '500';
        } else if (message.includes('[DEMO]')) {
            entry.style.color = '#ffb74d';
            entry.style.borderLeftColor = '#ffb74d';
            entry.style.fontWeight = '500';
        } else if (message.includes('[EVALUATION]')) {
            entry.style.color = '#81c784';
            entry.style.borderLeftColor = '#81c784';
        } else if (message.includes('[TELEGRAM]')) {
            entry.style.color = '#64b5f6';
            entry.style.borderLeftColor = '#64b5f6';
        }

        // Format log entry with better spacing
        entry.textContent = `${timestamp} │ ${level} │ ${module} ${message}`;

        this.logsContainer.appendChild(entry);
        // Auto-scroll to bottom with smooth behavior
        this.logsContainer.scrollTo({
            top: this.logsContainer.scrollHeight,
            behavior: 'smooth'
        });

        // Keep only last 1000 entries to prevent memory issues
        while (this.logsContainer.children.length > this.maxLogEntries) {
            this.logsContainer.removeChild(this.logsContainer.firstChild);
        }
        
        // Try to extract current step from message for session info
        this.extractSessionStep(message);
    }
    
    extractSessionStep(message) {
        // Extract step information from log messages
        if (message.includes('Step 1/3')) {
            this.sessionStep.textContent = 'Step 1/3: Searching projects...';
        } else if (message.includes('Step 2/3')) {
            this.sessionStep.textContent = 'Step 2/3: Evaluating projects...';
        } else if (message.includes('Step 3/3')) {
            this.sessionStep.textContent = 'Step 3/3: Sending notifications...';
        } else if (message.includes('[SELENIUM]')) {
            // Extract action from Selenium logs
            const match = message.match(/\[SELENIUM\]\s+(.+?)(?:\s+|$)/);
            if (match) {
                const action = match[1].replace(/[🔧✅⚠️❌🌐👁️⏱️💰📄🔍]/g, '').trim();
                this.sessionStep.textContent = `Selenium: ${action.substring(0, 40)}...`;
            }
        } else if (message.includes('[SESSION]')) {
            // Extract session step
            const match = message.match(/\[SESSION\]\s+(.+?)(?:\s+|$)/);
            if (match) {
                const action = match[1].replace(/[🚀🔍📊⏱️✅❌📈]/g, '').trim();
                this.sessionStep.textContent = `Session: ${action.substring(0, 40)}...`;
            }
        } else if (message.includes('[EVALUATION]')) {
            this.sessionStep.textContent = 'Evaluation: Processing projects...';
        } else if (message.includes('[DEMO]')) {
            this.sessionStep.textContent = 'Demo: Generating projects...';
        }
    }

    async updateStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();

            if (this.agentStatus) {
                // Update agent status
                this.agentStatus.textContent = this.formatStatus(data.agent_a_status);
                this.agentStatus.className = `status-${data.agent_a_status}`;
            }

            // Update buttons based on running status
            if (this.startBtn && this.runSessionBtn && this.stopBtn) {
                if (data.is_running) {
                    this.startBtn.disabled = true;
                    this.runSessionBtn.disabled = true;
                    this.stopBtn.disabled = false;
                } else if (data.agent_a_status === 'running') {
                    // Session is running but not continuous
                    this.startBtn.disabled = true;
                    this.runSessionBtn.disabled = true;
                    this.stopBtn.disabled = false;
                } else {
                    this.startBtn.disabled = false;
                    this.runSessionBtn.disabled = false;
                    this.stopBtn.disabled = true;
                }
            }

            if (this.projectsCount) {
                this.projectsCount.textContent = data.projects_found || 0;
            }
            if (this.suitableCount) {
                this.suitableCount.textContent = data.suitable_projects || 0;
            }
            if (this.lastCheck) {
                this.lastCheck.textContent = data.last_check ?
                    new Date(data.last_check).toLocaleString() : '-';
            }

            if (data.current_session && this.sessionInfo) {
                this.sessionInfo.style.display = 'block';
                this.updateSessionInfo();
            } else if (this.sessionInfo) {
                this.sessionInfo.style.display = 'none';
            }

        } catch (error) {
            console.error('Error updating status:', error);
        }

        // Update every 2 seconds for more responsive UI
        setTimeout(() => this.updateStatus(), 2000);
    }
    
    async updateSessionInfo() {
        try {
            const response = await fetch('/status');
            const data = await response.json();

            if (data.current_session && this.sessionTime) {
                const elapsed = data.current_session.elapsed_seconds;
                const minutes = Math.floor(elapsed / 60);
                const seconds = Math.floor(elapsed % 60);
                this.sessionTime.textContent = `${minutes}m ${seconds}s`;
                this.sessionStep.textContent = `Step ${data.current_session.steps || 0}`;
            }
        } catch (error) {
            // Silently fail
        }
    }

    formatStatus(status) {
        const statusMap = {
            'running': '🔄 Работает',
            'stopped': '⏹️ Остановлен',
            'waiting': '⏳ Ожидает',
            'error': '❌ Ошибка'
        };
        return statusMap[status] || status;
    }

    async startAgent() {
        try {
            if (this.startBtn) {
                this.startBtn.disabled = true;
                this.startBtn.textContent = '⏳ Запуск...';
            }

            const response = await fetch('/agent/start', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'started') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: '✅ Continuous agent started successfully',
                    module: 'dashboard'
                });
                await this.updateStatus();
            } else if (data.status === 'already_running') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'WARNING',
                    message: `⚠️ ${data.message}`,
                    module: 'dashboard'
                });
                if (this.startBtn) {
                    this.startBtn.disabled = false;
                    this.startBtn.textContent = '▶️ Запустить (Continuous)';
                }
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `❌ Failed to start agent: ${error.message}`,
                module: 'dashboard'
            });
            if (this.startBtn) {
                this.startBtn.disabled = false;
                this.startBtn.textContent = '▶️ Запустить (Continuous)';
            }
        }
    }
    
    async runSingleSession() {
        try {
            if (this.runSessionBtn) {
                this.runSessionBtn.disabled = true;
                this.runSessionBtn.textContent = '⏳ Запуск сессии...';
            }

            const response = await fetch('/agent/run-session', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'session_started') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: '🚀 Single session started successfully',
                    module: 'dashboard'
                });
                await this.updateStatus();
            } else if (data.status === 'busy') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'WARNING',
                    message: `⚠️ ${data.message}`,
                    module: 'dashboard'
                });
                if (this.runSessionBtn) {
                    this.runSessionBtn.disabled = false;
                    this.runSessionBtn.textContent = '🚀 Запустить одну сессию';
                }
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `❌ Failed to start session: ${error.message}`,
                module: 'dashboard'
            });
            if (this.runSessionBtn) {
                this.runSessionBtn.disabled = false;
                this.runSessionBtn.textContent = '🚀 Запустить одну сессию';
            }
        }
    }

    async stopAgent() {
        try {
            if (this.stopBtn) {
                this.stopBtn.disabled = true;
                this.stopBtn.textContent = '⏳ Остановка...';
            }

            const response = await fetch('/agent/stop', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'stopped') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: 'Agent stopped successfully',
                    module: 'dashboard'
                });
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `Failed to stop agent: ${error.message}`,
                module: 'dashboard'
            });
            if (this.stopBtn) {
                this.stopBtn.disabled = false;
                this.stopBtn.textContent = '⏹️ Остановить';
            }
        }
    }

    clearLogs() {
        if (this.logProcessTimer) {
            clearTimeout(this.logProcessTimer);
            this.logProcessTimer = null;
        }
        this.logQueue = [];
        if (this.logsContainer) {
            this.logsContainer.innerHTML = '';
        }
        this.isProcessingLogs = false;

        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Logs cleared',
            module: 'dashboard'
        }, { immediate: true });
    }

    // MVP Generation Methods
    updateMVPStatus() {
        if (!this.generateMvpBtn || !this.mvpStatus) {
            return;
        }

        const template = this.mvpTemplate ? this.mvpTemplate.value : '';
        const description = this.projectDescription ? this.projectDescription.value.trim() : '';

        if (!template) {
            this.mvpStatus.textContent = 'Выберите шаблон MVP выше';
            this.mvpStatus.className = 'mvp-status';
            this.generateMvpBtn.disabled = true;
        } else if (description && description.length < 10) {
            this.mvpStatus.textContent = 'Описание слишком короткое (минимум 10 символов)';
            this.mvpStatus.className = 'mvp-status error';
            this.generateMvpBtn.disabled = true;
        } else {
            this.mvpStatus.textContent = 'Готово к генерации MVP';
            this.mvpStatus.className = 'mvp-status success';
            this.generateMvpBtn.disabled = false;
        }
        this.updateMVPButtonText();
    }

    updateMVPButtonText() {
        if (!this.generateMvpBtn) {
            return;
        }
        const buildType = this.getSelectedBuildType();
        const buildTypeText = buildType === 'mock' ? 'Моковый MVP' : 'Полный MVP';
        const emoji = buildType === 'mock' ? '🎭' : '🚀';
        this.generateMvpBtn.innerHTML = `${emoji} Сгенерировать ${buildTypeText}`;
    }

    getSelectedBuildType() {
        const selectedInput = document.querySelector('input[name="build-type"]:checked');
        return selectedInput ? selectedInput.value : 'mock';
    }

    async generateMVP() {
        const template = this.mvpTemplate ? this.mvpTemplate.value : '';
        const description = this.projectDescription ? this.projectDescription.value.trim() : '';
        const buildType = this.getSelectedBuildType();

        if (!template) {
            this.showMVPError('Выберите шаблон MVP');
            return;
        }

        if (description && description.length < 10) {
            this.showMVPError('Описание проекта слишком короткое');
            return;
        }

        try {
            // Update UI
            this.generateMvpBtn.disabled = true;
            const buildTypeText = buildType === 'mock' ? 'мокового' : 'полного';
            this.mvpStatus.textContent = `Генерация ${buildTypeText} MVP...`;
            this.mvpStatus.className = 'mvp-status loading';

            // Send request to generate MVP
            const response = await fetch('/api/generate-mvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template: template,
                    description: description,
                    buildType: buildType,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showMVPSuccess(result);
            } else {
                throw new Error(result.error || 'Неизвестная ошибка');
            }

        } catch (error) {
            console.error('MVP generation error:', error);
            this.showMVPError(error.message);
        }
    }

    showMVPSuccess(result) {
        this.mvpStatus.textContent = `✅ MVP успешно создан! Ссылка: ${result.deployUrl}`;
        this.mvpStatus.className = 'mvp-status success';

        // Add success log
        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `🚀 MVP создан: ${result.template} → ${result.deployUrl}`,
            module: 'MVP'
        });

        // Clear description after success
        setTimeout(() => {
            if (this.projectDescription) {
                this.projectDescription.value = '';
                this.updateMVPStatus();
            }
        }, 3000);

        this.generateMvpBtn.disabled = false;
    }

    showMVPError(message) {
        this.mvpStatus.textContent = `❌ Ошибка: ${message}`;
        this.mvpStatus.className = 'mvp-status error';

        // Add error log
        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: `❌ MVP generation failed: ${message}`,
            module: 'MVP'
        });

        this.generateMvpBtn.disabled = false;
    }

    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.logProcessTimer) {
            clearTimeout(this.logProcessTimer);
            this.logProcessTimer = null;
        }
        this.logQueue = [];
        this.isProcessingLogs = false;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});
