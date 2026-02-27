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
    // Удаляем старое меню если есть
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) existingMenu.remove();
    
    // Получаем информацию о подписке
    const subscription = getUserSubscription();
    
    // Создаем меню
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-content">
            <div class="user-menu-header">
                <i class="fas fa-user-circle"></i>
                <span>${currentUser.username}</span>
            </div>
            
            <!-- Информация о регистрации -->
            <div class="user-menu-info">
                <i class="fas fa-calendar-check"></i>
                <div>
                    <small>Дата регистрации:</small>
                    <strong>${formatDate(currentUser.registeredAt)}</strong>
                </div>
            </div>
            
            <!-- Информация о подписке -->
            <div class="user-menu-subscription">
                <i class="fas fa-crown"></i>
                <div>
                    <small>Подписка:</small>
                    <strong class="${subscription.class}">${subscription.text}</strong>
                    ${subscription.expiryDate ? `<br><small>до ${subscription.expiryDate}</small>` : ''}
                </div>
            </div>
            
            <!-- Форма ввода ключа -->
            <div class="user-menu-key">
                <input type="text" id="menuKeyInput" placeholder="Введите ключ">
                <button onclick="activateKeyFromMenu()">
                    <i class="fas fa-key"></i>
                </button>
            </div>
            
            <!-- Кнопка выхода -->
            <div class="user-menu-item" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Выйти
            </div>
        </div>
    `;
    
    // Стили для меню
    const style = document.createElement('style');
    style.textContent = `
        .user-menu {
            position: absolute;
            top: 70px;
            right: 20px;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .user-menu-content {
            background: #0f0b22;
            border: 2px solid #6b4db4;
            border-radius: 20px;
            padding: 1.2rem;
            min-width: 280px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .user-menu-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding-bottom: 1rem;
            border-bottom: 1px solid #40375a;
            margin-bottom: 1rem;
            color: #e5d3ff;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .user-menu-header i {
            color: #ffd700;
            font-size: 2rem;
        }
        
        .user-menu-info, .user-menu-subscription {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.8rem;
            background: #1a1530;
            border-radius: 12px;
            margin-bottom: 0.8rem;
            border: 1px solid #40375a;
        }
        
        .user-menu-info i, .user-menu-subscription i {
            font-size: 1.3rem;
            color: #b27aff;
        }
        
        .user-menu-info div, .user-menu-subscription div {
            display: flex;
            flex-direction: column;
        }
        
        .user-menu-info small, .user-menu-subscription small {
            color: #a693d4;
            font-size: 0.8rem;
        }
        
        .user-menu-info strong, .user-menu-subscription strong {
            color: #e5d3ff;
            font-size: 1rem;
        }
        
        .subscription-active {
            color: #4CAF50 !important;
        }
        
        .subscription-expired {
            color: #f44336 !important;
        }
        
        .subscription-none {
            color: #ff9800 !important;
        }
        
        .user-menu-key {
            display: flex;
            gap: 8px;
            margin: 1rem 0;
            padding: 0.5rem;
            background: #221d38;
            border-radius: 30px;
            border: 1px solid #5d4a8d;
        }
        
        .user-menu-key input {
            flex: 1;
            background: transparent;
            border: none;
            padding: 0.5rem 1rem;
            color: white;
            font-size: 0.9rem;
        }
        
        .user-menu-key input:focus {
            outline: none;
        }
        
        .user-menu-key input::placeholder {
            color: #8a79b0;
        }
        
        .user-menu-key button {
            background: #322559;
            border: 2px solid #6a48b0;
            border-radius: 30px;
            width: 40px;
            height: 40px;
            color: white;
            cursor: pointer;
            transition: 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .user-menu-key button:hover {
            background: #4a2d79;
            border-color: #b27aff;
            transform: scale(1.05);
        }
        
        .user-menu-item {
            padding: 0.8rem;
            cursor: pointer;
            color: #d2c0ff;
            transition: 0.2s;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 0.5rem;
            border-top: 1px solid #40375a;
        }
        
        .user-menu-item:hover {
            background: #322559;
            color: white;
        }
        
        .user-menu-item i {
            color: #b27aff;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(menu);
    
    // Закрытие меню при клике вне его
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.closest('.login-btn')) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

function getUserSubscription() {
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    const userSub = subscriptions.find(s => s.userEmail === currentUser?.email);
    
    if (!userSub) {
        return {
            text: 'Нет активной подписки',
            class: 'subscription-none',
            expiryDate: null
        };
    }
    
    if (userSub.expires === 'forever') {
        return {
            text: 'Активна (навсегда)',
            class: 'subscription-active',
            expiryDate: null
        };
    }
    
    const expiryDate = new Date(userSub.expires);
    const now = new Date();
    
    if (expiryDate > now) {
        return {
            text: 'Активна',
            class: 'subscription-active',
            expiryDate: formatDate(expiryDate.toISOString())
        };
    } else {
        return {
            text: 'Истекла',
            class: 'subscription-expired',
            expiryDate: formatDate(userSub.expires)
        };
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function activateKeyFromMenu() {
    const keyInput = document.getElementById('menuKeyInput');
    const keyCode = keyInput.value.trim();
    
    if (!keyCode) {
        showNotification('Введите ключ', 'error');
        return;
    }
    
    const keys = JSON.parse(localStorage.getItem('keys') || '[]');
    const key = keys.find(k => k.code === keyCode && !k.used);
    
    if (!key) {
        showNotification('Недействительный ключ', 'error');
        return;
    }
    
    if (!currentUser) {
        showNotification('Сначала войдите', 'error');
        return;
    }
    
    // Активируем ключ
    key.used = true;
    key.usedBy = currentUser.email;
    key.usedAt = new Date().toISOString();
    
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    
    // Удаляем старую подписку
    const oldSubIndex = subscriptions.findIndex(s => s.userEmail === currentUser.email);
    if (oldSubIndex !== -1) {
        subscriptions.splice(oldSubIndex, 1);
    }
    
    // Добавляем новую
    subscriptions.push({
        userEmail: currentUser.email,
        userName: currentUser.username,
        type: key.type,
        duration: key.duration,
        expires: key.expires,
        activatedAt: new Date().toISOString(),
        keyCode: key.code
    });
    
    localStorage.setItem('keys', JSON.stringify(keys));
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    
    showNotification('Ключ активирован!', 'success');
    keyInput.value = '';
    
    // Обновляем меню
    document.querySelector('.user-menu')?.remove();
    showUserMenu();
}

function setupEventListeners() {
    // Кнопка входа
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('loginModal');
        });
    }
    
    // Закрытие модальных окон
    document.querySelectorAll('.close, .close-login').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal('registerModal');
            closeModal('loginModal');
        });
    });
    
    // Переключение между окнами
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
    
    // Обновление капчи
    const refreshBtn = document.getElementById('refreshCaptcha');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', generateCaptcha);
    }
    
    // Проверка сложности пароля
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Регистрация
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Вход
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

// Глобальные функции
window.showNotification = showNotification;
window.logout = logout;
window.activateKeyFromMenu = activateKeyFromMenu;