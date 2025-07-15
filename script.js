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
    const shareLogBtn = document.getElementById('share-log-btn');
    const reminderBanner = document.getElementById('reminder-banner');
    const backupBtn = document.getElementById('backup-btn');

    // --- ELEMENTOS DE LA VENTANA MODAL ---
    const modalOverlay = document.getElementById('input-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalTextInputContainer = document.getElementById('modal-text-input-container');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalStatus = document.getElementById('modal-status');
    const modalSleepInputContainer = document.getElementById('modal-sleep-input-container');
    const modalSleepInput = document.getElementById('modal-sleep-input');
    const modalMicBtn = document.getElementById('modal-mic-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- CONFIGURACIÓN ---
    const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4";
    const BACKEND_URL = 'http://localhost:3000'; // URL de tu futuro backend

    // --- LÓGICA DE LA APP ---
    
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

    let currentLogType = '';
    function openInputModal(type, title) {
        currentLogType = type;
        modalTitle.textContent = title;
        modalOverlay.classList.remove('hidden');

        if (type === 'descanso') {
            modalTextInputContainer.classList.add('hidden');
            modalSleepInputContainer.classList.remove('hidden');
            modalMicBtn.classList.add('hidden');
            modalSleepInput.value = 8;
        } else {
            modalTextInputContainer.classList.remove('hidden');
            modalSleepInputContainer.classList.add('hidden');
            modalMicBtn.classList.remove('hidden');
            modalTextarea.value = '';
        }
    }

    function closeInputModal() { modalOverlay.classList.add('hidden'); }
    
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

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.interimResults = true;
        recognition.continuous = true;

        let final_transcript = modalTextarea.value;
        recognition.onstart = () => {
            modalStatus.classList.remove('hidden');
            modalMicBtn.disabled = true;
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
            modalMicBtn.disabled = false;
            modalSaveBtn.disabled = false;
        };
        recognition.start();
    });

    function deleteLogEntry(id) {
        if (!confirm('¿Estás seguro de que quieres borrar este registro?')) return;
        let log = getUserLog();
        const newLog = log.filter(entry => entry.id !== parseInt(id));
        saveUserLog(newLog);
        renderLog();
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
        alert(`Registro de '${type}' guardado.`);
        if (!logContainer.classList.contains('hidden')) { renderLog(); }
    }

    function getUserLog() {
        const userEmail = sessionStorage.getItem('currentUser');
        return JSON.parse(localStorage.getItem(`bitacora_${userEmail}`)) || [];
    }

    function saveUserLog(log) {
        const userEmail = sessionStorage.getItem('currentUser');
        localStorage.setItem(`bitacora_${userEmail}`, JSON.stringify(log));
    }

    viewLogBtn.addEventListener('click', () => {
        logContainer.classList.toggle('hidden');