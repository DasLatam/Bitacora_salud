document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const loginScreen = document.getElementById('login-screen');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const consultBackupBtn = document.getElementById('consult-backup-btn');
    // ... (el resto de las declaraciones de elementos no cambia)


    // --- NUEVA FUNCIÓN DE "HASH" SIMPLE ---
    // NO ES CRIPTOGRÁFICAMENTE SEGURO, pero oculta la contraseña
    function createSimpleHash(email, password) {
        const str = `${email.toLowerCase().trim()}:${password}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convertir a entero de 32bit
        }
        return `ph_${Math.abs(hash).toString(36)}`;
    }

    // --- LÓGICA DE LOGIN ACTUALIZADA ---
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            alert('Por favor, ingresa tu email y contraseña.');
            return;
        }

        const userData = getUserData(email);
        const passwordHash = createSimpleHash(email, password);

        // Si el usuario existe, se comprueba la contraseña
        if (userData) {
            if (userData.passwordHash === passwordHash) {
                sessionStorage.setItem('currentUser', email);
                checkSession();
            } else {
                alert('Contraseña incorrecta.');
            }
        } else {
            // Si el usuario es nuevo, se crea su registro
            const newUser_Data = {
                passwordHash: passwordHash,
                log: []
            };
            saveUserData(email, newUser_Data);
            sessionStorage.setItem('currentUser', email);
            checkSession();
        }
    });
    
    // --- LÓGICA DE RESTAURACIÓN ACTUALIZADA ---
    consultBackupBtn.addEventListener('click', async () => {
        const email = prompt("Para restaurar, ingresa tu correo:");
        if (!email) return;
        const password = prompt("Ahora ingresa tu contraseña:");
        if (!password) return;
    
        try {
            alert("Buscando tu última copia de seguridad en el servidor...");
            const response = await fetch(`${BACKEND_URL}/api/backup/${email}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
    
            const decodedDataString = atob(result.data);
            const backupData = JSON.parse(decodedDataString);
    
            // Verificación de la contraseña del backup
            const enteredHash = createSimpleHash(email, password);
            if (backupData.passwordHash !== enteredHash) {
                throw new Error("Contraseña incorrecta para esta copia de seguridad.");
            }
    
            localStorage.setItem(`bitacora_${email}`, decodedDataString);
            sessionStorage.setItem('currentUser', email);
            alert("¡Restauración completada! Cargando tu bitácora.");
            checkSession();
    
        } catch (error) {
            alert(`Error al restaurar el backup: ${error.message}`);
        }
    });

    // --- FUNCIONES DE DATOS MODIFICADAS ---
    function getUserData(email) {
        const key = `bitacora_${email}`;
        return JSON.parse(localStorage.getItem(key));
    }

    function saveUserData(email, data) {
        const key = `bitacora_${email}`;
        localStorage.setItem(key, JSON.stringify(data));
    }

    // getUserLog ahora es más simple
    function getUserLog() {
        const userEmail = sessionStorage.getItem('currentUser');
        const data = getUserData(userEmail);
        return data ? data.log : [];
    }

    async function addLogEntry(type, content) {
        let weatherData;
        try { weatherData = await getWeatherData(); } 
        catch (error) {
            alert(`Alerta: ${error.message}\nSe guardará el registro sin datos del clima.`);
            weatherData = { temperatura: 'N/A', sensacion_termica: 'N/A', humedad: 'N/A', ciudad: 'Ubicación no disponible' };
        }

        const newEntry = { id: Date.now(), tipo: type, contenido: content, timestamp: new Date().toISOString(), clima: weatherData };
        
        const userEmail = sessionStorage.getItem('currentUser');
        const userData = getUserData(userEmail);
        userData.log.push(newEntry); // Añade al log existente
        
        saveUserData(userEmail, userData); // Guarda el objeto completo
        renderLog();
        syncWithServer();
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

        console.log("Sincronizando con el servidor...");
        const userData = getUserData(userEmail); // Obtiene el objeto completo
        const dataToBackup = btoa(JSON.stringify(userData)); // Lo codifica

        try {
            const response = await fetch(`${BACKEND_URL}/api/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, data: dataToBackup })
            });
            if (response.ok) {
                console.log("Sincronización exitosa.");
            } else {
                const result = await response.json();
                console.error(`Error del servidor: ${result.message}`);
            }
        } catch (error) {
            console.error('No se pudo conectar con el servidor.', error);
        }
    }
    
    // --- EL RESTO DEL CÓDIGO (checkSession, renderLog, etc.) no necesita cambios en su lógica interna ---
    // (Pega el resto de tu script.js anterior aquí)
});

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const emailInput = document.getElementById('email-input');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserDisplay = document.getElementById('current-user-display');
    const logFoodBtn = document.getElementById('log-food-btn');
    const logSymptomBtn = document.getElementById('log-symptom-btn');
    const logSleepBtn = document.getElementById('log-sleep-btn');
    const logEntries = document.getElementById('log-entries');
    const shareLogBtn = document.getElementById('share-log-btn');
    const reminderBanner = document.getElementById('reminder-banner');
    const consultBackupBtn = document.getElementById('consult-backup-btn');
    const modalOverlay = document.getElementById('input-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalStatus = document.getElementById('modal-status');
    const modalSleepInput = document.getElementById('modal-sleep-input');
    const modalMicBtn = document.getElementById('modal-mic-btn');
    const modalStopBtn = document.getElementById('modal-stop-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- CONFIGURACIÓN ---
    const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4";
    const BACKEND_URL = 'https://bitacora-salud.vercel.app'; // URL de tu backend en Vercel
    let recognition; 

    // --- LÓGICA DE RESTAURACIÓN DE BACKUP ---
    consultBackupBtn.addEventListener('click', async () => {
        const email = prompt("Para restaurar, ingresa el correo de la copia de seguridad:");
        if (!email) return;

        try {
            alert("Buscando tu última copia de seguridad en el servidor...");
            const response = await fetch(`${BACKEND_URL}/api/backup/${email}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message);
            }

            const decodedDataString = atob(result.data);
            const logKey = `bitacora_${email}`;
            localStorage.setItem(logKey, decodedDataString);
            sessionStorage.setItem('currentUser', email);

            alert("¡Restauración completada! Cargando tu bitácora.");
            checkSession();

        } catch (error) {
            alert(`Error al restaurar el backup: ${error.message}`);
        }
    });

    // --- LÓGICA PRINCIPAL DE LA APP ---
    
    function checkSession() {
        const userEmail = sessionStorage.getItem('currentUser');
        if (userEmail) {
            loginScreen.classList.remove('active');
            appScreen.classList.add('active');
            currentUserDisplay.textContent = userEmail;
            checkForMissedLogs();
            renderLog();
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
        checkSession();
    });

    let currentLogType = '';
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
        if(recognition) recognition.stop();
        modalOverlay.classList.add('hidden');
    }
    
    logFoodBtn.addEventListener('click', () => openInputModal('comida', '🍎 ¿Qué ingeriste?'));
    logSymptomBtn.addEventListener('click', () => openInputModal('sintoma', '🤒 ¿Cómo te sentís?'));
    logSleepBtn.addEventListener('click', () => openInputModal('descanso', '😴 ¿Cuánto dormiste?'));
    
    modalCancelBtn.addEventListener('click', closeInputModal);
    
    modalSaveBtn.addEventListener('click', () => {
        let content = (currentLogType === 'descanso') ? modalSleepInput.value : modalTextarea.value.trim();
        if (content) {
            addLogEntry(currentLogType, content);
            closeInputModal();
        } else {
            alert('El campo no puede estar vacío.');
        }
    });

    modalMicBtn.addEventListener('click', () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Tu navegador no soporta voz."); return; }

        recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.interimResults = true;
        recognition.continuous = true;

        let final_transcript = modalTextarea.value;
        recognition.onstart = () => {
            modalStatus.classList.remove('hidden');
            modalMicBtn.classList.add('hidden');
            modalStopBtn.classList.remove('hidden');
            modalSaveBtn.disabled = true;
        };
        recognition.onresult = (event) => {
            let interim_transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript + '. ';
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            modalTextarea.value = final_transcript + interim_transcript;
        };
        recognition.onerror = (event) => { alert(`Error de voz: ${event.error}`); };
        recognition.onend = () => {
            modalStatus.classList.add('hidden');
            modalMicBtn.classList.remove('hidden');
            modalStopBtn.classList.add('hidden');
            modalSaveBtn.disabled = false;
        };
        recognition.start();
    });
    
    modalStopBtn.addEventListener('click', () => {
        if (recognition) {
            recognition.stop();
        }
    });

    function deleteLogEntry(id) {
        if (!confirm('¿Estás seguro de que quieres borrar este registro?')) return;
        let log = getUserLog();
        const newLog = log.filter(entry => entry.id !== parseInt(id));
        saveUserLog(newLog);
        renderLog();
        syncWithServer();
    }

    function formatLogForSharing() {
        const log = getUserLog();
        if (log.length === 0) return "No hay nada en la bitácora para compartir.";
        let text = "Resumen de mi Bitácora de Salud:\n\n";
        log.forEach(entry => {
            const date = new Date(entry.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            text += `--- ${formattedDate} ---\n`;
            let contentText = '';
            switch(entry.tipo) {
                case 'comida': contentText = `🍎 Comida: ${entry.contenido}`; break;
                case 'sintoma': contentText = `🤒 Síntoma: ${entry.contenido}`; break;
                case 'descanso': contentText = `😴 Descanso: ${entry.contenido} horas`; break;
            }
            text += `${contentText}\n`;
            const clima = entry.clima;
            if (clima && clima.ciudad !== 'Ubicación no disponible') {
                text += `(Clima: ${clima.temperatura.toFixed(1)}°C en ${clima.ciudad})\n`;
            }
            text += "\n";
        });
        return text;
    }

    shareLogBtn.addEventListener('click', async () => {
        const textToShare = formatLogForSharing();
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Mi Bitácora de Salud', text: textToShare });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(textToShare);
                alert('¡Bitácora copiada al portapapeles!');
            } else { throw new Error('Función no soportada'); }
        } catch (err) {
            console.error('Error al compartir:', err);
            alert('No se pudo compartir o copiar la bitácora.');
        }
    });

    async function getWeatherData() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) { return reject(new Error("Geolocalización no es soportada.")); }
            navigator.geolocation.getCurrentPosition(async (position) => {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${API_KEY}&units=metric&lang=es`;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Error del servidor de clima (código: ${response.status}).`);
                    const data = await response.json();
                    resolve({ temperatura: data.main.temp, sensacion_termica: data.main.feels_like, humedad: data.main.humidity, ciudad: data.name });
                } catch (error) { reject(error); }
            }, () => { reject(new Error("No se pudo obtener la ubicacion. Revisa los permisos.")); });
        });
    }

    async function addLogEntry(type, content) {
        let weatherData;
        try { weatherData = await getWeatherData(); } 
        catch (error) {
            alert(`Alerta: ${error.message}\nSe guardará el registro sin datos del clima.`);
            weatherData = { temperatura: 'N/A', sensacion_termica: 'N/A', humedad: 'N/A', ciudad: 'Ubicación no disponible' };
        }
        const newEntry = { id: Date.now(), tipo: type, contenido: content, timestamp: new Date().toISOString(), clima: weatherData };
        const log = getUserLog();
        log.push(newEntry);
        saveUserLog(log);
        renderLog();
        syncWithServer();
    }
    
    async function syncWithServer() {
        const userEmail = sessionStorage.getItem('currentUser');
        if (!userEmail) return;
        console.log("Intentando sincronizar con el servidor...");
        const log = getUserLog();
        const dataToBackup = btoa(JSON.stringify(log));
        try {
            const response = await fetch(`${BACKEND_URL}/api/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, data: dataToBackup })
            });
            if (!response.ok) {
                const result = await response.json();
                console.error(`El servidor de backup respondió con error: ${result.message}`);
            } else {
                console.log("Sincronización exitosa.");
            }
        } catch (error) {
            console.error('No se pudo conectar con el servidor de backup.', error);
        }
    }

    function getUserLog() {
        const userEmail = sessionStorage.getItem('currentUser');
        return JSON.parse(localStorage.getItem(`bitacora_${userEmail}`)) || [];
    }

    function saveUserLog(log) {
        const userEmail = sessionStorage.getItem('currentUser');
        localStorage.setItem(`bitacora_${userEmail}`, JSON.stringify(log));
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
            switch(entry.tipo) {
                case 'comida': contentHTML = `🍎 Comida: ${entry.contenido}`; break;
                case 'sintoma': contentHTML = `🤒 Síntoma: ${entry.contenido}`; break;
                case 'descanso': contentHTML = `😴 Descanso: ${entry.contenido} horas`; break;
            }
            const temp = typeof entry.clima.temperatura === 'number' ? entry.clima.temperatura.toFixed(1) : 'N/A';
            const climaHTML = `📍 ${entry.clima.ciudad} | 🌡️ ${temp}°C`;
            entryDiv.innerHTML = `<div class="log-entry-data"><div class="log-entry-header">${formattedDate}</div><div class="log-entry-content">${contentHTML}</div><div class="log-entry-meta">${climaHTML}</div></div><button class="delete-btn" data-id="${entry.id}">🗑️</button>`;
            logEntries.appendChild(entryDiv);
        });
    }

    logEntries.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const entryId = event.target.dataset.id;
            deleteLogEntry(entryId);
        }
    });
    
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
    
    // --- INICIALIZACIÓN ---
    checkSession();
});
