document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const emailInput = document.getElementById('email-input');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserDisplay = document.getElementById('current-user-display');
    
    const logFoodBtn = document.getElementById('log-food-btn');
    const logSymptomBtn = document.getElementById('log-symptom-btn');
    const logSleepBtn = document.getElementById('log-sleep-btn');

    const viewLogBtn = document.getElementById('view-log-btn');
    const logContainer = document.getElementById('log-container');
    const logEntries = document.getElementById('log-entries');
    
    const reminderBanner = document.getElementById('reminder-banner');
    const backupBtn = document.getElementById('backup-btn');

    // --- ELEMENTOS DE LA VENTANA MODAL ---
    const modalOverlay = document.getElementById('input-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalStatus = document.getElementById('modal-status');
    const modalMicBtn = document.getElementById('modal-mic-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- TU CLAVE API ---
    const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4";
    
    // --- LÓGICA DE LA APP ---

    // 1. GESTIÓN DE SESIÓN
    function checkSession() {
        const userEmail = sessionStorage.getItem('currentUser');
        if (userEmail) {
            loginScreen.classList.remove('active');
            appScreen.classList.add('active');
            currentUserDisplay.textContent = userEmail;
            checkForMissedLogs();
        } else {
            loginScreen.classList.add('active');
            appScreen.classList.remove('active');
        }
    }

    loginBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (email) {
            sessionStorage.setItem('currentUser', email);
            checkSession();
        } else {
            alert('Por favor, ingresa un correo válido.');
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        logContainer.classList.add('hidden');
        checkSession();
    });

    // 2. GESTIÓN DE LA VENTANA MODAL
    let currentLogType = '';
    function openInputModal(type, title) {
        currentLogType = type;
        modalTitle.textContent = title;
        modalTextarea.value = '';
        modalOverlay.classList.remove('hidden');
    }

    function closeInputModal() {
        modalOverlay.classList.add('hidden');
    }

    logFoodBtn.addEventListener('click', () => openInputModal('comida', '🍎 ¿Qué ingeriste?'));
    logSymptomBtn.addEventListener('click', () => openInputModal('sintoma', '🤒 ¿Cómo te sentís?'));
    logSleepBtn.addEventListener('click', () => openInputModal('descanso', '😴 ¿Cuánto dormiste?'));
    
    modalCancelBtn.addEventListener('click', closeInputModal);
    
    modalSaveBtn.addEventListener('click', () => {
        const content = modalTextarea.value.trim();
        if (content) {
            addLogEntry(currentLogType, content);
            closeInputModal();
        } else {
            alert('El campo no puede estar vacío.');
        }
    });

    // 3. RECONOCIMIENTO DE VOZ CON MEJOR CONTROL
    modalMicBtn.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta el reconocimiento de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.interimResults = false;

        recognition.onstart = () => {
            modalStatus.classList.remove('hidden');
            modalMicBtn.disabled = true;
            modalSaveBtn.disabled = true;
        };
        recognition.onresult = (event) => {
            modalTextarea.value += event.results[0][0].transcript + ' ';
        };
        recognition.onerror = (event) => {
            alert(`Error de voz: ${event.error}`);
        };
        recognition.onend = () => {
            modalStatus.classList.add('hidden');
            modalMicBtn.disabled = false;
            modalSaveBtn.disabled = false;
        };

        recognition.start();
    });

    // 4. LÓGICA DE REGISTRO Y CLIMA
    async function getWeatherData() {
        // ... (Esta función no cambia)
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error("Geolocalización no es soportada."));
            }
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=es`;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Error del servidor de clima (código: ${response.status}).`);
                    const data = await response.json();
                    resolve({ temperatura: data.main.temp, sensacion_termica: data.main.feels_like, humedad: data.main.humidity, ciudad: data.name });
                } catch (error) { reject(error); }
            }, (error) => {
                reject(new Error("No se pudo obtener la ubicacion. Revisa los permisos."));
            });
        });
    }

    async function addLogEntry(type, content) {
        let weatherData;
        try {
            weatherData = await getWeatherData();
        } catch (error) {
            alert(`Alerta: ${error.message}\nSe guardará el registro sin datos del clima.`);
            weatherData = { temperatura: 'N/A', sensacion_termica: 'N/A', humedad: 'N/A', ciudad: 'Ubicación no disponible' };
        }

        const newEntry = { id: Date.now(), tipo: type, contenido: content, timestamp: new Date().toISOString(), clima: weatherData };

        const log = getUserLog();
        log.push(newEntry);
        saveUserLog(log);

        alert(`Registro de '${type}' guardado.`);
        if (!logContainer.classList.contains('hidden')) {
            renderLog();
        }
    }
    
    // --- FUNCIONES DE VISUALIZACIÓN Y OTRAS (no cambian) ---

    function getUserLog() {
        const userEmail = sessionStorage.getItem('currentUser');
        const logKey = `bitacora_${userEmail}`;
        return JSON.parse(localStorage.getItem(logKey)) || [];
    }

    function saveUserLog(log) {
        const userEmail = sessionStorage.getItem('currentUser');
        const logKey = `bitacora_${userEmail}`;
        localStorage.setItem(logKey, JSON.stringify(log));
    }

    viewLogBtn.addEventListener('click', () => {
        logContainer.classList.toggle('hidden');
        if (!logContainer.classList.contains('hidden')) renderLog();
    });

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
            switch(entry.tipo) {
                case 'comida': contentHTML = `🍎 Comida: ${entry.contenido}`; break;
                case 'sintoma': contentHTML = `🤒 Síntoma: ${entry.contenido}`; break;
                case 'descanso': contentHTML = `😴 Descanso: ${entry.contenido}`; break;
            }
            
            const temp = typeof entry.clima.temperatura === 'number' ? entry.clima.temperatura.toFixed(1) : 'N/A';
            const sens = typeof entry.clima.sensacion_termica === 'number' ? entry.clima.sensacion_termica.toFixed(1) : 'N/A';
            const climaHTML = `📍 ${entry.clima.ciudad} | 🌡️ ${temp}°C (sensación ${sens}°C) | 💧 ${entry.clima.humedad}%`;

            entryDiv.innerHTML = `<div class="log-entry-header">${formattedDate}</div><div class="log-entry-content">${contentHTML}</div><div class="log-entry-meta">${climaHTML}</div>`;
            logEntries.appendChild(entryDiv);
        });
    }
    
    function checkForMissedLogs() {
        const log = getUserLog();
        if (log.length === 0) return;
        const lastEntryDate = new Date(log[log.length - 1].timestamp);
        const now = new Date();
        const diffDays = Math.floor(Math.abs(now - lastEntryDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 1) {
            reminderBanner.textContent = `¡Hola! Parece que no has registrado nada en ${diffDays} día(s).`;
            reminderBanner.classList.remove('hidden');
        } else {
            reminderBanner.classList.add('hidden');
        }
    }

    backupBtn.addEventListener('click', () => {
        const log = getUserLog();
        if (log.length === 0) { alert('No hay datos para respaldar.'); return; }
        const dataToBackup = btoa(JSON.stringify(log));
        alert('Copia de seguridad preparada. Esta función requiere un servidor para funcionar.');
        console.log("Datos para enviar al servidor (en Base64):", dataToBackup);
    });

    // --- INICIALIZACIÓN ---
    checkSession();
});