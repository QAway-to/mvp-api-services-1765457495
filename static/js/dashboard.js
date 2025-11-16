// Tableau-style Dashboard JavaScript
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
        this.startBtn = document.getElementById('start-btn');
        this.runSessionBtn = document.getElementById('run-session-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.clearLogsBtnA = document.getElementById('clear-logs-a');
        this.clearLogsBtnB = document.getElementById('clear-logs-b');
        this.searchKeywords = document.getElementById('search-keywords');

        // Agent B (MVP) elements
        this.mvpTemplate = document.getElementById('mvp-template');
        this.projectDescription = document.getElementById('project-description');
        this.generateMvpBtn = document.getElementById('generate-mvp-btn');
        this.mvpStatus = document.getElementById('mvp-status');
        this.buildTypeInputs = document.querySelectorAll('input[name="build-type"]');

        // Log queues
        this.logQueueA = [];
        this.logQueueB = [];
        this.isProcessingLogsA = false;
        this.isProcessingLogsB = false;
        this.logProcessTimerA = null;
        this.logProcessTimerB = null;
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

        if (this.buildTypeInputs && this.buildTypeInputs.length) {
            this.buildTypeInputs.forEach(input => {
                input.addEventListener('change', () => this.updateMVPStatus());
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
            }, { immediate: true, target: 'a' });

            setTimeout(() => {
                if (this.eventSource && this.eventSource.readyState === EventSource.CLOSED) {
                    this.startLogStream();
                }
            }, 5000);
        };
    }

    addLogEntry(logData, options = {}) {
        if (!logData) return;

        const { immediate = false, target = null } = options;
        const message = logData.message || '';
        const module = logData.module || '';

        // Determine target
        let logTarget = target;
        if (!logTarget) {
            if (message.includes('Agent B') || message.includes('MVP') || module === 'MVP') {
                logTarget = 'b';
            } else {
                logTarget = 'a';
            }
        }

        this.addToQueue(logData, logTarget, immediate);
    }

    addToQueue(logData, target, immediate) {
        if (immediate) {
            this.renderLogEntry(logData, target);
            return;
        }

        const queue = target === 'a' ? this.logQueueA : this.logQueueB;
        const isProcessing = target === 'a' ? 'isProcessingLogsA' : 'isProcessingLogsB';

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
        const queue = target === 'a' ? this.logQueueA : this.logQueueB;
        const timer = target === 'a' ? 'logProcessTimerA' : 'logProcessTimerB';
        const isProcessing = target === 'a' ? 'isProcessingLogsA' : 'isProcessingLogsB';

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
        const container = target === 'a' ? this.logsContainerA : this.logsContainerB;
        if (!container) return;

        const entry = document.createElement('div');
        entry.className = `log-entry log-${logData.level.toLowerCase()}`;

        const timestamp = new Date(logData.timestamp).toLocaleTimeString();
        const level = logData.level.padEnd(6);
        const module = logData.module ? `[${logData.module}]` : '';
        let message = logData.message;

        // Remove emojis from messages for clean Tableau style
        message = message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

        entry.textContent = `${timestamp} | ${level} | ${module} ${message}`;
        container.appendChild(entry);

        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });

        while (container.children.length > this.maxLogEntries) {
            container.removeChild(container.firstChild);
        }
    }

    async updateStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();

            if (this.agentAStatus) {
                this.agentAStatus.textContent = this.formatStatus(data.agent_a_status);
            }

            if (this.projectsCount) {
                this.projectsCount.textContent = data.projects_found || 0;
            }
            if (this.suitableCount) {
                this.suitableCount.textContent = data.suitable_projects || 0;
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

        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    formatStatus(status) {
        const statusMap = {
            'running': 'Running',
            'stopped': 'Stopped',
            'waiting': 'Waiting',
            'error': 'Error'
        };
        return statusMap[status] || status;
    }

    async startAgent() {
        try {
            if (this.startBtn) {
                this.startBtn.disabled = true;
                this.startBtn.textContent = 'Starting...';
            }

            const response = await fetch('/agent/start', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'started') {
                await this.updateStatus();
            } else if (data.status === 'already_running') {
                if (this.startBtn) {
                    this.startBtn.disabled = false;
                    this.startBtn.textContent = 'Start Search';
                }
            }

        } catch (error) {
            if (this.startBtn) {
                this.startBtn.disabled = false;
                this.startBtn.textContent = 'Start Search';
            }
        }
    }
    
    async runSingleSession() {
        try {
            if (this.runSessionBtn) {
                this.runSessionBtn.disabled = true;
                this.runSessionBtn.textContent = 'Running...';
            }

            const response = await fetch('/agent/run-session', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'session_started') {
                await this.updateStatus();
            } else if (data.status === 'busy') {
                if (this.runSessionBtn) {
                    this.runSessionBtn.disabled = false;
                    this.runSessionBtn.textContent = 'Single Session';
                }
            }

        } catch (error) {
            if (this.runSessionBtn) {
                this.runSessionBtn.disabled = false;
                this.runSessionBtn.textContent = 'Single Session';
            }
        }
    }

    async stopAgent() {
        try {
            if (this.stopBtn) {
                this.stopBtn.disabled = true;
                this.stopBtn.textContent = 'Stopping...';
            }

            const response = await fetch('/agent/stop', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'stopped') {
                await this.updateStatus();
            }

        } catch (error) {
            if (this.stopBtn) {
                this.stopBtn.disabled = false;
                this.stopBtn.textContent = 'Stop';
            }
        }
    }

    clearLogs(target) {
        const queue = target === 'a' ? this.logQueueA : this.logQueueB;
        const timer = target === 'a' ? 'logProcessTimerA' : 'logProcessTimerB';
        const isProcessing = target === 'a' ? 'isProcessingLogsA' : 'isProcessingLogsB';
        const container = target === 'a' ? this.logsContainerA : this.logsContainerB;

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
            this.mvpStatus.textContent = '';
            this.mvpStatus.className = 'status-message';
            this.generateMvpBtn.disabled = false;
        } else if (description && description.length < 10) {
            this.mvpStatus.textContent = 'Description too short (min 10 chars)';
            this.mvpStatus.className = 'status-message error';
            this.generateMvpBtn.disabled = true;
        } else {
            this.mvpStatus.textContent = 'Ready to generate';
            this.mvpStatus.className = 'status-message success';
            this.generateMvpBtn.disabled = false;
        }
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
            this.showMVPError('Select a template');
            return;
        }

        if (description && description.length < 10) {
            this.showMVPError('Description too short');
            return;
        }

        try {
            this.generateMvpBtn.disabled = true;
            this.mvpStatus.textContent = 'Generating...';
            this.mvpStatus.className = 'status-message loading';

            if (this.agentBStatus) {
                this.agentBStatus.textContent = 'Generating';
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
                throw new Error(result.error || 'Unknown error');
            }

        } catch (error) {
            console.error('MVP generation error:', error);
            this.showMVPError(error.message);
        } finally {
            if (this.agentBStatus) {
                this.agentBStatus.textContent = 'Ready';
            }
        }
    }

    showMVPSuccess(result) {
        this.mvpStatus.textContent = `Success: ${result.deployUrl}`;
        this.mvpStatus.className = 'status-message success';

        setTimeout(() => {
            if (this.projectDescription) {
                this.projectDescription.value = '';
                this.updateMVPStatus();
            }
        }, 3000);

        this.generateMvpBtn.disabled = false;
    }

    showMVPError(message) {
        this.mvpStatus.textContent = `Error: ${message}`;
        this.mvpStatus.className = 'status-message error';
        this.generateMvpBtn.disabled = false;
    }

    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.logProcessTimerA) clearTimeout(this.logProcessTimerA);
        if (this.logProcessTimerB) clearTimeout(this.logProcessTimerB);
        this.logQueueA = [];
        this.logQueueB = [];
        this.isProcessingLogsA = false;
        this.isProcessingLogsB = false;
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
