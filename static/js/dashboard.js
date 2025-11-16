// Compact Dashboard JavaScript
class Dashboard {
    constructor() {
        this.eventSource = null;
        
        // Agent A elements
        this.logsContainerA = document.getElementById('logs-a');
        this.logsContainerB = document.getElementById('logs-b');
        this.logsContainerCommon = document.getElementById('logs-common');
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
        this.clearLogsBtnCommon = document.getElementById('clear-logs-common');
        this.sessionInfo = document.getElementById('session-info');
        this.sessionTime = document.getElementById('session-time');
        this.sessionStep = document.getElementById('session-step');

        // Agent B (MVP) elements
        this.mvpTemplate = document.getElementById('mvp-template');
        this.projectDescription = document.getElementById('project-description');
        this.generateMvpBtn = document.getElementById('generate-mvp-btn');
        this.mvpStatus = document.getElementById('mvp-status');
        this.buildTypeInputs = document.querySelectorAll('input[name="build-type"]');

        // Log queues
        this.logQueueA = [];
        this.logQueueB = [];
        this.logQueueCommon = [];
        this.isProcessingLogsA = false;
        this.isProcessingLogsB = false;
        this.isProcessingLogsCommon = false;
        this.logProcessTimerA = null;
        this.logProcessTimerB = null;
        this.logProcessTimerCommon = null;
        this.maxLogEntries = 500;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateMVPButtonText();
        this.updateStatus().then(() => {
            this.startLogStream();
            setInterval(() => this.updateSessionInfo(), 1000);
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
        if (this.clearLogsBtnCommon) {
            this.clearLogsBtnCommon.addEventListener('click', () => this.clearLogs('common'));
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
            }, { immediate: true, target: 'common' });

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
        }, { immediate: true, target: 'common' });
    }

    addLogEntry(logData, options = {}) {
        if (!logData) return;

        const { immediate = false, target = null } = options;
        const message = logData.message || '';
        const module = logData.module || '';

        // Determine target
        let logTarget = target;
        if (!logTarget) {
            if (message.includes('Agent B') || message.includes('MVP') || module === 'MVP' || message.includes('🎯') || message.includes('🚀 MVP')) {
                logTarget = 'b';
            } else if (message.includes('Agent A') || message.includes('[SELENIUM]') || message.includes('[SESSION]') || message.includes('[EVALUATION]')) {
                logTarget = 'a';
            } else {
                logTarget = 'common';
            }
        }

        // Always add to common logs too
        if (logTarget !== 'common') {
            this.addToQueue(logData, 'common', immediate);
        }

        // Add to specific target
        this.addToQueue(logData, logTarget, immediate);
    }

    addToQueue(logData, target, immediate) {
        if (immediate) {
            this.renderLogEntry(logData, target);
            return;
        }

        const queue = target === 'a' ? this.logQueueA : (target === 'b' ? this.logQueueB : this.logQueueCommon);
        const isProcessing = target === 'a' ? 'isProcessingLogsA' : (target === 'b' ? 'isProcessingLogsB' : 'isProcessingLogsCommon');

        queue.push(logData);
        if (queue.length > this.maxLogEntries) {
            queue.splice(0, queue.length - this.maxLogEntries);
        }

        if (!this[isProcessing]) {
            this[isProcessing] = true;
            this.processLogQueue(target);
        }
    }

    processLogQueue(target) {
        const queue = target === 'a' ? this.logQueueA : (target === 'b' ? this.logQueueB : this.logQueueCommon);
        const timer = target === 'a' ? 'logProcessTimerA' : (target === 'b' ? 'logProcessTimerB' : 'logProcessTimerCommon');
        const isProcessing = target === 'a' ? 'isProcessingLogsA' : (target === 'b' ? 'isProcessingLogsB' : 'isProcessingLogsCommon');

        if (queue.length === 0) {
            this[isProcessing] = false;
            this[timer] = null;
            return;
        }

        const logData = queue.shift();
        this.renderLogEntry(logData, target);

        const delay = this.calculateLogDelay(queue.length);
        this[timer] = setTimeout(() => this.processLogQueue(target), delay);
    }

    calculateLogDelay(backlog) {
        if (backlog > 50) return 20;
        if (backlog > 20) return 50;
        if (backlog > 5) return 100;
        return 200;
    }

    renderLogEntry(logData, target) {
        const container = target === 'a' ? this.logsContainerA : (target === 'b' ? this.logsContainerB : this.logsContainerCommon);
        if (!container) return;

        const entry = document.createElement('div');
        entry.className = `log-entry log-${logData.level.toLowerCase()}`;

        const timestamp = new Date(logData.timestamp).toLocaleTimeString();
        const level = logData.level.padEnd(6);
        const module = logData.module ? `[${logData.module}]` : '';
        let message = logData.message;

        // Color coding
        if (message.includes('[SELENIUM]')) {
            entry.style.color = '#4fc3f7';
            entry.style.borderLeftColor = '#4fc3f7';
        } else if (message.includes('[SESSION]')) {
            entry.style.color = '#ba68c8';
            entry.style.borderLeftColor = '#ba68c8';
        } else if (message.includes('Agent B') || message.includes('MVP') || message.includes('🎯')) {
            entry.style.color = '#9b59b6';
            entry.style.borderLeftColor = '#9b59b6';
        }

        entry.textContent = `${timestamp} │ ${level} │ ${module} ${message}`;
        container.appendChild(entry);

        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });

        while (container.children.length > this.maxLogEntries) {
            container.removeChild(container.firstChild);
        }
        
        if (target === 'a') {
            this.extractSessionStep(message);
        }
    }
    
    extractSessionStep(message) {
        if (!this.sessionStep) return;
        
        if (message.includes('Step 1/3')) {
            this.sessionStep.textContent = 'Step 1/3: Searching...';
        } else if (message.includes('Step 2/3')) {
            this.sessionStep.textContent = 'Step 2/3: Evaluating...';
        } else if (message.includes('Step 3/3')) {
            this.sessionStep.textContent = 'Step 3/3: Notifying...';
        } else if (message.includes('[SELENIUM]')) {
            const match = message.match(/\[SELENIUM\]\s+(.+?)(?:\s+|$)/);
            if (match) {
                const action = match[1].replace(/[🔧✅⚠️❌🌐👁️⏱️💰📄🔍]/g, '').trim();
                this.sessionStep.textContent = `Selenium: ${action.substring(0, 30)}...`;
            }
        }
    }

    async updateStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();

            if (this.agentAStatus) {
                const statusText = this.formatStatus(data.agent_a_status);
                this.agentAStatus.textContent = statusText;
                this.agentAStatus.className = `status-badge status-a status-${data.agent_a_status}`;
            }

            if (this.projectsCount) {
                this.projectsCount.textContent = data.projects_found || 0;
            }
            if (this.suitableCount) {
                this.suitableCount.textContent = data.suitable_projects || 0;
            }
            if (this.lastCheck) {
                this.lastCheck.textContent = data.last_check ? 
                    new Date(data.last_check).toLocaleTimeString() : '-';
            }

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

            if (data.current_session && this.sessionInfo) {
                this.sessionInfo.style.display = 'block';
                this.updateSessionInfo();
            } else if (this.sessionInfo) {
                this.sessionInfo.style.display = 'none';
            }

        } catch (error) {
            console.error('Error updating status:', error);
        }

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
                this.startBtn.textContent = '⏳...';
            }

            const response = await fetch('/agent/start', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'started') {
                await this.updateStatus();
            } else if (data.status === 'already_running') {
                if (this.startBtn) {
                    this.startBtn.disabled = false;
                    this.startBtn.textContent = '▶️ Continuous';
                }
            }

        } catch (error) {
            if (this.startBtn) {
                this.startBtn.disabled = false;
                this.startBtn.textContent = '▶️ Continuous';
            }
        }
    }
    
    async runSingleSession() {
        try {
            if (this.runSessionBtn) {
                this.runSessionBtn.disabled = true;
                this.runSessionBtn.textContent = '⏳...';
            }

            const response = await fetch('/agent/run-session', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'session_started') {
                await this.updateStatus();
            } else if (data.status === 'busy') {
                if (this.runSessionBtn) {
                    this.runSessionBtn.disabled = false;
                    this.runSessionBtn.textContent = '🚀 Сессия';
                }
            }

        } catch (error) {
            if (this.runSessionBtn) {
                this.runSessionBtn.disabled = false;
                this.runSessionBtn.textContent = '🚀 Сессия';
            }
        }
    }

    async stopAgent() {
        try {
            if (this.stopBtn) {
                this.stopBtn.disabled = true;
                this.stopBtn.textContent = '⏳...';
            }

            const response = await fetch('/agent/stop', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'stopped') {
                await this.updateStatus();
            }

        } catch (error) {
            if (this.stopBtn) {
                this.stopBtn.disabled = false;
                this.stopBtn.textContent = '⏹️ Стоп';
            }
        }
    }

    clearLogs(target) {
        const queue = target === 'a' ? this.logQueueA : (target === 'b' ? this.logQueueB : this.logQueueCommon);
        const timer = target === 'a' ? 'logProcessTimerA' : (target === 'b' ? 'logProcessTimerB' : 'logProcessTimerCommon');
        const isProcessing = target === 'a' ? 'isProcessingLogsA' : (target === 'b' ? 'isProcessingLogsB' : 'isProcessingLogsCommon');
        const container = target === 'a' ? this.logsContainerA : (target === 'b' ? this.logsContainerB : this.logsContainerCommon);

        if (this[timer]) {
            clearTimeout(this[timer]);
            this[timer] = null;
        }
        queue.length = 0;
        if (container) {
            container.innerHTML = '';
        }
        this[isProcessing] = false;
    }

    updateMVPStatus() {
        if (!this.generateMvpBtn || !this.mvpStatus) return;

        const template = this.mvpTemplate ? this.mvpTemplate.value : '';
        const description = this.projectDescription ? this.projectDescription.value.trim() : '';

        if (!template) {
            this.mvpStatus.textContent = 'Выберите шаблон';
            this.mvpStatus.className = 'mvp-status-compact';
            this.generateMvpBtn.disabled = true;
        } else if (description && description.length < 10) {
            this.mvpStatus.textContent = 'Описание слишком короткое';
            this.mvpStatus.className = 'mvp-status-compact error';
            this.generateMvpBtn.disabled = true;
        } else {
            this.mvpStatus.textContent = 'Готово к генерации';
            this.mvpStatus.className = 'mvp-status-compact success';
            this.generateMvpBtn.disabled = false;
        }
        this.updateMVPButtonText();
    }

    updateMVPButtonText() {
        if (!this.generateMvpBtn) return;
        const buildType = this.getSelectedBuildType();
        const buildTypeText = buildType === 'mock' ? 'Мок' : 'Полный';
        const emoji = buildType === 'mock' ? '🎭' : '🚀';
        this.generateMvpBtn.innerHTML = `${emoji} ${buildTypeText}`;
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
            this.showMVPError('Описание слишком короткое');
            return;
        }

        try {
            this.generateMvpBtn.disabled = true;
            const buildTypeText = buildType === 'mock' ? 'мокового' : 'полного';
            this.mvpStatus.textContent = `Генерация ${buildTypeText}...`;
            this.mvpStatus.className = 'mvp-status-compact loading';

            if (this.agentBStatus) {
                this.agentBStatus.textContent = '🔄 Генерирует';
                this.agentBStatus.className = 'status-badge status-b status-running';
            }

            const response = await fetch('/api/generate-mvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            if (this.agentBStatus) {
                this.agentBStatus.textContent = 'Готов';
                this.agentBStatus.className = 'status-badge status-b status-stopped';
            }
        }
    }

    showMVPSuccess(result) {
        this.mvpStatus.textContent = `✅ ${result.deployUrl}`;
        this.mvpStatus.className = 'mvp-status-compact success';

        setTimeout(() => {
            if (this.projectDescription) {
                this.projectDescription.value = '';
                this.updateMVPStatus();
            }
        }, 3000);

        this.generateMvpBtn.disabled = false;
    }

    showMVPError(message) {
        this.mvpStatus.textContent = `❌ ${message}`;
        this.mvpStatus.className = 'mvp-status-compact error';
        this.generateMvpBtn.disabled = false;
    }

    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.logProcessTimerA) clearTimeout(this.logProcessTimerA);
        if (this.logProcessTimerB) clearTimeout(this.logProcessTimerB);
        if (this.logProcessTimerCommon) clearTimeout(this.logProcessTimerCommon);
        this.logQueueA = [];
        this.logQueueB = [];
        this.logQueueCommon = [];
        this.isProcessingLogsA = false;
        this.isProcessingLogsB = false;
        this.isProcessingLogsCommon = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});
