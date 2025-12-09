// Authentication JavaScript

let currentUser = null;
let isAdmin = false;

// DOM Elements
let loginModal;
let loginForm;
let loginUsername;
let loginPassword;
let loginError;
let agentACard;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loginModal = document.getElementById('login-modal');
    loginForm = document.getElementById('login-form');
    loginUsername = document.getElementById('login-username');
    loginPassword = document.getElementById('login-password');
    loginError = document.getElementById('login-error');
    agentACard = document.getElementById('agent-a-card');
    
    // Check authentication status
    checkAuthStatus();
    
    // Setup login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status');
        if (!response.ok) {
            // Not authenticated - show login modal
            setTimeout(() => showLoginModal(), 100); // Small delay to ensure DOM is ready
            return;
        }
        
        const data = await response.json();
        if (data.authenticated) {
            currentUser = data.user;
            isAdmin = data.is_admin;
            hideLoginModal();
            updateUIForUser();
        } else {
            // Not authenticated - show login modal
            setTimeout(() => showLoginModal(), 100);
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        setTimeout(() => showLoginModal(), 100);
    }
}

// Show login modal
function showLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('hidden');
    }
    // Always blur Agent A when showing login (will be unblurred after admin login)
    if (agentACard) {
        blurAgentA();
    }
}

// Hide login modal
function hideLoginModal() {
    if (loginModal) {
        loginModal.classList.add('hidden');
    }
    // Unblur Agent A for admin users
    if (agentACard && isAdmin) {
        unblurAgentA();
    }
}

// Blur Agent A card
function blurAgentA() {
    if (agentACard) {
        agentACard.classList.add('blurred');
        
        // Add overlay message if not exists
        if (!agentACard.querySelector('.blur-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'blur-overlay';
            overlay.textContent = '🔒 Требуется авторизация администратора';
            agentACard.style.position = 'relative';
            agentACard.appendChild(overlay);
        }
        
        // Disable all inputs in Agent A
        const inputs = agentACard.querySelectorAll('input, button, select, textarea');
        inputs.forEach(input => {
            input.disabled = true;
        });
    }
}

// Unblur Agent A card
function unblurAgentA() {
    if (agentACard) {
        agentACard.classList.remove('blurred');
        
        // Remove overlay
        const overlay = agentACard.querySelector('.blur-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Enable all inputs in Agent A
        const inputs = agentACard.querySelectorAll('input, button, select, textarea');
        inputs.forEach(input => {
            input.disabled = false;
        });
    }
}

// Update UI based on user role
function updateUIForUser() {
    if (isAdmin) {
        // Admin: full access, no blur
        unblurAgentA();
    } else {
        // Regular user: blur Agent A
        blurAgentA();
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    if (!loginUsername || !loginPassword) {
        return;
    }
    
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    if (!username || !password) {
        showError('Пожалуйста, введите логин и пароль');
        return;
    }
    
    // Clear previous error
    hideError();
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            currentUser = data.user;
            isAdmin = data.user.role === 'admin';
            
            hideLoginModal();
            updateUIForUser();
            
            // Clear form
            loginUsername.value = '';
            loginPassword.value = '';
        } else {
            showError(data.message || 'Неверный логин или пароль');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Ошибка при входе. Попробуйте еще раз.');
    }
}

// Show error message
function showError(message) {
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    }
}

// Hide error message
function hideError() {
    if (loginError) {
        loginError.style.display = 'none';
        loginError.textContent = '';
    }
}

// Logout function (can be called from console or UI)
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            currentUser = null;
            isAdmin = false;
            showLoginModal();
            updateUIForUser();
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Make logout available globally
window.logout = logout;

