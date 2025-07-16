document.addEventListener('DOMContentLoaded', () => {
    // Declaraciones de elementos del DOM
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const consultBackupBtn = document.getElementById('consult-backup-btn');
    const mainLogActionsContainer = document.getElementById('log-actions-container');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserDisplay = document.getElementById('current-user-display');
    const logEntries = document.getElementById('log-entries');
    const shareLogBtn = document.getElementById('share-log-btn');
    const reminderBanner = document.getElementById('reminder-banner');
    const modalOverlay = document.getElementById('input-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalStatus = document.getElementById('modal-status');
    const modalSleepInput = document.getElementById('modal-sleep-input');
    const modalMicBtn = document.getElementById('modal-mic-btn');
    const modalStopBtn = document.getElementById('modal-stop-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // Configuración
    const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4";
    const BACKEND_URL = 'https://bitacora-salud.vercel.app';
    let recognition;
    let currentLogType = '';

    // Definición de Funciones
    function createSimpleHash(email, password) {
        const str = `${email.toLowerCase().trim()}:${password}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return `ph_${Math.abs(hash).toString(36)}`;
    }
    function getUserData(email) { return JSON.parse(localStorage.getItem(`bitacora_${email}`)); }
    function saveUserData(email, data) { localStorage.setItem(`bitacora_${email}`, JSON.stringify(data)); }
    function getUserLog() {
        const userEmail = sessionStorage.getItem('currentUser');
        const data = getUserData(userEmail);
        return data ? data.log || [] : [];
    }
    function checkSession() {
        const userEmail = sessionStorage.getItem('currentUser');
        if (userEmail) {
            loginScreen.classList.remove('active');
            appScreen.classList.add('active');
            currentUserDisplay.textContent = userEmail;
            renderLog();
        } else {
            loginScreen.classList.add('active');
            appScreen.classList.remove('active');
        }
    }
    async function addLogEntry(type, content) {
        let weatherData;
        try {
            weatherData = await getWeatherData();
        } catch (error) {
            console.error(error.message);
            weatherData = { temperatura: 'N/A', ciudad: 'Ubicación no disponible' };
        }
        const newEntry = { id: Date.now(), tipo: type, contenido: content, timestamp: new Date().toISOString(), clima: weatherData };
        const userEmail = sessionStorage.getItem('currentUser');
        const userData = getUserData(userEmail);
        if (userData && Array.isArray(userData.log)) {
            userData.log.push(newEntry);
            saveUserData(userEmail, userData);
            renderLog();
            syncWithServer();
        }
    }
    function deleteLogEntry(id) {
        if (!confirm('¿Estás seguro?')) return;
        const userEmail = sessionStorage.getItem('currentUser');
        const userData = getUserData(userEmail);
        userData.log = userData.log.filter(entry => entry.id !== parseInt(id));
        saveUserData(userEmail, userData);
        renderLog();
        syncWithServer();
    }
    async function syncWithServer() {
        const userEmail = sessionStorage.getItem('currentUser');
        if (!userEmail) return;
        const userData = getUserData(userEmail);
        const dataToBackup = btoa(JSON.stringify(userData));
        try {
            await fetch(`${BACKEND_URL}/api/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, data: dataToBackup })
            });
        } catch (error) { console.error('No se pudo conectar con el servidor.', error); }
    }
    function renderLog() {
        const log = getUserLog().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        logEntries.innerHTML = '';
        if (log.length === 0) { logEntries.innerHTML = '<p>Aún no hay registros.</p>'; return; }
        log.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('log-entry');
            if (entry.tipo === 'sintoma') entryDiv.classList.add('log-entry-symptom');
            const date = new Date(entry.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            let contentHTML = '';
            switch (entry.tipo) {
                case 'comida': contentHTML = `🍎 Comida: ${entry.contenido}`; break;
                case 'sintoma': contentHTML = `🤒 Síntoma: ${entry.contenido}`; break;
                case 'descanso': contentHTML = `😴 Descanso: ${entry.contenido} horas`; break;
                case 'agua': contentHTML = `💧 Agua: ${entry.contenido}`; break;
                case 'calidad_sueño': contentHTML = `🛌 Calidad del Sueño: ${entry.contenido}`; break;
                case 'animo': contentHTML = `😊 Estado de Ánimo: ${entry.contenido}`; break;
                case 'energia': contentHTML = `⚡ Nivel de Energía: ${entry.contenido}`; break;
                case 'actividad': contentHTML = `🏃 Actividad Física: ${entry.contenido}`; break;
                case 'estres': contentHTML = `🤯 Nivel de Estrés: ${entry.contenido}`; break;
                default: contentHTML = `📝 Registro: ${entry.contenido}`;
            }
            const temp = typeof entry.clima.temperatura === 'number' ? entry.clima.temperatura.toFixed(1) : 'N/A';
            const climaHTML = `📍 ${entry.clima.ciudad} | 🌡️ ${temp}°C`;
            entryDiv.innerHTML = `<div class="log-entry-data"><div class="log-entry-header">${formattedDate}</div><div class="log-entry-content">${contentHTML}</div><div class="log-entry-meta">${climaHTML}</div></div><button class="delete-btn" data-id="${entry.id}">🗑️</button>`;
            logEntries.appendChild(entryDiv);
        });
    }
    function openInputModal(type, title) {
        currentLogType = type;
        modalTitle.textContent = title;
        modalOverlay.classList.remove('hidden');
        if (type === 'descanso') {
            document.getElementById('modal-text-input-container').classList.add('hidden');
            document.getElementById('modal-sleep-input-container').classList.remove('hidden');
            modalMicBtn.classList.add('hidden');
            modalStopBtn.classList.add('hidden');
            modalSleepInput.value = 8;
        } else {
            document.getElementById('modal-text-input-container').classList.remove('hidden');
            document.getElementById('modal-sleep-input-container').classList.add('hidden');
            modalMicBtn.classList.remove('hidden');
            modalStopBtn.classList.add('hidden');
            modalTextarea.value = '';
        }
    }
    function closeInputModal() {
        if (recognition) recognition.stop();
        modalOverlay.classList.add('hidden');
    }
    async function getWeatherData() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${API_KEY}&units=metric&lang=es`;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Error del clima');
                    const data = await response.json();
                    resolve({ temperatura: data.main.temp, ciudad: data.name });
                } catch (error) { reject(error); }
            }, () => { reject(new Error("No se pudo obtener la ubicacion.")); });
        });
    }

    // Asignación de Eventos
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) return alert('Ingresa email y contraseña.');
        const userData = getUserData(email);
        const passwordHash = createSimpleHash(email, password);
        if (userData) {
            if (userData.passwordHash === passwordHash) {
                sessionStorage.setItem('currentUser', email);
                checkSession();
            } else {
                alert('Contraseña incorrecta.');
            }
        } else {
            const newUser_Data = { passwordHash: passwordHash, log: [] };
            saveUserData(email, newUser_Data);
            sessionStorage.setItem('currentUser', email);
            checkSession();
        }
    });
    document.querySelector('#login-screen form').addEventListener('submit', (e) => { e.preventDefault(); loginBtn.click(); });
    consultBackupBtn.addEventListener('click', async () => {
        const email = prompt("Ingresa el correo para restaurar:");
        if (!email) return;
        const password = prompt("Ahora ingresa tu contraseña:");
        if (!password) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/backup/${email}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            const decodedDataString = atob(result.data);
            const backupData = JSON.parse(decodedDataString);
            const enteredHash = createSimpleHash(email, password);
            if (backupData.passwordHash !== enteredHash) throw new Error("Contraseña incorrecta.");
            localStorage.setItem(`bitacora_${email}`, decodedDataString);
            sessionStorage.setItem('currentUser', email);
            alert("¡Restauración completada!");
            checkSession();
        } catch (error) { alert(`Error al restaurar: ${error.message}`); }
    });
    logoutBtn.addEventListener('click', () => { sessionStorage.removeItem('currentUser'); checkSession(); });
    mainLogActionsContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('option-btn')) {
            const categoryDiv = target.closest('.log-category');
            if (!categoryDiv) return;
            const logType = categoryDiv.dataset.logType;
            const logValue = target.dataset.logValue;
            categoryDiv.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            target.classList.add('selected');
            addLogEntry(logType, logValue);
        } else if (target.id === 'log-food-btn') {
            openInputModal('comida', '🍎 ¿Qué ingeriste?');
        } else if (target.id === 'log-symptom-btn') {
            openInputModal('sintoma', '🤒 ¿Cómo te sentís?');
        } else if (target.id === 'log-sleep-btn') {
            openInputModal('descanso', '😴 ¿Cuántas horas dormiste?');
        }
    });
    modalCancelBtn.addEventListener('click', closeInputModal);
    modalSaveBtn.addEventListener('click', () => {
        let content = (currentLogType === 'descanso') ? modalSleepInput.value : modalTextarea.value.trim();
        if (content) { addLogEntry(currentLogType, content); closeInputModal(); }
        else { alert('El campo no puede estar vacío.'); }
    });
    logEntries.addEventListener('click', (event) => { if (event.target.classList.contains('delete-btn')) { deleteLogEntry(event.target.dataset.id); } });
    shareLogBtn.addEventListener('click', () => {
        // ... (La lógica de compartir no es crítica para la estabilidad)
    });
    
    // Inicialización
    checkSession();
});