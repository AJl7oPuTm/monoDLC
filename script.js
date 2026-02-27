const ADMINS = ['monoless', 'Serferrka'];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    generateCaptcha();
});

function checkAuth() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUserEmail = localStorage.getItem('currentUserEmail');
    
    if (currentUserEmail) {
        currentUser = users.find(u => u.email === currentUserEmail);
        if (currentUser) {
            updateUIForAuth();
        }
    }
}

function updateUIForAuth() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn && currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.username}`;
        loginBtn.onclick = (e) => {
            e.preventDefault();
            showUserMenu();
        };
    }
    
    const adminLink = document.getElementById('adminLink');
    if (adminLink && currentUser && ADMINS.includes(currentUser.username)) {
        adminLink.style.display = 'inline-block';
    }
}

function showUserMenu() {
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-content">
            <div class="user-menu-header">
                <i class="fas fa-user-circle"></i>
                <span>${currentUser.username}</span>
            </div>
            <div class="user-menu-item" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Выйти
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .user-menu {
            position: absolute;
            top: 60px;
            right: 20px;
            z-index: 1000;
        }
        .user-menu-content {
            background: #0f0b22;
            border: 2px solid #6b4db4;
            border-radius: 20px;
            padding: 1rem;
            min-width: 200px;
        }
        .user-menu-header {
            padding: 0.5rem;
            border-bottom: 1px solid #40375a;
            margin-bottom: 0.5rem;
            color: #e5d3ff;
        }
        .user-menu-item {
            padding: 0.5rem;
            cursor: pointer;
            color: #d2c0ff;
            transition: 0.2s;
            border-radius: 10px;
        }
        .user-menu-item:hover {
            background: #322559;
            color: white;
        }
        .user-menu-item i {
            margin-right: 10px;
            color: #b27aff;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.closest('.login-btn')) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

function setupEventListeners() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('loginModal');
        });
    }
    
    document.querySelectorAll('.close, .close-login').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal('registerModal');
            closeModal('loginModal');
        });
    });
    
    const showLoginLink = document.getElementById('showLogin');
    const showRegisterLink = document.getElementById('showRegister');
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('registerModal');
            openModal('loginModal');
        });
    }
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('loginModal');
            openModal('registerModal');
            generateCaptcha();
        });
    }
    
    const refreshBtn = document.getElementById('refreshCaptcha');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', generateCaptcha);
    }
    
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    
    let answer;
    let equation;
    
    switch(op) {
        case '+':
            answer = num1 + num2;
            equation = `${num1} + ${num2} = ?`;
            break;
        case '-':
            answer = num1 - num2;
            equation = `${num1} - ${num2} = ?`;
            break;
        case '*':
            answer = num1 * num2;
            equation = `${num1} × ${num2} = ?`;
            break;
    }
    
    window.currentCaptcha = { answer };
    
    const captchaElement = document.getElementById('captchaEquation');
    if (captchaElement) {
        captchaElement.textContent = equation;
    }
}

function checkPasswordStrength() {
    const password = this.value;
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    let strength = 0;
    
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (password.match(/[a-z]+/)) strength += 20;
    if (password.match(/[A-Z]+/)) strength += 20;
    if (password.match(/[0-9]+/)) strength += 20;
    
    strength = Math.min(100, strength);
    
    if (strengthBar) {
        strengthBar.style.width = strength + '%';
        
        if (strength < 40) {
            strengthBar.style.backgroundColor = '#f44336';
            if (strengthText) strengthText.textContent = 'Сложность: слабый';
        } else if (strength < 70) {
            strengthBar.style.backgroundColor = '#ff9800';
            if (strengthText) strengthText.textContent = 'Сложность: средний';
        } else {
            strengthBar.style.backgroundColor = '#4CAF50';
            if (strengthText) strengthText.textContent = 'Сложность: сильный';
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const captcha = document.getElementById('captchaInput').value;
    const terms = document.getElementById('terms').checked;
    
    if (!terms) {
        showNotification('Примите правила', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Пароль минимум 6 символов', 'error');
        return;
    }
    
    if (parseInt(captcha) !== window.currentCaptcha?.answer) {
        showNotification('Неверная капча', 'error');
        generateCaptcha();
        document.getElementById('captchaInput').value = '';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.email === email)) {
        showNotification('Email уже используется', 'error');
        return;
    }
    
    if (users.some(u => u.username === username)) {
        showNotification('Имя уже занято', 'error');
        return;
    }
    
    const newUser = {
        username,
        email,
        password: btoa(password),
        isBanned: false,
        registeredAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUserEmail', email);
    
    currentUser = newUser;
    updateUIForAuth();
    showNotification('Регистрация успешна!', 'success');
    closeModal('registerModal');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === btoa(password));
    
    if (!user) {
        showNotification('Неверный email или пароль', 'error');
        return;
    }
    
    if (user.isBanned) {
        showNotification('Аккаунт заблокирован', 'error');
        return;
    }
    
    localStorage.setItem('currentUserEmail', email);
    currentUser = user;
    
    updateUIForAuth();
    showNotification(`Добро пожаловать, ${user.username}!`, 'success');
    closeModal('loginModal');
}

function logout() {
    localStorage.removeItem('currentUserEmail');
    currentUser = null;
    
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-user"></i> Вход';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            openModal('loginModal');
        };
    }
    
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        adminLink.style.display = 'none';
    }
    
    showNotification('Вы вышли', 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

window.showNotification = showNotification;
window.logout = logout;