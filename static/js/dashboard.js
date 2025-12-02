// Dashboard JavaScript for Multi-Agent System

// DOM Elements
const agentAButton = document.getElementById('agent-a-button');
const agentAInput = document.getElementById('agent-a-input');
const agentAKworkUrl = document.getElementById('agent-a-kwork-url');
const agentALoadUrl = document.getElementById('agent-a-load-url');
const agentATimeLeft = document.getElementById('agent-a-time-left');
const agentAHiredMin = document.getElementById('agent-a-hired-min');
const agentAProposalsMax = document.getElementById('agent-a-proposals-max');
const agentAStatus = document.getElementById('agent-a-status');
const agentAResults = document.getElementById('agent-a-results');
const agentAStopButton = document.getElementById('agent-a-stop-button');
const agentATimer = document.getElementById('agent-a-timer');

const agentBButton = document.getElementById('agent-b-button');
const agentBProjectSelect = document.getElementById('agent-b-project-select');
const agentBDropdown = document.getElementById('agent-b-dropdown');
const agentBTextarea = document.getElementById('agent-b-textarea');
const agentBLogs = document.getElementById('agent-b-logs');

// Store projects from Agent A
let agentAProjects = [];

// SSE EventSource for logs
let logEventSource = null;

// Timer for Agent A
let agentATimerInterval = null;
let agentASessionStartTime = null;

// Validate Cyrillic only input
function validateCyrillicOnly(text) {
    // Allow only Cyrillic letters, spaces, commas, and dashes
    const cyrillicPattern = /^[а-яА-ЯёЁ\s,.-]+$/;
    return cyrillicPattern.test(text);
}

// Filter non-Cyrillic characters from input
function filterCyrillicOnly(text) {
    // Remove all non-Cyrillic characters (keep only Cyrillic, spaces, commas, dashes)
    return text.replace(/[^а-яА-ЯёЁ\s,.-]/g, '');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    connectToLogs();
    pollAgentStatus();
    loadAgentAProjects();
    
    // Add input validation for Agent A keywords (Cyrillic only)
    if (agentAInput) {
        agentAInput.addEventListener('input', (e) => {
            const originalValue = e.target.value;
            const filteredValue = filterCyrillicOnly(originalValue);
            
            if (originalValue !== filteredValue) {
                e.target.value = filteredValue;
                // Show visual feedback
                e.target.style.borderColor = '#f56565';
                setTimeout(() => {
                    e.target.style.borderColor = '';
                }, 500);
            }
        });
        
        agentAInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const filteredText = filterCyrillicOnly(pastedText);
            e.target.value = filteredText;
        });
    }
    
    // Load projects periodically
    setInterval(loadAgentAProjects, 5000); // Every 5 seconds
});

// Event Listeners
function initializeEventListeners() {
    // Agent A: Load project by URL button
    if (agentALoadUrl) {
        agentALoadUrl.addEventListener('click', async () => {
            const url = agentAKworkUrl.value.trim();
            
            if (!url) {
                alert('Пожалуйста, введите ссылку на проект Kwork');
                return;
            }
            
            // Validate Kwork URL
            const kworkUrlPattern = /^https:\/\/kwork\.ru\/projects\/\d+\/view$/;
            if (!kworkUrlPattern.test(url)) {
                alert('Неверный формат ссылки. Ожидается: https://kwork.ru/projects/XXXXX/view');
                return;
            }
            
            agentALoadUrl.disabled = true;
            agentALoadUrl.textContent = 'Загрузка...';
            agentAStatus.textContent = 'Загрузка проекта...';
            agentAResults.textContent = 'Парсинг проекта по ссылке...';
            
            try {
                const response = await fetch('/api/parse-kwork-project', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url }),
                });
                
                const data = await response.json();
                
                if (data.status === 'error') {
                    agentAStatus.textContent = 'Error';
                    agentAResults.textContent = `Ошибка: ${data.message || 'Не удалось загрузить проект'}`;
                    agentALoadUrl.disabled = false;
                    agentALoadUrl.textContent = 'Загрузить проект по ссылке';
                    return;
                }
                
                if (data.status === 'success' && data.project) {
                    // Add project to agentAProjects as first item (Project A)
                    agentAProjects = [data.project];
                    
                    // Update dropdown - show only Project A
                    if (agentBProjectSelect) {
                        // Clear existing options except first
                        while (agentBProjectSelect.options.length > 1) {
                            agentBProjectSelect.remove(1);
                        }
                        
                        // Add Project A - enable and show it
                        const optionA = agentBProjectSelect.querySelector('option[value="A"]');
                        if (optionA) {
                            optionA.disabled = false;
                            optionA.style.display = '';
                            const title = data.project.title || 'Untitled';
                            const shortTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
                            optionA.textContent = `Проект A: ${shortTitle}`;
                        } else {
                            // Create new option if it doesn't exist
                            const option = document.createElement('option');
                            option.value = 'A';
                            const title = data.project.title || 'Untitled';
                            const shortTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
                            option.textContent = `Проект A: ${shortTitle}`;
                            agentBProjectSelect.appendChild(option);
                        }
                        
                        // Auto-select Project A
                        agentBProjectSelect.value = 'A';
                        
                        // Auto-fill description
                        if (agentBTextarea && data.project.description) {
                            agentBTextarea.value = data.project.description;
                            // User selects template manually - no auto-selection
                        }
                    }
                    
                    agentAStatus.textContent = 'Success';
                    agentAResults.textContent = `✅ Проект загружен: ${data.project.title || 'Untitled'}`;
                }
            } catch (error) {
                console.error('Error loading project by URL:', error);
                agentAStatus.textContent = 'Error';
                agentAResults.textContent = `Ошибка: ${error.message}`;
            } finally {
                agentALoadUrl.disabled = false;
                agentALoadUrl.textContent = 'Загрузить проект по ссылке';
            }
        });
    }
    
    // Agent A: Execute button
    agentAButton.addEventListener('click', async () => {
        const keyword = agentAInput.value.trim();
        const timeLeft = agentATimeLeft.value ? parseInt(agentATimeLeft.value) : null;
        const hiredMin = agentAHiredMin.value ? parseInt(agentAHiredMin.value) : null;
        const proposalsMax = agentAProposalsMax.value ? parseInt(agentAProposalsMax.value) : null;
        
        if (!keyword) {
            alert('Пожалуйста, введите ключевые слова');
            return;
        }
        
        // Validate Cyrillic only
        if (!validateCyrillicOnly(keyword)) {
            alert('Разрешены только русские буквы (кириллица), пробелы, запятые и дефисы');
            return;
        }
        
        agentAButton.disabled = true;
        agentAButton.textContent = 'Running...';
        agentAStatus.textContent = 'Running...';
        agentAResults.textContent = 'Starting search session...';
        
        // Show stop button and start timer
        if (agentAStopButton) {
            agentAStopButton.style.display = 'block';
        }
        startAgentATimer();
        
        try {
            const requestBody = {};
            if (keyword) requestBody.keywords = keyword;
            if (timeLeft !== null) requestBody.timeLeft = timeLeft;
            if (hiredMin !== null) requestBody.hiredMin = hiredMin;
            if (proposalsMax !== null) requestBody.proposalsMax = proposalsMax;
            
            const response = await fetch('/agent/run-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            
            const data = await response.json();
            
            if (data.status === 'error' || data.status === 'busy') {
                agentAStatus.textContent = data.message || 'Error';
                agentAResults.textContent = `Error: ${data.message || 'Unknown error'}`;
                // Hide stop button and stop timer on error
                if (agentAStopButton) {
                    agentAStopButton.style.display = 'none';
                }
                stopAgentATimer();
            } else {
                agentAStatus.textContent = 'Started';
                agentAResults.textContent = 'Search session started. Check logs for progress...';
                
                // Poll for results
                pollAgentResults();
            }
        } catch (error) {
            console.error('Error starting Agent A:', error);
            agentAStatus.textContent = 'Error';
            agentAResults.textContent = `Error: ${error.message}`;
            // Hide stop button and stop timer on error
            if (agentAStopButton) {
                agentAStopButton.style.display = 'none';
            }
            stopAgentATimer();
        } finally {
            agentAButton.disabled = false;
            agentAButton.textContent = 'Execute';
        }
    });
    
    // Agent B: Project selection from Agent A
    if (agentBProjectSelect) {
        agentBProjectSelect.addEventListener('change', async (e) => {
            const selectedIndex = e.target.value;
            if (selectedIndex && agentAProjects.length > 0) {
                const projectIndex = selectedIndex.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4
                if (projectIndex >= 0 && projectIndex < agentAProjects.length) {
                    const project = agentAProjects[projectIndex];
                    // Fill description with project title and description
                    let descriptionText = project.title || '';
                    if (project.description) {
                        descriptionText += '\n\n' + project.description;
                    }
                    if (agentBTextarea) {
                        agentBTextarea.value = descriptionText;
                        agentBTextarea.style.borderColor = '#48bb78';
                        setTimeout(() => {
                            agentBTextarea.style.borderColor = '';
                        }, 2000);
                    }
                    
                    // User selects template manually - no auto-selection
                }
            }
        });
    }
    
    // Agent A: Stop button
    if (agentAStopButton) {
        agentAStopButton.addEventListener('click', async () => {
            if (!confirm('Вы уверены, что хотите остановить поиск?')) {
                return;
            }
            
            agentAStopButton.disabled = true;
            agentAStopButton.textContent = 'Остановка...';
            
            try {
                const response = await fetch('/agent/stop', {
                    method: 'POST',
                });
                
                const data = await response.json();
                
                if (data.status === 'stopped' || data.status === 'error') {
                    agentAStatus.textContent = 'Stopped';
                    agentAResults.textContent = 'Поиск остановлен пользователем.';
                    
                    // Hide stop button and stop timer
                    agentAStopButton.style.display = 'none';
                    stopAgentATimer();
                }
            } catch (error) {
                console.error('Error stopping Agent A:', error);
                agentAStatus.textContent = 'Error stopping';
            } finally {
                agentAStopButton.disabled = false;
                agentAStopButton.textContent = 'Stop';
            }
        });
    }
    
    // Agent B: Generate button
    agentBButton.addEventListener('click', async () => {
        const template = agentBDropdown.value;
        const description = agentBTextarea.value.trim();
        const buildType = document.querySelector('input[name="build-type"]:checked').value;
        
        if (!template) {
            alert('Please select a template');
            return;
        }
        
        if (!description || description.length < 10) {
            alert('Please enter project description (minimum 10 characters)');
            return;
        }
        
        agentBButton.disabled = true;
        agentBButton.textContent = 'Generating...';
        agentBLogs.textContent = 'Starting MVP generation...\n';
        
        try {
            const response = await fetch('/api/generate-mvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template: template,
                    description: description,
                    buildType: buildType
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'error') {
                agentBLogs.textContent += `\n❌ Error: ${data.error || 'Unknown error'}`;
            } else if (data.status === 'success') {
                agentBLogs.textContent += `\n✅ ${data.message || 'MVP generated successfully'}`;
                if (data.deployUrl) {
                    agentBLogs.textContent += `\n🔗 Deploy URL: ${data.deployUrl}`;
                    agentBLogs.textContent += `\n📦 Template: ${data.template}`;
                }
            }
        } catch (error) {
            console.error('Error generating MVP:', error);
            agentBLogs.textContent += `\n❌ Error: ${error.message}`;
        } finally {
            agentBButton.disabled = false;
            agentBButton.textContent = 'Generate';
        }
    });
}

// Load projects from Agent A
async function loadAgentAProjects() {
    try {
        const response = await fetch('/projects');
        const data = await response.json();
        
        if (data.projects && data.projects.length > 0) {
            // Only update if we don't have a project loaded from URL
            // If agentAProjects has exactly 1 item and it was loaded from URL, don't overwrite
            const hasUrlProject = agentAProjects.length === 1 && agentAProjects[0].loadedFromUrl;
            
            if (!hasUrlProject) {
                // Take top 5 projects
                agentAProjects = data.projects.slice(0, 5);
                
                // Update dropdown options - hide all by default
                if (agentBProjectSelect) {
                    // Clear existing options except first
                    while (agentBProjectSelect.options.length > 1) {
                        agentBProjectSelect.remove(1);
                    }
                    
                    // Hide project options by default (they will be shown when Execute is run)
                    // Don't add them here - they will be added when Execute completes
                }
            }
        }
    } catch (error) {
        console.error('Error loading Agent A projects:', error);
    }
}

// Automatically select template based on description
// Auto-template selection removed - user selects template manually from dropdown

// Connect to Server-Sent Events for logs
function connectToLogs() {
    if (logEventSource) {
        logEventSource.close();
    }
    
    logEventSource = new EventSource('/logs/stream');
    
    logEventSource.onmessage = (event) => {
        try {
            const logData = JSON.parse(event.data);
            appendLog(logData);
        } catch (error) {
            console.error('Error parsing log:', error);
        }
    };
    
    logEventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        // Reconnect after 3 seconds
        setTimeout(() => {
            if (logEventSource && logEventSource.readyState === EventSource.CLOSED) {
                connectToLogs();
            }
        }, 3000);
    };
}

// Append log message to appropriate container
function appendLog(logData) {
    const { agent, message, timestamp } = logData;
    
    // Format timestamp
    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    const logLine = `[${time}] ${agent || 'System'}: ${message}`;
    
    // Append to Agent A results if it's Agent A related
    if (agent === 'Agent A' || agent === 'API' || agent === 'Evaluator') {
        if (agentAResults.textContent === 'No data yet...' || agentAResults.textContent === 'Starting search session...') {
            agentAResults.textContent = logLine;
        } else {
            agentAResults.textContent += '\n' + logLine;
        }
        // Auto-scroll to bottom
        agentAResults.scrollTop = agentAResults.scrollHeight;
    }
    
    // Append to Agent B logs if it's Agent B or MVP related
    if (agent === 'Agent B' || agent === 'MVP' || message.includes('MVP') || message.includes('generation')) {
        if (agentBLogs.textContent === 'No data yet...' || agentBLogs.textContent === 'Starting MVP generation...') {
            agentBLogs.textContent = logLine;
        } else {
            agentBLogs.textContent += '\n' + logLine;
        }
        // Auto-scroll to bottom
        agentBLogs.scrollTop = agentBLogs.scrollHeight;
    }
}

// Timer functions for Agent A
function startAgentATimer() {
    agentASessionStartTime = Date.now();
    if (agentATimerInterval) {
        clearInterval(agentATimerInterval);
    }
    agentATimerInterval = setInterval(updateAgentATimer, 1000);
    updateAgentATimer(); // Update immediately
}

function stopAgentATimer() {
    if (agentATimerInterval) {
        clearInterval(agentATimerInterval);
        agentATimerInterval = null;
    }
    agentASessionStartTime = null;
    if (agentATimer) {
        agentATimer.textContent = '00:00:00';
    }
}

function updateAgentATimer() {
    if (!agentASessionStartTime || !agentATimer) {
        return;
    }
    
    const elapsed = Math.floor((Date.now() - agentASessionStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    agentATimer.textContent = formatted;
}

// Poll Agent A status and results
function pollAgentStatus() {
    setInterval(async () => {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            if (data.agent_a_status) {
                agentAStatus.textContent = data.agent_a_status;
                
                // Update stop button visibility based on status
                if (agentAStopButton) {
                    if (data.agent_a_status === 'running' || data.agent_a_status === 'Started') {
                        agentAStopButton.style.display = 'block';
                        // Start timer if not already started
                        if (!agentATimerInterval && data.current_session) {
                            // Use server time if available
                            if (data.current_session.elapsed_seconds) {
                                agentASessionStartTime = Date.now() - (data.current_session.elapsed_seconds * 1000);
                                if (!agentATimerInterval) {
                                    startAgentATimer();
                                }
                            } else {
                                startAgentATimer();
                            }
                        }
                    } else {
                        agentAStopButton.style.display = 'none';
                        stopAgentATimer();
                    }
                }
            }
            
            if (data.projects_found !== undefined) {
                // Update results count
                if (data.projects_found > 0 && agentAResults.textContent.includes('No data yet...')) {
                    agentAResults.textContent = `Found ${data.projects_found} project(s)`;
                }
            }
        } catch (error) {
            console.error('Error polling status:', error);
        }
    }, 2000); // Poll every 2 seconds
}

// Poll Agent A results
function pollAgentResults() {
    const intervalId = setInterval(async () => {
        try {
            const response = await fetch('/projects');
            const data = await response.json();
            
            if (data.projects && data.projects.length > 0) {
                let resultsText = `Found ${data.total} project(s), ${data.suitable} suitable:\n\n`;
                
                data.projects.slice(0, 5).forEach((project, index) => {
                    resultsText += `${index + 1}. ${project.title || 'Untitled'}\n`;
                    if (project.url) {
                        resultsText += `   URL: ${project.url}\n`;
                    }
                    if (project.evaluation && project.evaluation.suitable) {
                        resultsText += `   ✓ Suitable\n`;
                    }
                    resultsText += '\n';
                });
                
                if (data.projects.length > 5) {
                    resultsText += `... and ${data.projects.length - 5} more`;
                }
                
                agentAResults.textContent = resultsText;
                
                // Check if session is still running
                const statusResponse = await fetch('/status');
                const statusData = await statusResponse.json();
                if (statusData.agent_a_status !== 'running' && statusData.agent_a_status !== 'Started') {
                    // Session finished, hide stop button and stop timer
                    if (agentAStopButton) {
                        agentAStopButton.style.display = 'none';
                    }
                    stopAgentATimer();
                    clearInterval(intervalId);
                }
            }
        } catch (error) {
            console.error('Error polling results:', error);
        }
        
        // Stop polling after 5 minutes
        setTimeout(() => {
            clearInterval(intervalId);
            // Hide stop button and stop timer when polling stops
            if (agentAStopButton) {
                agentAStopButton.style.display = 'none';
            }
            stopAgentATimer();
        }, 300000);
    }, 3000); // Poll every 3 seconds
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (logEventSource) {
        logEventSource.close();
    }
    stopAgentATimer();
});

