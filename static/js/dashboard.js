// Dashboard JavaScript for real-time updates with separated Agent A and B panels
class Dashboard {
    constructor() {
        this.eventSource = null;
        
        // Agent A elements
        this.logsContainerA = document.getElementById('logs-a');
        this.logsContainerB = document.getElementById('logs-b');
        this.agentAStatus = document.getElementById('agent-a-status');
        this.agentBStatus = document.getElementById('agent-b-status');
        this.projectsCount = document.getElementById('projects-count');
        this.suitableCount = document.getElementById('suitable-count');
        this.lastCheck = document.getElementById('last-check');
        this.startBtn = document.getElementById('start-btn');
        this.runSessionBtn = document.getElementById('run-session-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.clearLogsBtnA = document.getElementById('clear-logs-a');
        this.clearLogsBtnB = document.getElementById('clear-logs-b');
        this.sessionInfo = document.getElementById('session-info');
        this.sessionTime = document.getElementById('session-time');
        this.sessionStep = document.getElementById('session-step');

        // Agent B (MVP) elements
        this.mvpTemplate = document.getElementById('mvp-template');
        this.projectDescription = document.getElementById('project-description');
        this.generateMvpBtn = document.getElementById('generate-mvp-btn');
        this.mvpStatus = document.getElementById('mvp-status');
        this.buildTypeInputs = document.querySelectorAll('input[name="build-type"]');

        // Log queues for each agent
        this.logQueueA = [];
        this.logQueueB = [];
        this.isProcessingLogsA = false;
        this.isProcessingLogsB = false;
        this.logProcessTimerA = null;
        this.logProcessTimerB = null;
        this.maxLogEntries = 1000;

        this.init();
    }

    init() {
        this.setupNavigation();
        this.bindEvents();
        this.updateMVPButtonText();
        // Load status immediately on init
        this.updateStatus().then(() => {
            // Start log stream after status is loaded
            this.startLogStream();
            // Update session info every second
            setInterval(() => this.updateSessionInfo(), 1000);
        });
    }

    setupNavigation() {
        // Setup navigation for Agent A
        const navButtonsA = document.querySelectorAll('.agent-a-nav .nav-btn');
        navButtonsA.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab('a', tab);
            });
        });

        // Setup navigation for Agent B
        const navButtonsB = document.querySelectorAll('.agent-b-nav .nav-btn');
        navButtonsB.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab('b', tab);
            });
        });
    }

    switchTab(agent, tabName) {
        // Update navigation buttons
        const nav = document.querySelector(`.agent-${agent}-nav`);
        const buttons = nav.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        const content = document.querySelector(`.agent-${agent}-panel .agent-content`);
        const tabs = content.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === `tab-${tabName}`) {
                tab.classList.add('active');
            }
        });
    }

    bindEvents() {
        // Agent A events
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startAgent());
        }
        if (this.runSessionBtn) {
            this.runSessionBtn.addEventListener('click', () => this.runSingleSession());
        }
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopAgent());
        }
        if (this.clearLogsBtnA) {
            this.clearLogsBtnA.addEventListener('click', () => this.clearLogs('a'));
        }
        if (this.clearLogsBtnB) {
            this.clearLogsBtnB.addEventListener('click', () => this.clearLogs('b'));
        }

        // Agent B (MVP) events
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
            }, { immediate: true, agent: 'a' });

            // Auto-reconnect after 5 seconds
            setTimeout(() => {
                if (this.eventSource && this.eventSource.readyState === EventSource.CLOSED) {
                    this.startLogStream();
                }
            }, 5000);
        };

        // Initial connection message
        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Dashboard connected to log stream',
            module: 'dashboard'
        }, { immediate: true, agent: 'a' });
    }

    addLogEntry(logData, options = {}) {
        if (!logData) {
            return;
        }

        const { immediate = false, agent = null } = options;

        // Determine which agent this log belongs to
        let targetAgent = agent;
        if (!targetAgent) {
            const message = logData.message || '';
            const module = logData.module || '';
            
            // Check if it's Agent B log
            if (message.includes('Agent B') || 
                message.includes('MVP') || 
                module === 'MVP' ||
                message.includes('🎯') ||
                message.includes('🚀 MVP')) {
                targetAgent = 'b';
            } else {
                // Default to Agent A
                targetAgent = 'a';
            }
        }

        if (immediate) {
            this.renderLogEntry(logData, targetAgent);
            return;
        }

        // Add to appropriate queue
        if (targetAgent === 'a') {
            this.logQueueA.push(logData);
            if (this.logQueueA.length > this.maxLogEntries) {
                this.logQueueA.splice(0, this.logQueueA.length - this.maxLogEntries);
            }
            if (!this.isProcessingLogsA) {
                this.isProcessingLogsA = true;
                this.processLogQueue('a');
            }
        } else {
            this.logQueueB.push(logData);
            if (this.logQueueB.length > this.maxLogEntries) {
                this.logQueueB.splice(0, this.logQueueB.length - this.maxLogEntries);
            }
            if (!this.isProcessingLogsB) {
                this.isProcessingLogsB = true;
                this.processLogQueue('b');
            }
        }
    }

    processLogQueue(agent) {
        const queue = agent === 'a' ? this.logQueueA : this.logQueueB;
        const timer = agent === 'a' ? 'logProcessTimerA' : 'logProcessTimerB';
        const isProcessing = agent === 'a' ? 'isProcessingLogsA' : 'isProcessingLogsB';

        if (queue.length === 0) {
            this[isProcessing] = false;
            this[timer] = null;
            return;
        }

        const logData = queue.shift();
        this.renderLogEntry(logData, agent);

        const delay = this.calculateLogDelay(queue.length);
        this[timer] = setTimeout(() => this.processLogQueue(agent), delay);
    }

    calculateLogDelay(backlog) {
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

    renderLogEntry(logData, agent) {
        const container = agent === 'a' ? this.logsContainerA : this.logsContainerB;
        if (!container) {
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
        } else if (message.includes('Agent B') || message.includes('MVP') || message.includes('🎯')) {
            entry.style.color = '#9b59b6';
            entry.style.borderLeftColor = '#9b59b6';
            entry.style.fontWeight = '500';
        }

        // Format log entry
        entry.textContent = `${timestamp} │ ${level} │ ${module} ${message}`;

        container.appendChild(entry);
        // Auto-scroll to bottom
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });

        // Keep only last 1000 entries
        while (container.children.length > this.maxLogEntries) {
            container.removeChild(container.firstChild);
        }
        
        // Extract session step for Agent A
        if (agent === 'a') {
            this.extractSessionStep(message);
        }
    }
    
    extractSessionStep(message) {
        if (!this.sessionStep) return;
        
        if (message.includes('Step 1/3')) {
            this.sessionStep.textContent = 'Step 1/3: Searching projects...';
        } else if (message.includes('Step 2/3')) {
            this.sessionStep.textContent = 'Step 2/3: Evaluating projects...';
        } else if (message.includes('Step 3/3')) {
            this.sessionStep.textContent = 'Step 3/3: Sending notifications...';
        } else if (message.includes('[SELENIUM]')) {
            const match = message.match(/\[SELENIUM\]\s+(.+?)(?:\s+|$)/);
            if (match) {
                const action = match[1].replace(/[🔧✅⚠️❌🌐👁️⏱️💰📄🔍]/g, '').trim();
                this.sessionStep.textContent = `Selenium: ${action.substring(0, 40)}...`;
            }
        } else if (message.includes('[SESSION]')) {
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

            // Update Agent A status
            if (this.agentAStatus) {
                const statusText = this.formatStatus(data.agent_a_status);
                this.agentAStatus.textContent = statusText;
                this.agentAStatus.className = `status-indicator status-${data.agent_a_status}`;
            }

            // Update Agent B status (always ready for now)
            if (this.agentBStatus) {
                this.agentBStatus.textContent = 'Готов';
                this.agentBStatus.className = 'status-indicator status-stopped';
            }

            // Update buttons based on running status
            if (this.startBtn && this.runSessionBtn && this.stopBtn) {
                if (data.is_running) {
                    this.startBtn.disabled = true;
                    this.runSessionBtn.disabled = true;
                    this.stopBtn.disabled = false;
                } else if (data.agent_a_status === 'running') {
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

        // Update every 2 seconds
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
                if (this.sessionStep) {
                    this.sessionStep.textContent = `Step ${data.current_session.steps || 0}`;
                }
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
                }, { immediate: true, agent: 'a' });
                await this.updateStatus();
            } else if (data.status === 'already_running') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'WARNING',
                    message: `⚠️ ${data.message}`,
                    module: 'dashboard'
                }, { immediate: true, agent: 'a' });
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
            }, { immediate: true, agent: 'a' });
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
                }, { immediate: true, agent: 'a' });
                await this.updateStatus();
            } else if (data.status === 'busy') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'WARNING',
                    message: `⚠️ ${data.message}`,
                    module: 'dashboard'
                }, { immediate: true, agent: 'a' });
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
            }, { immediate: true, agent: 'a' });
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
                }, { immediate: true, agent: 'a' });
            } else {
                throw new Error(data.message);
            }

        } catch (error) {
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `Failed to stop agent: ${error.message}`,
                module: 'dashboard'
            }, { immediate: true, agent: 'a' });
            if (this.stopBtn) {
                this.stopBtn.disabled = false;
                this.stopBtn.textContent = '⏹️ Остановить';
            }
        }
    }

    clearLogs(agent) {
        const queue = agent === 'a' ? this.logQueueA : this.logQueueB;
        const timer = agent === 'a' ? 'logProcessTimerA' : 'logProcessTimerB';
        const isProcessing = agent === 'a' ? 'isProcessingLogsA' : 'isProcessingLogsB';
        const container = agent === 'a' ? this.logsContainerA : this.logsContainerB;

        if (this[timer]) {
            clearTimeout(this[timer]);
            this[timer] = null;
        }
        queue.length = 0;
        if (container) {
            container.innerHTML = '';
        }
        this[isProcessing] = false;

        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `Logs cleared for Agent ${agent.toUpperCase()}`,
            module: 'dashboard'
        }, { immediate: true, agent });
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

            // Update Agent B status
            if (this.agentBStatus) {
                this.agentBStatus.textContent = '🔄 Генерирует';
                this.agentBStatus.className = 'status-indicator status-running';
            }

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
        } finally {
            // Reset Agent B status
            if (this.agentBStatus) {
                this.agentBStatus.textContent = 'Готов';
                this.agentBStatus.className = 'status-indicator status-stopped';
            }
        }
    }

    showMVPSuccess(result) {
        this.mvpStatus.textContent = `✅ MVP успешно создан! Ссылка: ${result.deployUrl}`;
        this.mvpStatus.className = 'mvp-status success';

        // Add success log to Agent B
        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `🚀 MVP создан: ${result.template} → ${result.deployUrl}`,
            module: 'MVP'
        }, { immediate: true, agent: 'b' });

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

        // Add error log to Agent B
        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: `❌ MVP generation failed: ${message}`,
            module: 'MVP'
        }, { immediate: true, agent: 'b' });

        this.generateMvpBtn.disabled = false;
    }

    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.logProcessTimerA) {
            clearTimeout(this.logProcessTimerA);
            this.logProcessTimerA = null;
        }
        if (this.logProcessTimerB) {
            clearTimeout(this.logProcessTimerB);
            this.logProcessTimerB = null;
        }
        this.logQueueA = [];
        this.logQueueB = [];
        this.isProcessingLogsA = false;
        this.isProcessingLogsB = false;
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
