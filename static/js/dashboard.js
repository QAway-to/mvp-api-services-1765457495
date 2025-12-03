// Dashboard JavaScript for Multi-Agent System

// DOM Elements - will be initialized after DOM loads
let agentAButton;
let agentAInput;
let agentAKworkUrl;
let agentALoadUrl;
let agentATimeLeft;
let agentAHiredMin;
let agentAProposalsMax;
let agentABudget;
let agentAStatus;
let agentAResults;
let agentAStopButton;
let agentATimer;

let agentBButton;
let agentBProjectSelect;
let agentBDropdown;
let agentBTextarea;
let agentBLogs;

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
    // Initialize DOM elements for Agent A
    agentAButton = document.getElementById('agent-a-button');
    agentAInput = document.getElementById('agent-a-input');
    agentAKworkUrl = document.getElementById('agent-a-kwork-url');
    agentALoadUrl = document.getElementById('agent-a-load-url');
    agentATimeLeft = document.getElementById('agent-a-time-left');
    agentAHiredMin = document.getElementById('agent-a-hired-min');
    agentAProposalsMax = document.getElementById('agent-a-proposals-max');
    agentABudget = document.getElementById('agent-a-budget');
    agentAStatus = document.getElementById('agent-a-status');
    agentAResults = document.getElementById('agent-a-results');
    agentAStopButton = document.getElementById('agent-a-stop-button');
    agentATimer = document.getElementById('agent-a-timer');
    
    // Initialize DOM elements for Agent B
    agentBButton = document.getElementById('agent-b-button');
    agentBProjectSelect = document.getElementById('agent-b-project-select');
    agentBDropdown = document.getElementById('agent-b-dropdown');
    agentBTextarea = document.getElementById('agent-b-textarea');
    agentBLogs = document.getElementById('agent-b-logs');
    
    // Verify critical elements exist
    if (!agentAStopButton) {
        console.error('❌ Stop button not found in DOM!');
    } else {
        console.log('✅ Stop button found');
    }
    if (!agentATimer) {
        console.error('❌ Timer element not found in DOM!');
    } else {
        console.log('✅ Timer element found');
    }
    
    initializeEventListeners();
    connectToLogs();
    pollAgentStatus();
    loadAgentAProjects();
    
    // Check initial status and show button/timer if needed
    setTimeout(async () => {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            const statusLower = String(data.agent_a_status || '').toLowerCase();
            const isRunning = statusLower === 'running' || statusLower === 'started' || statusLower === 'start';
            
            if (isRunning && agentAStopButton) {
                agentAStopButton.classList.remove('hidden');
                agentAStopButton.style.display = 'block';
                agentAStopButton.style.visibility = 'visible';
            }
            
            if (isRunning && data.current_session && data.current_session.elapsed_seconds !== undefined) {
                if (!agentATimerInterval) {
                    agentASessionStartTime = Date.now() - (data.current_session.elapsed_seconds * 1000);
                    startAgentATimer();
                }
            }
        } catch (error) {
            console.error('Error checking initial status:', error);
        }
    }, 500);
    
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
            if (agentAStatus) agentAStatus.textContent = 'Загрузка проекта...';
            if (agentAResults) agentAResults.textContent = 'Парсинг проекта по ссылке...';
            
            try {
                const response = await fetch('/api/parse-kwork-project', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url }),
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'error') {
                    if (agentAStatus) agentAStatus.textContent = 'Error';
                    if (agentAResults) agentAResults.textContent = `Ошибка: ${data.message || 'Не удалось загрузить проект'}`;
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
                    
                    if (agentAStatus) agentAStatus.textContent = 'Success';
                    if (agentAResults) agentAResults.textContent = `✅ Проект загружен: ${data.project.title || 'Untitled'}`;
                }
            } catch (error) {
                console.error('Error loading project by URL:', error);
                if (agentAStatus) agentAStatus.textContent = 'Error';
                if (agentAResults) agentAResults.textContent = `Ошибка: ${error.message}`;
            } finally {
                agentALoadUrl.disabled = false;
                agentALoadUrl.textContent = 'Загрузить проект по ссылке';
            }
        });
    }
    
    // Agent A: Execute button
    if (agentAButton) {
        agentAButton.addEventListener('click', async () => {
        if (!agentAInput || !agentAStatus || !agentAResults) {
            console.error('❌ Required elements not found!');
            alert('Ошибка инициализации интерфейса. Перезагрузите страницу.');
            return;
        }
        
        const keyword = agentAInput.value ? agentAInput.value.trim() : '';
        const timeLeft = agentATimeLeft && agentATimeLeft.value ? parseInt(agentATimeLeft.value) : null;
        const hiredMin = agentAHiredMin && agentAHiredMin.value ? parseInt(agentAHiredMin.value) : null;
        const proposalsMax = agentAProposalsMax && agentAProposalsMax.value ? parseInt(agentAProposalsMax.value) : null;
        const budgetMin = agentABudget && agentABudget.value ? parseInt(agentABudget.value) : null;
        
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
        if (agentAStatus) agentAStatus.textContent = 'Running...';
        if (agentAResults) agentAResults.textContent = 'Starting search session...';
        
        // Show stop button and start timer
        console.log('🚀 Starting session - showing stop button and timer');
        if (agentAStopButton) {
            agentAStopButton.classList.remove('hidden');
            agentAStopButton.style.display = 'block';
            agentAStopButton.style.visibility = 'visible';
            agentAStopButton.disabled = false;
            console.log('✅ Stop button shown, classes:', agentAStopButton.className);
        } else {
            console.error('❌ Stop button is null!');
        }
        // Start timer immediately
        if (!agentATimerInterval) {
            startAgentATimer();
            console.log('✅ Timer started');
        } else {
            console.log('⚠️ Timer already running');
        }
        
        try {
            const requestBody = {};
            if (keyword) requestBody.keywords = keyword;
            if (timeLeft !== null) requestBody.timeLeft = timeLeft;
            if (hiredMin !== null) requestBody.hiredMin = hiredMin;
            if (proposalsMax !== null) requestBody.proposalsMax = proposalsMax;
            if (budgetMin !== null) requestBody.budgetMin = budgetMin;
            
            const response = await fetch('/agent/run-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            
            const data = await response.json();
            
            if (data.status === 'error' || data.status === 'busy') {
                if (agentAStatus) agentAStatus.textContent = data.message || 'Error';
                if (agentAResults) agentAResults.textContent = `Error: ${data.message || 'Unknown error'}`;
                // Hide stop button and stop timer on error
                if (agentAStopButton) {
                    agentAStopButton.classList.add('hidden');
                    agentAStopButton.style.display = 'none';
                }
                stopAgentATimer();
            } else {
                if (agentAStatus) agentAStatus.textContent = 'Started';
                if (agentAResults) agentAResults.textContent = 'Search session started. Check logs for progress...';
                
                // Ensure stop button is visible and timer is running
                if (agentAStopButton) {
                    agentAStopButton.classList.remove('hidden');
                    agentAStopButton.style.display = 'block';
                    agentAStopButton.style.visibility = 'visible';
                    agentAStopButton.disabled = false;
                }
                // Timer should already be started, but ensure it's running
                if (!agentATimerInterval) {
                    if (!agentASessionStartTime) {
                        agentASessionStartTime = Date.now();
                    }
                    startAgentATimer();
                }
                
                // Poll for results
                pollAgentResults();
            }
        } catch (error) {
            console.error('Error starting Agent A:', error);
            if (agentAStatus) agentAStatus.textContent = 'Error';
            if (agentAResults) agentAResults.textContent = `Error: ${error.message}`;
            // Hide stop button and stop timer on error
            if (agentAStopButton) {
                agentAStopButton.style.display = 'none';
            }
            stopAgentATimer();
        } finally {
            // Don't re-enable Execute button if session is running
            // It will be re-enabled when session stops
            const statusCheck = async () => {
                try {
                    const statusResponse = await fetch('/status');
                    const statusData = await statusResponse.json();
                    const statusLower = String(statusData.agent_a_status || '').toLowerCase();
                    if (statusLower !== 'running' && statusLower !== 'started' && statusLower !== 'start') {
                        if (agentAButton) {
                            agentAButton.disabled = false;
                            agentAButton.textContent = 'Execute';
                        }
                    }
                } catch (e) {
                    // If status check fails, re-enable button after a delay
                    setTimeout(() => {
                        if (agentAButton) {
                            agentAButton.disabled = false;
                            agentAButton.textContent = 'Execute';
                        }
                    }, 2000);
                }
            };
            // Check status after a short delay
            setTimeout(statusCheck, 1000);
        }
        });
    } else {
        console.error('❌ Agent A button not found!');
    }
    
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
                    if (agentAStatus) agentAStatus.textContent = 'Stopped';
                    if (agentAResults) agentAResults.textContent = 'Поиск остановлен пользователем.';
                    
                    // Hide stop button and stop timer
                    agentAStopButton.classList.add('hidden');
                    agentAStopButton.style.display = 'none';
                    stopAgentATimer();
                    
                    // Re-enable Execute button
                    if (agentAButton) {
                        agentAButton.disabled = false;
                        agentAButton.textContent = 'Execute';
                    }
                }
            } catch (error) {
                console.error('Error stopping Agent A:', error);
                if (agentAStatus) agentAStatus.textContent = 'Error stopping';
                // Still hide stop button and re-enable Execute on error
                agentAStopButton.classList.add('hidden');
                agentAStopButton.style.display = 'none';
                stopAgentATimer();
                if (agentAButton) {
                    agentAButton.disabled = false;
                    agentAButton.textContent = 'Execute';
                }
            } finally {
                agentAStopButton.disabled = false;
                agentAStopButton.textContent = 'Stop';
            }
        });
    }
    
    // Agent B: Generate button
    if (agentBButton) {
        agentBButton.addEventListener('click', async () => {
        if (!agentBDropdown || !agentBTextarea || !agentBLogs) {
            console.error('❌ Required Agent B elements not found!');
            alert('Ошибка инициализации интерфейса Agent B. Перезагрузите страницу.');
            return;
        }
        
        const template = agentBDropdown.value;
        const description = agentBTextarea.value ? agentBTextarea.value.trim() : '';
        const buildTypeRadio = document.querySelector('input[name="build-type"]:checked');
        const buildType = buildTypeRadio ? buildTypeRadio.value : 'mock';
        
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
        if (agentBLogs) agentBLogs.textContent = 'Starting MVP generation...\n';
        
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
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'error') {
                if (agentBLogs) {
                    const currentContent = agentBLogs.textContent || '';
                    agentBLogs.textContent = currentContent + `\n❌ Error: ${data.error || 'Unknown error'}`;
                    agentBLogs.scrollTop = agentBLogs.scrollHeight;
                }
            } else if (data.status === 'success') {
                if (agentBLogs) {
                    const currentContent = agentBLogs.textContent || '';
                    agentBLogs.textContent = currentContent + `\n✅ ${data.message || 'MVP generated successfully'}`;
                    if (data.deployUrl) {
                        agentBLogs.textContent += `\n🔗 Deploy URL: ${data.deployUrl}`;
                    }
                    if (data.template) {
                        agentBLogs.textContent += `\n📦 Template: ${data.template}`;
                    }
                    agentBLogs.scrollTop = agentBLogs.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Error generating MVP:', error);
            if (agentBLogs) {
                const currentContent = agentBLogs.textContent || '';
                agentBLogs.textContent = currentContent + `\n❌ Error: ${error.message}`;
                agentBLogs.scrollTop = agentBLogs.scrollHeight;
            }
        } finally {
            if (agentBButton) {
                agentBButton.disabled = false;
                agentBButton.textContent = 'Generate';
            }
        }
        });
    } else {
        console.error('❌ Agent B button not found!');
    }
}

// Load projects from Agent A
async function loadAgentAProjects() {
    try {
        const response = await fetch('/projects');
        if (!response.ok) {
            console.error('Failed to fetch projects:', response.status);
            return;
        }
        const data = await response.json();
        
        if (data.projects && data.projects.length > 0) {
            // Only update if we don't have a project loaded from URL
            // If agentAProjects has exactly 1 item and it was loaded from URL, don't overwrite
            const hasUrlProject = agentAProjects.length === 1 && agentAProjects[0] && agentAProjects[0].loadedFromUrl;
            
            if (!hasUrlProject) {
                // Take top 5 projects
                agentAProjects = data.projects.slice(0, 5);
                
                // Update dropdown options - add projects to dropdown for Agent B
                if (agentBProjectSelect) {
                    // Clear existing options except first
                    while (agentBProjectSelect.options.length > 1) {
                        agentBProjectSelect.remove(1);
                    }
                    
                    // Add projects to dropdown (A, B, C, D, E)
                    const projectLabels = ['A', 'B', 'C', 'D', 'E'];
                    agentAProjects.forEach((project, index) => {
                        if (index < 5) {
                            const option = document.createElement('option');
                            option.value = projectLabels[index];
                            const title = project.title || 'Untitled';
                            const shortTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
                            option.textContent = `Проект ${projectLabels[index]}: ${shortTitle}`;
                            agentBProjectSelect.appendChild(option);
                        }
                    });
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
    if (!logData) return;
    
    const { agent, message, timestamp } = logData;
    
    // Format timestamp
    const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
    const logLine = `[${time}] ${agent || 'System'}: ${message}`;
    
    // Append to Agent A results if it's Agent A related
    if ((agent === 'Agent A' || agent === 'API' || agent === 'Evaluator') && agentAResults) {
        const currentContent = agentAResults.textContent || '';
        if (currentContent === 'No data yet...' || currentContent === 'Starting search session...' || currentContent === '') {
            agentAResults.textContent = logLine;
        } else {
            agentAResults.textContent += '\n' + logLine;
        }
        // Auto-scroll to bottom
        agentAResults.scrollTop = agentAResults.scrollHeight;
    }
    
    // Append to Agent B logs if it's Agent B or MVP related
    if ((agent === 'Agent B' || agent === 'MVP' || (message && (message.includes('MVP') || message.includes('generation')))) && agentBLogs) {
        const currentContent = agentBLogs.textContent || '';
        if (currentContent === 'No data yet...' || currentContent === 'Starting MVP generation...' || currentContent === '') {
            agentBLogs.textContent = logLine;
        } else {
            agentBLogs.textContent += '\n' + logLine;
        }
        // Auto-scroll to bottom
        agentBLogs.scrollTop = agentBLogs.scrollHeight;
    }
}

// Timer functions for Agent A - просто и работает
function startAgentATimer() {
    if (!agentATimer) return;
    
    agentASessionStartTime = Date.now();
    if (agentATimerInterval) clearInterval(agentATimerInterval);
    
    agentATimerInterval = setInterval(() => {
        if (!agentASessionStartTime || !agentATimer) return;
        const elapsed = Math.floor((Date.now() - agentASessionStartTime) / 1000);
        const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        agentATimer.textContent = `${h}:${m}:${s}`;
    }, 1000);
}

function stopAgentATimer() {
    if (agentATimerInterval) {
        clearInterval(agentATimerInterval);
        agentATimerInterval = null;
    }
    agentASessionStartTime = null;
    if (agentATimer) agentATimer.textContent = '00:00:00';
}

// Poll Agent A status and results
function pollAgentStatus() {
    setInterval(async () => {
        try {
            const response = await fetch('/status');
            if (!response.ok) {
                console.error('Failed to fetch status:', response.status);
                return;
            }
            const data = await response.json();
            
            if (data.agent_a_status && agentAStatus) {
                agentAStatus.textContent = data.agent_a_status;
                
                // Простая логика: показывать кнопку когда running, скрывать когда stopped/waiting
                const statusLower = String(data.agent_a_status).toLowerCase();
                const isRunning = statusLower === 'running' || statusLower === 'started' || statusLower === 'start';
                
                if (agentAStopButton) {
                    if (isRunning) {
                        agentAStopButton.classList.remove('hidden');
                        agentAStopButton.style.display = 'block';
                        agentAStopButton.style.visibility = 'visible';
                        agentAStopButton.disabled = false;
                        // Запускаем таймер если не запущен
                        if (!agentATimerInterval && data.current_session?.elapsed_seconds !== undefined) {
                            agentASessionStartTime = Date.now() - (data.current_session.elapsed_seconds * 1000);
                            startAgentATimer();
                        } else if (!agentATimerInterval) {
                            if (!agentASessionStartTime) {
                                agentASessionStartTime = Date.now();
                            }
                            startAgentATimer();
                        }
                    } else {
                        agentAStopButton.classList.add('hidden');
                        agentAStopButton.style.display = 'none';
                        stopAgentATimer();
                        // Re-enable Execute button if session finished
                        if (agentAButton && !agentAButton.disabled) {
                            agentAButton.disabled = false;
                            agentAButton.textContent = 'Execute';
                        }
                    }
                }
            }
            
            if (data.projects_found !== undefined && agentAResults) {
                // Update results count
                const currentContent = agentAResults.textContent || '';
                if (data.projects_found > 0 && (currentContent === '' || currentContent.includes('No data yet...') || currentContent.includes('Starting'))) {
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
            if (!response.ok) {
                console.error('Failed to fetch projects:', response.status);
                return;
            }
            const data = await response.json();
            
            if (data.projects && data.projects.length > 0) {
                // Update agentAProjects array
                agentAProjects = data.projects.slice(0, 5);
                
                // Update results display
                if (agentAResults) {
                    let resultsText = `Found ${data.total || data.projects.length} project(s), ${data.suitable || 0} suitable:\n\n`;
                    
                    agentAProjects.forEach((project, index) => {
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
                    agentAResults.scrollTop = agentAResults.scrollHeight;
                }
                
                // Update dropdown in Agent B - only if not loaded from URL
                if (agentBProjectSelect && !(agentAProjects.length === 1 && agentAProjects[0] && agentAProjects[0].loadedFromUrl)) {
                    // Clear existing options except first
                    while (agentBProjectSelect.options.length > 1) {
                        agentBProjectSelect.remove(1);
                    }
                    
                    // Add projects to dropdown (A, B, C, D, E)
                    const projectLabels = ['A', 'B', 'C', 'D', 'E'];
                    agentAProjects.forEach((project, index) => {
                        if (index < 5) {
                            const option = document.createElement('option');
                            option.value = projectLabels[index];
                            const title = project.title || 'Untitled';
                            const shortTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
                            option.textContent = `Проект ${projectLabels[index]}: ${shortTitle}`;
                            agentBProjectSelect.appendChild(option);
                        }
                    });
                }
                
                // Check if session is still running
                try {
                    const statusResponse = await fetch('/status');
                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        const statusLower = String(statusData.agent_a_status || '').toLowerCase();
                        if (statusLower !== 'running' && statusLower !== 'started' && statusLower !== 'start') {
                            // Session finished, hide stop button and stop timer
                            if (agentAStopButton) {
                                agentAStopButton.classList.add('hidden');
                                agentAStopButton.style.display = 'none';
                            }
                            stopAgentATimer();
                            clearInterval(intervalId);
                            
                            // Re-enable Execute button
                            if (agentAButton) {
                                agentAButton.disabled = false;
                                agentAButton.textContent = 'Execute';
                            }
                        }
                    }
                } catch (statusError) {
                    console.error('Error checking status:', statusError);
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
                agentAStopButton.classList.add('hidden');
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

