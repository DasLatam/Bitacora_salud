document.addEventListener('DOMContentLoaded', () => {
    // Asegurarse de que jsPDF esté cargado
    const { jsPDF } = window.jspdf;

    // --- ELEMENTOS DEL DOM ---
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
    const pdfBtn = document.getElementById('pdf-btn');
    const conclusionsBtn = document.getElementById('conclusions-btn');
    const conclusionsModalOverlay = document.getElementById('conclusions-modal-overlay');
    const conclusionsContent = document.getElementById('conclusions-content');
    const closeConclusionsModalBtn = document.getElementById('close-conclusions-modal-btn');

    // --- CONFIGURACIÓN ---
    const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4";
    const BACKEND_URL = 'https://bitacora-salud.vercel.app'; // URL de tu backend en Vercel
    let recognition;

    // --- FUNCIÓN DE HASH SIMPLE ---
    function createSimpleHash(email, password) {
        const str = `${email.toLowerCase().trim()}:${password}`;
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return `ph_${Math.abs(hash).toString(36)}`;
    }

    // --- GESTIÓN DE DATOS ---
    function getUserData(email) {
        return JSON.parse(localStorage.getItem(`bitacora_${email}`));
    }
    function saveUserData(email, data) {
        localStorage.setItem(`bitacora_${email}`, JSON.stringify(data));
    }
    function getUserLog() {
        const userEmail = sessionStorage.getItem('currentUser');
        const data = getUserData(userEmail);
        return data ? data.log || [] : [];
    }

    // --- LÓGICA DE LA APP ---
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

    async function addLogEntry(type, content) {
        let weatherData;
        try {
            weatherData = await getWeatherData();
        } catch (error) {
            if (['comida', 'sintoma', 'descanso'].includes(type)) {
                alert(`Alerta: ${error.message}\nSe guardará el registro sin datos del clima.`);
            }
            console.error(error.message);
            weatherData = { temperatura: 'N/A', ciudad: 'Ubicación no disponible' };
        }
        const newEntry = { id: Date.now(), tipo: type, contenido: content, timestamp: new Date().toISOString(), clima: weatherData };
        const userEmail = sessionStorage.getItem('currentUser');
        const userData = getUserData(userEmail);
        if (userData && userData.log) {
            userData.log.push(newEntry);
            saveUserData(userEmail, userData);
            renderLog();
            syncWithServer();
        }
    }

    function deleteLogEntry(id) {
        if (!confirm('¿Estás seguro de que quieres borrar este registro?')) return;
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
            const response = await fetch(`${BACKEND_URL}/api/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, data: dataToBackup })
            });
            if (!response.ok) {
                const result = await response.json();
                console.error(`El servidor de backup respondió con error: ${result.message}`);
            }
        } catch (error) {
            console.error('No se pudo conectar con el servidor de backup.', error);
        }
    }

    // --- FUNCIONES DE VISUALIZACIÓN ---
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

    function checkForMissedLogs() {
        const log = getUserLog();
        if (!log || log.length === 0) { reminderBanner.classList.add('hidden'); return; }
        const lastEntry = log[log.length - 1];
        const lastEntryDate = new Date(lastEntry.timestamp);
        const now = new Date();
        const diffDays = Math.floor(Math.abs(now - lastEntryDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 1) {
            reminderBanner.textContent = `¡Hola! Parece que no has registrado nada en ${diffDays} día(s).`;
            reminderBanner.classList.remove('hidden');
        } else {
            reminderBanner.classList.add('hidden');
        }
    }

    // --- EVENT LISTENERS ---
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            alert('Por favor, ingresa tu email y contraseña.');
            return;
        }
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

    document.querySelector('#login-screen form').addEventListener('submit', (e) => {
        e.preventDefault();
        loginBtn.click();
    });

    consultBackupBtn.addEventListener('click', async () => {
        const email = prompt("Para restaurar, ingresa el correo:");
        if (!email) return;
        const password = prompt("Ahora ingresa tu contraseña:");
        if (!password) return;
        try {
            alert("Buscando tu última copia de seguridad...");
            const response = await fetch(`${BACKEND_URL}/api/backup/${email}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            const decodedDataString = atob(result.data);
            const backupData = JSON.parse(decodedDataString);
            const enteredHash = createSimpleHash(email, password);
            if (backupData.passwordHash !== enteredHash) {
                throw new Error("Contraseña incorrecta para esta copia de seguridad.");
            }
            localStorage.setItem(`bitacora_${email}`, decodedDataString);
            sessionStorage.setItem('currentUser', email);
            alert("¡Restauración completada!");
            checkSession();
        } catch (error) {
            alert(`Error al restaurar: ${error.message}`);
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        checkSession();
    });

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

    modalCancelBtn.addEventListener('click', () => closeInputModal());
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
        if (recognition) recognition.stop();
    });

    logEntries.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const entryId = event.target.dataset.id;
            deleteLogEntry(entryId);
        }
    });

    shareLogBtn.addEventListener('click', async () => {
        const textToShare = formatLogForSharing();
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Mi Bitácora de Salud', text: textToShare });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(textToShare);
                alert('¡Bitácora copiada al portapapeles!');
            }
        } catch (err) {
            console.error('Error al compartir:', err);
            alert('No se pudo compartir o copiar la bitácora.');
        }
    });

    pdfBtn.addEventListener('click', () => generatePDF());
    conclusionsBtn.addEventListener('click', () => analyzeLog());
    closeConclusionsModalBtn.addEventListener('click', () => {
        conclusionsModalOverlay.classList.add('hidden');
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
        if (recognition) recognition.stop();
        modalOverlay.classList.add('hidden');
    }

    // --- FUNCIONES DE ANÁLISIS Y PDF ---
    function generatePDF() {
        const log = getUserLog();
        if (log.length === 0) { alert("La bitácora está vacía."); return; }
        const doc = new jsPDF();
        let y = 15;
        doc.setFontSize(18);
        doc.text("Bitácora de Salud", 105, y, { align: 'center' });
        y += 15;
        const groupedLog = log.reduce((acc, entry) => {
            const date = new Date(entry.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) acc[date] = [];
            acc[date].push(entry);
            return acc;
        }, {});
        for (const date in groupedLog) {
            if (y > 270) { doc.addPage(); y = 15; }
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(date, 15, y);
            y += 8;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            groupedLog[date].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(entry => {
                if (y > 280) { doc.addPage(); y = 15; }
                let entryText = '';
                switch (entry.tipo) {
                    case 'comida': entryText = `🍎 Comida: ${entry.contenido}`; break;
                    case 'sintoma': entryText = `🤒 Síntoma: ${entry.contenido}`; break;
                    case 'descanso': entryText = `😴 Descanso: ${entry.contenido} horas`; break;
                    case 'agua': entryText = `💧 Agua: ${entry.contenido}`; break;
                    case 'calidad_sueño': entryText = `🛌 Calidad del Sueño: ${entry.contenido}`; break;
                    case 'animo': entryText = `😊 Ánimo: ${entry.contenido}`; break;
                    case 'energia': entryText = `⚡ Energía: ${entry.contenido}`; break;
                    case 'actividad': entryText = `🏃 Actividad: ${entry.contenido}`; break;
                    case 'estres': entryText = `🤯 Estrés: ${entry.contenido}`; break;
                    default: entryText = `📝 Registro: ${entry.contenido}`;
                }
                doc.text(entryText, 20, y);
                y += 6;
            });
            y += 5;
        }
        doc.save(`bitacora-salud-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    function analyzeLog() {
        const log = getUserLog();
        if (log.length === 0) { alert("No hay suficientes datos para analizar."); return; }
        let conclusionsHTML = '';
        const symptoms = log.filter(entry => entry.tipo === 'sintoma');
        if (symptoms.length === 0) {
            conclusionsHTML = '<p>¡No se han registrado síntomas! Eso es una excelente noticia.</p>';
        } else {
            symptoms.forEach(symptom => {
                const symptomTime = new Date(symptom.timestamp);
                const twentyFourHoursBefore = new Date(symptomTime.getTime() - (24 * 60 * 60 * 1000));
                const relevantEntries = log.filter(entry => {
                    const entryTime = new Date(entry.timestamp);
                    return entryTime >= twentyFourHoursBefore && entryTime < symptomTime;
                });
                let potentialTriggers = [];
                relevantEntries.forEach(entry => {
                    if (entry.tipo === 'estres' && entry.contenido === 'Alto') potentialTriggers.push('<li>Se reportó un <b>nivel de estrés alto</b>.</li>');
                    if (entry.tipo === 'calidad_sueño' && (entry.contenido === 'Mala' || entry.contenido === 'Regular')) potentialTriggers.push(`<li>La <b>calidad del sueño</b> fue reportada como "${entry.contenido}".</li>`);
                    if (entry.tipo === 'descanso' && parseFloat(entry.contenido) < 6) potentialTriggers.push(`<li>Se durmió menos de 6 horas (<b>${entry.contenido} horas</b>).</li>`);
                    if (entry.tipo === 'agua' && entry.contenido === 'Poco') potentialTriggers.push('<li>El <b>consumo de agua</b> fue bajo.</li>');
                });
                const symptomDate = symptomTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long'});
                conclusionsHTML += `<div class="conclusion-block"><h4>Para el síntoma "${symptom.contenido}" del ${symptomDate}:</h4>`;
                if (potentialTriggers.length > 0) {
                    const uniqueTriggers = [...new Set(potentialTriggers)];
                    conclusionsHTML += `<ul>${uniqueTriggers.join('')}</ul><p><b>Posible Conclusión:</b> Estos factores podrían haber contribuido a la aparición del síntoma.</p>`;
                } else {
                    conclusionsHTML += `<p>No se encontraron factores de riesgo comunes en las 24 horas previas.</p>`;
                }
                conclusionsHTML += `</div>`;
            });
        }
        conclusionsContent.innerHTML = conclusionsHTML;
        conclusionsModalOverlay.classList.remove('hidden');
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
            switch (entry.tipo) {
                case 'comida': contentText = `🍎 Comida: ${entry.contenido}`; break;
                case 'sintoma': contentText = `🤒 Síntoma: ${entry.contenido}`; break;
                case 'descanso': contentText = `😴 Descanso: ${entry.contenido} horas`; break;
                case 'agua': contentText = `💧 Agua: ${entry.contenido}`; break;
                case 'calidad_sueño': contentText = `🛌 Calidad del Sueño: ${entry.contenido}`; break;
                case 'animo': contentText = `😊 Estado de Ánimo: ${entry.contenido}`; break;
                case 'energia': contentText = `⚡ Nivel de Energía: ${entry.contenido}`; break;
                case 'actividad': contentText = `🏃 Actividad Física: ${entry.contenido}`; break;
                case 'estres': contentText = `🤯 Nivel de Estrés: ${entry.contenido}`; break;
                default: contentText = `📝 Registro: ${entry.contenido}`;
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

    // --- INICIALIZACIÓN ---
    checkSession();
});