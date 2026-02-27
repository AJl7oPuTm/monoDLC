const ADMINS = ['monoless', 'Serferrka'];
let currentUser = null;
let allUsers = [];
let currentBanEmail = '';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    setupEventListeners();
    loadStats();
    loadUsers();
});

function checkAdminAccess() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUserEmail = localStorage.getItem('currentUserEmail');
    
    if (!currentUserEmail) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = users.find(u => u.email === currentUserEmail);
    
    if (!currentUser || !ADMINS.includes(currentUser.username)) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('adminName').textContent = currentUser.username;
}

function setupEventListeners() {
    document.getElementById('generateKeys').addEventListener('click', generateKeys);
    document.getElementById('activateKeyBtn').addEventListener('click', activateKey);
    document.getElementById('searchUsers').addEventListener('input', filterUsers);
    document.getElementById('copyAllKeys').addEventListener('click', copyAllKeys);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.querySelector('.close').addEventListener('click', closeBanModal);
}

function loadStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const keys = JSON.parse(localStorage.getItem('keys') || '[]');
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalKeys').textContent = keys.length;
    document.getElementById('activeSubs').textContent = subscriptions.length;
}

function loadUsers() {
    allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    displayUsers(allUsers);
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    
    users.forEach(user => {
        if (ADMINS.includes(user.username)) return;
        
        const tr = document.createElement('tr');
        const userSub = subscriptions.find(s => s.userEmail === user.email);
        
        let subText = 'Нет';
        let statusClass = 'status-expired';
        let statusText = 'Нет подписки';
        
        if (user.isBanned) {
            statusClass = 'status-banned';
            statusText = 'Заблокирован';
        } else if (userSub) {
            if (userSub.expires === 'forever') {
                subText = userSub.type + ' (навсегда)';
                statusClass = 'status-active';
                statusText = 'Активен';
            } else {
                const expiry = new Date(userSub.expires);
                if (expiry > new Date()) {
                    subText = userSub.type + ' (до ' + expiry.toLocaleDateString() + ')';
                    statusClass = 'status-active';
                    statusText = 'Активен';
                } else {
                    subText = userSub.type + ' (истекла)';
                    statusClass = 'status-expired';
                    statusText = 'Истекла';
                }
            }
        }
        
        tr.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>${subText}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    ${user.isBanned ? 
                        `<button class="action-btn unban" onclick="unbanUser('${user.email}')">
                            <i class="fas fa-check"></i> Разблокировать
                        </button>` :
                        `<button class="action-btn ban" onclick="showBanModal('${user.username}', '${user.email}')">
                            <i class="fas fa-ban"></i> Блокировать
                        </button>`
                    }
                    <button class="action-btn" onclick="removeSubscription('${user.email}')">
                        <i class="fas fa-clock"></i> Снять подписку
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function filterUsers() {
    const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
    
    const filtered = allUsers.filter(user => 
        !ADMINS.includes(user.username) && (
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        )
    );
    
    displayUsers(filtered);
}

function generateKeys() {
    const name = document.getElementById('keyName').value || 'Ключ';
    const duration = parseInt(document.getElementById('keyDuration').value);
    const type = document.getElementById('keyType').value;
    const count = parseInt(document.getElementById('keyCount').value);
    
    const keys = JSON.parse(localStorage.getItem('keys') || '[]');
    const newKeys = [];
    
    for (let i = 0; i < count; i++) {
        const key = generateKeyCode();
        const expires = duration === 9999 ? 'forever' : new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
        
        const keyObj = {
            code: key,
            name: name + ' #' + (i + 1),
            type: type,
            duration: duration,
            expires: expires,
            used: false,
            usedBy: null,
            usedAt: null,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.username
        };
        
        keys.push(keyObj);
        newKeys.push(keyObj);
    }
    
    localStorage.setItem('keys', JSON.stringify(keys));
    displayGeneratedKeys(newKeys);
    loadStats();
    showNotification(`Сгенерировано ${count} ключей`, 'success');
}

function generateKeyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'Mono-';
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
        if (i < 3) key += '-';
    }
    
    return key;
}

function displayGeneratedKeys(keys) {
    const container = document.getElementById('generatedKeys');
    const list = document.getElementById('keysList');
    
    list.innerHTML = '';
    
    keys.forEach(key => {
        const div = document.createElement('div');
        div.className = 'key-item';
        div.innerHTML = `
            <span>${key.code}</span>
            <span>
                <small>${key.type} | ${key.duration === 9999 ? 'навсегда' : key.duration + ' дней'}</small>
                <button class="copy-key" onclick="copyKey('${key.code}')">
                    <i class="fas fa-copy"></i>
                </button>
            </span>
        `;
        list.appendChild(div);
    });
    
    container.style.display = 'block';
}

function copyKey(code) {
    navigator.clipboard.writeText(code);
    showNotification('Ключ скопирован!', 'success');
}

function copyAllKeys() {
    const keys = JSON.parse(localStorage.getItem('keys') || '[]');
    const recentKeys = keys.slice(-50).map(k => k.code).join('\n');
    navigator.clipboard.writeText(recentKeys);
    showNotification('Все ключи скопированы!', 'success');
}

function activateKey() {
    const keyCode = document.getElementById('activateKeyInput').value.trim();
    
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
    
    key.used = true;
    key.usedBy = currentUser.email;
    key.usedAt = new Date().toISOString();
    
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    
    const oldSubIndex = subscriptions.findIndex(s => s.userEmail === currentUser.email);
    if (oldSubIndex !== -1) {
        subscriptions.splice(oldSubIndex, 1);
    }
    
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
    document.getElementById('activateKeyInput').value = '';
    loadStats();
    
    if (ADMINS.includes(currentUser.username)) {
        loadUsers();
    }
}

function showBanModal(username, email) {
    currentBanEmail = email;
    document.getElementById('banUserName').textContent = username;
    document.getElementById('banModal').style.display = 'block';
}

function closeBanModal() {
    document.getElementById('banModal').style.display = 'none';
}

function confirmBan() {
    const reason = document.getElementById('banReason').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === currentBanEmail);
    
    if (userIndex !== -1) {
        users[userIndex].isBanned = true;
        users[userIndex].banReason = reason;
        users[userIndex].bannedAt = new Date().toISOString();
        users[userIndex].bannedBy = currentUser.username;
        
        localStorage.setItem('users', JSON.stringify(users));
        
        const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
        const subIndex = subscriptions.findIndex(s => s.userEmail === currentBanEmail);
        if (subIndex !== -1) {
            subscriptions.splice(subIndex, 1);
            localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        }
        
        showNotification('Пользователь заблокирован', 'success');
        loadUsers();
        loadStats();
    }
    
    closeBanModal();
}

function unbanUser(email) {
    if (!confirm('Разблокировать пользователя?')) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex !== -1) {
        users[userIndex].isBanned = false;
        users[userIndex].banReason = null;
        users[userIndex].bannedAt = null;
        
        localStorage.setItem('users', JSON.stringify(users));
        showNotification('Пользователь разблокирован', 'success');
        loadUsers();
    }
}

function removeSubscription(email) {
    if (!confirm('Снять подписку?')) return;
    
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    const subIndex = subscriptions.findIndex(s => s.userEmail === email);
    
    if (subIndex !== -1) {
        subscriptions.splice(subIndex, 1);
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        showNotification('Подписка снята', 'success');
        loadUsers();
        loadStats();
    }
}

function logout(e) {
    e.preventDefault();
    localStorage.removeItem('currentUserEmail');
    window.location.href = 'index.html';
}

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

window.showBanModal = showBanModal;
window.closeBanModal = closeBanModal;
window.confirmBan = confirmBan;
window.unbanUser = unbanUser;
window.removeSubscription = removeSubscription;
window.copyKey = copyKey;
window.showNotification = showNotification;