// Compact Dashboard JavaScript
class Dashboard {
    constructor() {
        this.eventSource = null;
        
        // Agent A elements
        this.agentAStatus = document.getElementById('agent-a-status');
        this.projectsCount = document.getElementById('projects-count');
        this.suitableCount = document.getElementById('suitable-count');
        this.startBtn = document.getElementById('start-btn');
        this.runSessionBtn = document.getElementById('run-session-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.resultsA = document.getElementById('results-a');

        // Agent B elements
        this.agentBStatus = document.getElementById('agent-b-status');
        this.mvpTemplate = document.getElementById('mvp-template');
        this.generateMvpBtn = document.getElementById('generate-mvp-btn');
        this.mvpStatus = document.getElementById('mvp-status');
        this.resultsB = document.getElementById('results-b');

        // Logs
        this.logsContainer = document.getElementById('logs');
        this.clearLogsBtn = document.getElementById('clear-logs');

        // Log queue
        this.logQueue = [];
        this.isProcessingLogs = false;
        this.logProcessTimer = null;
        this.maxLogEntries = 500;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStatus().then(() => {
            this.startLogStream();
            setInterval(() => this.updateStatus(), 2000);
        });
    }

    bindEvents() {
        // Agent A
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startAgent());
        }
        if (this.runSessionBtn) {
            this.runSessionBtn.addEventListener('click', () => this.runSingleSession());
        }
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopAgent());
        }

        // Agent B
        if (this.generateMvpBtn) {
            this.generateMvpBtn.addEventListener('click', () => this.generateMVP());
        }
        if (this.mvpTemplate) {
            this.mvpTemplate.addEventListener('change', () => this.updateMVPButton());
        }

        // Logs
        if (this.clearLogsBtn) {
            this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
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

            setTimeout(() => {
                if (this.eventSource && this.eventSource.readyState === EventSource.CLOSED) {
                    this.startLogStream();
                }
            }, 5000);
        };

        this.addLogEntry({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Dashboard connected to log stream',
            module: 'dashboard'
        }, { immediate: true });
    }

    addLogEntry(logData, options = {}) {
        if (!logData) return;

        const { immediate = false } = options;

        if (immediate) {
            this.renderLogEntry(logData);
            return;
        }

        this.logQueue.push(logData);
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

        const delay = this.calculateLogDelay(this.logQueue.length);
        this.logProcessTimer = setTimeout(() => this.processLogQueue(), delay);
    }

    calculateLogDelay(backlog) {
        if (backlog > 50) return 20;
        if (backlog > 20) return 50;
        if (backlog > 10) return 100;
        return 200;
    }

    renderLogEntry(logData) {
        if (!this.logsContainer) return;

        const entry = document.createElement('div');
        entry.className = `log-entry log-${logData.level.toLowerCase()}`;

        const timestamp = new Date(logData.timestamp).toLocaleTimeString();
        const level = logData.level.padEnd(6);
        const module = logData.module ? `[${logData.module}]` : '';
        const message = logData.message;

        // Color coding
        if (message.includes('Agent A')) {
            entry.style.color = '#4fc3f7';
        } else if (message.includes('Agent B') || message.includes('MVP')) {
            entry.style.color = '#9b59b6';
        }

        entry.textContent = `${timestamp} │ ${level} │ ${module} ${message}`;
        this.logsContainer.appendChild(entry);

        // Auto-scroll
        this.logsContainer.scrollTo({
            top: this.logsContainer.scrollHeight,
            behavior: 'smooth'
        });

        // Limit entries
        while (this.logsContainer.children.length > this.maxLogEntries) {
            this.logsContainer.removeChild(this.logsContainer.firstChild);
        }

        // Update results based on log content
        this.updateResultsFromLog(logData);
    }

    updateResultsFromLog(logData) {
        const message = logData.message || '';
        
        // Agent A results
        if (message.includes('Agent A') && message.includes('Suitable project')) {
            this.addResultA(message);
        }
        
        // Agent B results
        if (message.includes('Agent B') && (message.includes('MVP created') || message.includes('deploy_url'))) {
            this.addResultB(message);
        }
    }

    addResultA(message) {
        if (!this.resultsA) return;
        
        // Remove empty state
        const emptyState = this.resultsA.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const result = document.createElement('div');
        result.className = 'result-item';
        result.textContent = message;
        result.style.padding = '4px 0';
        result.style.borderBottom = '1px solid #e5e7eb';
        result.style.fontSize = '0.75em';
        
        this.resultsA.appendChild(result);
        this.resultsA.scrollTop = this.resultsA.scrollHeight;
    }

    addResultB(message) {
        if (!this.resultsB) return;
        
        const emptyState = this.resultsB.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const result = document.createElement('div');
        result.className = 'result-item';
        result.textContent = message;
        result.style.padding = '4px 0';
        result.style.borderBottom = '1px solid #e5e7eb';
        result.style.fontSize = '0.75em';
        result.style.color = '#9b59b6';
        
        this.resultsB.appendChild(result);
        this.resultsB.scrollTop = this.resultsB.scrollHeight;
    }

    async updateStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();

            // Agent A status
            if (this.agentAStatus) {
                const statusText = this.formatStatus(data.agent_a_status);
                this.agentAStatus.textContent = statusText;
                this.agentAStatus.className = `status-badge status-${data.agent_a_status}`;
            }

            // Agent B status
            if (this.agentBStatus) {
                this.agentBStatus.textContent = 'Готов';
                this.agentBStatus.className = 'status-badge status-stopped';
            }

            // Buttons
            if (this.startBtn && this.runSessionBtn && this.stopBtn) {
                if (data.is_running || data.agent_a_status === 'running') {
                    this.startBtn.disabled = true;
                    this.runSessionBtn.disabled = true;
                    this.stopBtn.disabled = false;
                } else {
                    this.startBtn.disabled = false;
                    this.runSessionBtn.disabled = false;
                    this.stopBtn.disabled = true;
                }
            }

            // Stats
            if (this.projectsCount) {
                this.projectsCount.textContent = data.projects_found || 0;
            }
            if (this.suitableCount) {
                this.suitableCount.textContent = data.suitable_projects || 0;
            }

        } catch (error) {
            console.error('Error updating status:', error);
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
            this.startBtn.disabled = true;
            this.startBtn.textContent = '⏳...';

            const response = await fetch('/agent/start', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'started') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: '✅ Agent A started',
                    module: 'dashboard'
                }, { immediate: true });
            } else {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'WARNING',
                    message: `⚠️ ${data.message}`,
                    module: 'dashboard'
                }, { immediate: true });
            }

            await this.updateStatus();
        } catch (error) {
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `❌ Failed to start: ${error.message}`,
                module: 'dashboard'
            }, { immediate: true });
        } finally {
            if (this.startBtn) {
                this.startBtn.disabled = false;
                this.startBtn.textContent = '▶️ Запустить';
            }
        }
    }
    
    async runSingleSession() {
        try {
            this.runSessionBtn.disabled = true;
            this.runSessionBtn.textContent = '⏳...';

            const response = await fetch('/agent/run-session', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'session_started') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: '🚀 Session started',
                    module: 'dashboard'
                }, { immediate: true });
            }

            await this.updateStatus();
        } catch (error) {
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `❌ Session failed: ${error.message}`,
                module: 'dashboard'
            }, { immediate: true });
        } finally {
            if (this.runSessionBtn) {
                this.runSessionBtn.disabled = false;
                this.runSessionBtn.textContent = '🚀 Сессия';
            }
        }
    }

    async stopAgent() {
        try {
            this.stopBtn.disabled = true;
            this.stopBtn.textContent = '⏳...';

            const response = await fetch('/agent/stop', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'stopped') {
                this.addLogEntry({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: 'Agent stopped',
                    module: 'dashboard'
                }, { immediate: true });
            }

            await this.updateStatus();
        } catch (error) {
            this.addLogEntry({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: `Failed to stop: ${error.message}`,
                module: 'dashboard'
            }, { immediate: true });
        } finally {
            if (this.stopBtn) {
                this.stopBtn.disabled = false;
                this.stopBtn.textContent = '⏹️ Стоп';
            }
        }
    }

    updateMVPButton() {
        if (!this.generateMvpBtn || !this.mvpTemplate) return;
        this.generateMvpBtn.disabled = !this.mvpTemplate.value;
    }

    async generateMVP() {
        const template = this.mvpTemplate ? this.mvpTemplate.value : '';
        if (!template) return;

        try {
            this.generateMvpBtn.disabled = true;
            this.mvpStatus.textContent = 'Генерация...';
            this.mvpStatus.className = 'status-message loading';

            if (this.agentBStatus) {
                this.agentBStatus.textContent = '🔄 Генерирует';
                this.agentBStatus.className = 'status-badge status-running';
            }

            const response = await fetch('/api/generate-mvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: template,
                    description: '',
                    buildType: 'mock',
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.mvpStatus.textContent = `✅ MVP создан: ${result.deployUrl}`;
                this.mvpStatus.className = 'status-message success';
                
                this.addResultB(`✅ MVP: ${result.template} → ${result.deployUrl}`);
            } else {
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            this.mvpStatus.textContent = `❌ Ошибка: ${error.message}`;
            this.mvpStatus.className = 'status-message error';
        } finally {
            this.generateMvpBtn.disabled = false;
            if (this.agentBStatus) {
                this.agentBStatus.textContent = 'Готов';
                this.agentBStatus.className = 'status-badge status-stopped';
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});
