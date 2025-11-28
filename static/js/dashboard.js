// Dashboard JavaScript for Multi-Agent System

// DOM Elements
const agentAButton = document.getElementById('agent-a-button');
const agentAInput = document.getElementById('agent-a-input');
const agentATimeLeft = document.getElementById('agent-a-time-left');
const agentAHiredMin = document.getElementById('agent-a-hired-min');
const agentAProposalsMax = document.getElementById('agent-a-proposals-max');
const agentAStatus = document.getElementById('agent-a-status');
const agentAResults = document.getElementById('agent-a-results');

const agentBButton = document.getElementById('agent-b-button');
const agentBProjectSelect = document.getElementById('agent-b-project-select');
const agentBDropdown = document.getElementById('agent-b-dropdown');
const agentBTextarea = document.getElementById('agent-b-textarea');
const agentBLogs = document.getElementById('agent-b-logs');
const agentBImproveButton = document.getElementById('agent-b-improve-button');

// Dialog elements
const improveDialog = document.getElementById('improve-mvp-dialog');
const dialogCloseBtn = document.getElementById('dialog-close-btn');
const improveCancelBtn = document.getElementById('improve-cancel-btn');
const improveSubmitBtn = document.getElementById('improve-submit-btn');
const improveCommandInput = document.getElementById('improve-command-input');
const improveProjectNameInput = document.getElementById('improve-project-name');

// Store projects from Agent A
let agentAProjects = [];
let lastGeneratedMVP = null;

// SSE EventSource for logs
let logEventSource = null;

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
                    
                    // Automatically select template using AI
                    if (descriptionText.length >= 10) {
                        await selectTemplateAutomatically(descriptionText);
                    }
                }
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
                // Store last generated MVP info for improvement
                lastGeneratedMVP = {
                    projectName: data.projectName || data.template + '-' + Date.now(),
                    deployUrl: data.deployUrl,
                    template: data.template
                };
                // Show improve button
                if (agentBImproveButton) {
                    agentBImproveButton.style.display = 'inline-block';
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
    
    // Agent B: Improve MVP button
    if (agentBImproveButton) {
        agentBImproveButton.addEventListener('click', () => {
            if (!lastGeneratedMVP) {
                alert('Сначала сгенерируйте MVP');
                return;
            }
            openImproveDialog();
        });
    }
    
    // Dialog handlers
    if (dialogCloseBtn) {
        dialogCloseBtn.addEventListener('click', closeImproveDialog);
    }
    if (improveCancelBtn) {
        improveCancelBtn.addEventListener('click', closeImproveDialog);
    }
    if (improveSubmitBtn) {
        improveSubmitBtn.addEventListener('click', submitImprovement);
    }
    // Close dialog on overlay click
    if (improveDialog) {
        improveDialog.addEventListener('click', (e) => {
            if (e.target === improveDialog) {
                closeImproveDialog();
            }
        });
    }
}

// Load projects from Agent A
async function loadAgentAProjects() {
    try {
        const response = await fetch('/projects');
        const data = await response.json();
        
        if (data.projects && data.projects.length > 0) {
            // Take top 5 projects
            agentAProjects = data.projects.slice(0, 5);
            
            // Update dropdown options
            if (agentBProjectSelect) {
                // Clear existing options except first
                while (agentBProjectSelect.options.length > 1) {
                    agentBProjectSelect.remove(1);
                }
                
                // Add project options
                agentAProjects.forEach((project, index) => {
                    const option = document.createElement('option');
                    option.value = String.fromCharCode(65 + index); // A, B, C, D, E
                    const title = project.title || 'Untitled';
                    const shortTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
                    option.textContent = `Проект ${String.fromCharCode(65 + index)}: ${shortTitle}`;
                    agentBProjectSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading Agent A projects:', error);
    }
}

// Open improve MVP dialog
function openImproveDialog() {
    if (improveDialog && lastGeneratedMVP) {
        improveDialog.style.display = 'flex';
        if (improveProjectNameInput) {
            improveProjectNameInput.value = lastGeneratedMVP.projectName || '';
        }
        if (improveCommandInput) {
            improveCommandInput.value = '';
            improveCommandInput.focus();
        }
    }
}

// Close improve MVP dialog
function closeImproveDialog() {
    if (improveDialog) {
        improveDialog.style.display = 'none';
    }
}

// Automatically select template based on description
async function selectTemplateAutomatically(description) {
    if (!agentBDropdown) return;
    
    // Show loading state
    agentBDropdown.disabled = true;
    agentBDropdown.style.borderColor = '#4299e1';
    agentBDropdown.style.backgroundColor = '#ebf8ff';
    
    // Show loading message
    if (agentBLogs) {
        agentBLogs.textContent = '🤖 Архитектор анализирует описание и выбирает шаблон...\n';
    }
    
    try {
        const response = await fetch('/api/select-template', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: description
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success' && data.template) {
            // Set selected template
            agentBDropdown.value = data.template;
            agentBDropdown.style.borderColor = '#48bb78';
            agentBDropdown.style.backgroundColor = '#f0fff4';
            
            // Get template name for display
            const templateOption = agentBDropdown.options[agentBDropdown.selectedIndex];
            const templateName = templateOption ? templateOption.text : data.template;
            
            // Show success message
            if (agentBLogs) {
                const confidencePercent = (data.confidence * 100).toFixed(1);
                agentBLogs.textContent = `✅ Шаблон автоматически выбран: ${templateName}\n📊 Уверенность: ${confidencePercent}%\n💡 ${data.reasoning || 'Шаблон выбран на основе анализа описания проекта'}\n\nГотово к генерации MVP!`;
            }
            
            setTimeout(() => {
                agentBDropdown.style.borderColor = '';
                agentBDropdown.style.backgroundColor = '';
            }, 4000);
        } else {
            // Show error but don't block
            if (agentBLogs) {
                agentBLogs.textContent += `\n⚠️ Автоматический выбор шаблона не удался: ${data.error || 'Unknown error'}\nВыберите шаблон вручную.`;
            }
            agentBDropdown.style.borderColor = '';
            agentBDropdown.style.backgroundColor = '';
        }
    } catch (error) {
        console.error('Error selecting template:', error);
        if (agentBLogs) {
            agentBLogs.textContent += `\n❌ Ошибка при выборе шаблона: ${error.message}\nВыберите шаблон вручную.`;
        }
        agentBDropdown.style.borderColor = '';
        agentBDropdown.style.backgroundColor = '';
    } finally {
        agentBDropdown.disabled = false;
    }
}

// Submit improvement command
async function submitImprovement() {
    const command = improveCommandInput.value.trim();
    const projectName = improveProjectNameInput.value.trim();
    
    if (!command) {
        alert('Пожалуйста, введите команду для доработки');
        return;
    }
    
    if (!projectName) {
        alert('Название проекта не найдено');
        return;
    }
    
    improveSubmitBtn.disabled = true;
    improveSubmitBtn.textContent = 'Применяю...';
    
    try {
        const response = await fetch('/api/improve-mvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectName: projectName,
                command: command
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'error') {
            alert(`Ошибка: ${data.error || 'Unknown error'}`);
        } else if (data.status === 'success') {
            agentBLogs.textContent += `\n✅ Доработка применена: ${command}`;
            if (data.message) {
                agentBLogs.textContent += `\n${data.message}`;
            }
            closeImproveDialog();
        }
    } catch (error) {
        console.error('Error improving MVP:', error);
        alert(`Ошибка: ${error.message}`);
    } finally {
        improveSubmitBtn.disabled = false;
        improveSubmitBtn.textContent = 'Применить доработку';
    }
}

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

// Poll Agent A status and results
function pollAgentStatus() {
    setInterval(async () => {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            if (data.agent_a_status) {
                agentAStatus.textContent = data.agent_a_status;
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
                clearInterval(intervalId);
            }
        } catch (error) {
            console.error('Error polling results:', error);
        }
        
        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(intervalId), 300000);
    }, 3000); // Poll every 3 seconds
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (logEventSource) {
        logEventSource.close();
    }
});

