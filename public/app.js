let authToken = localStorage.getItem('token');


function randomString(length) {
    return Math.random().toString(36).substring(2, 2 + length);
}

function showFlashAlert(message, type = 'success') {
    const flashAlert = document.getElementById('flash-alert');
    flashAlert.innerHTML = message;
    flashAlert.className = `flash-alert ${type}`;
    setTimeout(() => {
        flashAlert.innerHTML = '';
        flashAlert.className = '';
    }, 3000);
}

// API calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(endpoint, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        const data = await response.json();
        
        if (!response.ok) {
            if (data.status === 401) {
                localStorage.removeItem('token');
                authToken = null;
                refreshUserInfo();
                return;
            }
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth functions
async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const data = await apiCall('/auth/register', 'POST', { name, email, password });
        const registerResult = document.getElementById('register-result');
        const userInfo = document.getElementById('user-info');
        userInfo.innerHTML = `
            <span id="user-name">${data.name}</span>
            <button onclick="logout()">Logout</button>
        `;

        registerResult.innerHTML = `Registration successful! Please login. ${data.name} ${data.email}`;
    } catch (error) {
        const registerResult = document.getElementById('register-result');
        registerResult.innerHTML = error.message;
    }
}

function loginAutofill() {
    document.getElementById('login-email').value = 'john.doe@example.com';
    document.getElementById('login-password').value = 'password123';
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiCall('/auth/login', 'POST', { email, password });
        authToken = data.token;
        localStorage.setItem('token', authToken);
        const loginResult = document.getElementById('login-result');
        loginResult.innerHTML = 'Login successful!';
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-result').innerHTML = '';
        refreshTopics();
    } catch (error) {
        const loginResult = document.getElementById('login-result');
        loginResult.innerHTML = error.message;
    }
}

// Topic functions
async function createTopic() {
    const name = document.getElementById('topic-name').value;
    const content = document.getElementById('topic-content').value;
    const parentTopicId = document.getElementById('parent-topic-id').value;

    try {
        await apiCall('/topics', 'POST', {
            name,
            content,
            parentTopicId: parentTopicId || null
        });
        showFlashAlert('Topic created successfully!', 'success');
        refreshTopics();
    } catch (error) {
        showFlashAlert(error.message, 'error');
    }
}

async function refreshTopics() {
    try {
        const topics = await apiCall('/topics/list');
        const container = document.getElementById('topics-container');
        container.innerHTML = '';

        topics.forEach(topic => {
            const topicCard = document.createElement('div');
            topicCard.className = 'topic-card';
            topicCard.innerHTML = `
                <h4>${topic.name}</h4>
                <p>${topic.content}</p>
                <p><small>ID: ${topic.id}</small></p>
                <p><small>Version: ${topic.version}</small></p>
                ${topic.parentTopicId ? `<p><small>Parent: ${topic.parentTopicId}</small></p>` : ''}
                <div class="topic-actions">
                    <button onclick="viewHierarchy('${topic.id}')">View Hierarchy</button>
                    <button onclick="showUpdateTopicForm('${topic.id}', '${topic.name}', '${topic.content}')">Update Topic</button>
                    <button onclick="showCreateChildForm('${topic.id}')">Create Child</button>
                </div>
                <div id="update-form-${topic.id}" style="display: none;" class="topic-form">
                    <h4>Update Topic</h4>
                    <input type="text" id="update-name-${topic.id}" value="${topic.name}">
                    <textarea id="update-content-${topic.id}">${topic.content}</textarea>
                    <button onclick="updateTopic('${topic.id}')">Save</button>
                    <button onclick="hideUpdateForm('${topic.id}')">Cancel</button>
                </div>
                <div id="child-form-${topic.id}" style="display: none;" class="topic-form">
                    <h4>Create Child Topic</h4>
                    <input type="text" id="child-name-${topic.id}" placeholder="Child Topic Name">
                    <textarea id="child-content-${topic.id}" placeholder="Child Topic Content"></textarea>
                    <button onclick="createChildTopic('${topic.id}')">Create</button>
                    <button onclick="hideChildForm('${topic.id}')">Cancel</button>
                </div>
            `;
            container.appendChild(topicCard);
        });
    } catch (error) {
        showFlashAlert(error.message, 'error');
    }
}

async function viewHierarchy(topicId) {
    try {
        const hierarchy = await apiCall(`/topics/${topicId}/hierarchy`);
        showFlashAlert(JSON.stringify(hierarchy, null, 2), 'success');
    } catch (error) {
        showFlashAlert(error.message, 'error');
    }
}

async function findPath() {
    const startId = document.getElementById('start-topic').value;
    const endId = document.getElementById('end-topic').value;

    try {
        const path = await apiCall(`/topics/${startId}/path/${endId}`);
        const resultDiv = document.getElementById('path-result');
        resultDiv.innerHTML = `<p>Path found: ${path.join(' → ')}</p>`;
    } catch (error) {
        showFlashAlert(error.message, 'error');
    }
}

function autofillForm() {
    document.getElementById('register-name').value = 'John Doe';
    document.getElementById('register-email').value = 'john.doe@example.com';
    document.getElementById('register-password').value = 'password123';
}

function loginAsAdmin() {
    document.getElementById('login-email').value = 'admin@admin.com';
    document.getElementById('login-password').value = 'admin';
    login().then(() => {
        refreshUserInfo();
    });
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = (panel.style.display === 'block' || !panel.style.display) ? 'none' : 'block';
    }

    // Toggle the arrow icon
    const arrow = document.querySelector(`#${panelId}-arrow`);
    if (arrow) {
        arrow.textContent = (panel.style.display === 'block' || !panel.style.display) ? '▼' : '►';
    }
}

// Topic update functions
function showUpdateTopicForm(topicId, name, content) {
    document.getElementById(`update-form-${topicId}`).style.display = 'block';
    document.getElementById(`update-name-${topicId}`).value = name;
    document.getElementById(`update-content-${topicId}`).value = content;
}

function hideUpdateForm(topicId) {
    document.getElementById(`update-form-${topicId}`).style.display = 'none';
}

async function updateTopic(topicId) {
    const name = document.getElementById(`update-name-${topicId}`).value;
    const content = document.getElementById(`update-content-${topicId}`).value;

    try {
        await apiCall(`/topics/${topicId}`, 'PUT', { name, content });
        hideUpdateForm(topicId);
        refreshTopics();
    } catch (error) {
        showFlashAlert(error.message, 'error');
    }
}

// Child topic functions
function showCreateChildForm(parentId) {
    document.getElementById(`child-form-${parentId}`).style.display = 'block';
}

function hideChildForm(parentId) {
    document.getElementById(`child-form-${parentId}`).style.display = 'none';
}

async function createChildTopic(parentId) {
    const name = document.getElementById(`child-name-${parentId}`).value;
    const content = document.getElementById(`child-content-${parentId}`).value;

    try {
        await apiCall('/topics', 'POST', {
            name,
            content,
            parentTopicId: parentId
        });
        hideChildForm(parentId);
        refreshTopics();
    } catch (error) {
        showFlashAlert(error.message, 'error');
    }
}

async function refreshUserInfo() {
    const userInfo = document.getElementById('user-info');

    if (!authToken) {
        userInfo.innerHTML = `
            <button onclick="login()">Login</button>
        `;
        return;
    }

    const data = await apiCall('/auth/user-info');
    if (data) {
        userInfo.innerHTML = `
            Logged in as:
            <span id="user-name">${data?.name}</span>
            <button onclick="logout()">Logout</button>
        `;
    } else {
        userInfo.innerHTML = `
            <button onclick="login()">Login</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    authToken = null;
    refreshUserInfo();
}

function autofillTopicForm() {
    document.getElementById('topic-name').value = randomString(10);
    document.getElementById('topic-content').value = randomString(100);
    document.getElementById('parent-topic-id').value = '';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        refreshTopics();
        refreshUserInfo();
    }
}); 