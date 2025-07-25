document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DECLARACIÓN DE ELEMENTOS DEL DOM ---
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const loginForm = document.querySelector('#login-screen form');
    const consultBackupBtn = document.getElementById('consult-backup-btn');
    const mainLogActionsContainer = document.getElementById('log-actions-container');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUserDisplay = document.getElementById('current-user-display');
    const logEntries = document.getElementById('log-entries');
    const shareLogBtn = document.getElementById('share-log-btn');
    const reminderBanner = document.getElementById('reminder-banner');
    const inputModalOverlay = document.getElementById('input-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalStatus = document.getElementById('modal-status');
    const modalSleepInput = document.getElementById('modal-sleep-input-container'); // Contenedor
    const sleepMinusBtn = document.getElementById('sleep-minus-btn');
    const sleepPlusBtn = document.getElementById('sleep-plus-btn');
    const sleepHoursDisplay = document.getElementById('sleep-hours-display');
    const modalMicBtn = document.getElementById('modal-mic-btn');
    const modalStopBtn = document.getElementById('modal-stop-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const dailySummaryModalOverlay = document.getElementById('daily-summary-modal-overlay');
    const logActionsCategories = document.getElementById('log-actions-categories');
    const logModalOverlay = document.getElementById('log-modal-overlay');
    const pdfBtn = document.getElementById('pdf-btn');
    const conclusionsBtn = document.getElementById('conclusions-btn');
    const conclusionsModalOverlay = document.getElementById('conclusions-modal-overlay');
    const conclusionsContent = document.getElementById('conclusions-content');
    const logFoodBtn = document.getElementById('log-food-btn');
    const logSleepBtn = document.getElementById('log-sleep-btn');
    const logSymptomBtn = document.getElementById('log-symptom-btn');
    const dailySummaryBtn = document.getElementById('daily-summary-btn');
    const viewLogBtn = document.getElementById('view-log-btn');
    
    // --- CONFIGURACIÓN Y ESTADO GLOBAL ---
    const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4";
    const BACKEND_URL = 'https://bitacora-salud.vercel.app';
    let recognition;
    let currentLogType = '';

    // --- 2. DEFINICIÓN DE FUNCIONES ---

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
        if (!userEmail) return [];
        const data = getUserData(userEmail);
        return data ? data.log || [] : [];
    }

    function checkSession() {
        const userEmail = sessionStorage.getItem('currentUser');
        if (userEmail) {
            loginScreen.classList.remove('active');
            appScreen.classList.add('active');
            if(currentUserDisplay) currentUserDisplay.textContent = userEmail;
            renderLog();
        } else {
            loginScreen.classList.add('active');
            appScreen.classList.remove('active');
        }
    }

    async function addLogEntry(type, content) {
        let weatherData;
        try { weatherData = await getWeatherData(); } 
        catch (error) {
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
        if (!userData) return;
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
        if(logEntries) {
            logEntries.innerHTML = '';
            if (log.length === 0) {
                logEntries.innerHTML = '<p>Aún no hay registros.</p>';
            } else {
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
                    let climaHTML = '📍 Clima no disponible';
                    if (entry.clima) {
                        const temp = typeof entry.clima.temperatura === 'number' ? entry.clima.temperatura.toFixed(1) : 'N/A';
                        climaHTML = `📍 ${entry.clima.ciudad} | 🌡️ ${temp}°C`;
                    }
                    entryDiv.innerHTML = `<div class="log-entry-data"><div class="log-entry-header">${formattedDate}</div><div class="log-entry-content">${contentHTML}</div><div class="log-entry-meta">${climaHTML}</div></div><button class="delete-btn" data-id="${entry.id}">🗑️</button>`;
                    logEntries.appendChild(entryDiv);
                });
            }
        }
        updateButtonStates();
        checkForMissedLogs();
    }
    
    function updateButtonStates() {
        const log = getUserLog();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLog = log.filter(entry => new Date(entry.timestamp) >= today);
        
        document.querySelectorAll('.log-category').forEach(categoryDiv => {
            const logType = categoryDiv.dataset.logType;
            const latestEntryForCategory = todayLog.filter(entry => entry.tipo === logType).pop();
            categoryDiv.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            if (latestEntryForCategory) {
                const buttonToSelect = categoryDiv.querySelector(`.option-btn[data-log-value="${latestEntryForCategory.contenido}"]`);
                if (buttonToSelect) buttonToSelect.classList.add('selected');
            }
        });

        const hasFoodLog = todayLog.some(entry => entry.tipo === 'comida');
        const hasSleepLog = todayLog.some(entry => entry.tipo === 'descanso');
        const hasSymptomLog = todayLog.some(entry => entry.tipo === 'sintoma');
        if (logFoodBtn) logFoodBtn.classList.toggle('completed', hasFoodLog);
        if (logSleepBtn) logSleepBtn.classList.toggle('completed', hasSleepLog);
        if (logSymptomBtn) logSymptomBtn.classList.toggle('completed', hasSymptomLog);
        
        const dailyCategoryTypes = ['agua', 'calidad_sueño', 'animo', 'energia', 'actividad', 'estres'];
        const allDailyAnswered = dailyCategoryTypes.every(type => todayLog.some(entry => entry.tipo === type));
        if (dailySummaryBtn) dailySummaryBtn.classList.toggle('completed', allDailyAnswered);
    }

    function checkForMissedLogs() {
        const log = getUserLog();
        if (!log || log.length === 0) {
            if(reminderBanner) reminderBanner.style.display = 'none';
            return;
        }
        const lastEntry = log.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).pop();
        if (!lastEntry) return;
        const lastEntryDate = new Date(lastEntry.timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 1) {
            if (reminderBanner) {
                reminderBanner.textContent = `¡Hola! Parece que no has registrado nada en ${diffDays} día(s).`;
                reminderBanner.style.display = 'block';
            }
        } else {
            if (reminderBanner) reminderBanner.style.display = 'none';
        }
    }

    function openInputModal(type, title) {
        currentLogType = type;
        if(modalTitle) modalTitle.textContent = title;
        if(inputModalOverlay) inputModalOverlay.classList.add('active');
        const textContainer = document.getElementById('modal-text-input-container');
        const sleepContainer = document.getElementById('modal-sleep-input-container');
        if (type === 'descanso') {
            if(textContainer) textContainer.style.display = 'none';
            if(sleepContainer) sleepContainer.style.display = 'flex';
            if(modalMicBtn) modalMicBtn.style.display = 'none';
            if(modalStopBtn) modalStopBtn.style.display = 'none';
            if(sleepHoursDisplay) sleepHoursDisplay.textContent = '8';
        } else {
            if(textContainer) textContainer.style.display = 'block';
            if(sleepContainer) sleepContainer.style.display = 'none';
            if(modalMicBtn) modalMicBtn.style.display = 'block';
            if(modalStopBtn) modalStopBtn.style.display = 'none';
            if(modalTextarea) modalTextarea.value = '';
        }
    }

    function closeInputModal() { if (recognition) recognition.stop(); if(inputModalOverlay) inputModalOverlay.classList.remove('active'); }
    
    function generatePDF() {
        const log = getUserLog();
        if (log.length === 0) { alert("La bitácora está vacía."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 15;
        doc.setFontSize(18); doc.text("Bitácora de Salud", 105, y, { align: 'center' }); y += 15;
        const groupedLog = log.reduce((acc, entry) => {
            const date = new Date(entry.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!acc[date]) acc[date] = [];
            acc[date].push(entry);
            return acc;
        }, {});
        Object.keys(groupedLog).sort((a,b) => new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-'))).forEach(date => {
            if (y > 270) { doc.addPage(); y = 15; }
            doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.text(date, 15, y); y += 8;
            doc.setFontSize(10); doc.setFont(undefined, 'normal');
            groupedLog[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(entry => {
                if (y > 280) { doc.addPage(); y = 15; }
                let entryText = '';
                switch (entry.tipo) {
                    case 'comida': entryText = `Comida: ${entry.contenido}`; break;
                    case 'sintoma': entryText = `Síntoma: ${entry.contenido}`; break;
                    case 'descanso': entryText = `Descanso: ${entry.contenido} horas`; break;
                    case 'agua': entryText = `Agua: ${entry.contenido}`; break;
                    case 'calidad_sueño': entryText = `Calidad del Sueño: ${entry.contenido}`; break;
                    case 'animo': entryText = `Ánimo: ${entry.contenido}`; break;
                    case 'energia': entryText = `Energía: ${entry.contenido}`; break;
                    case 'actividad': entryText = `Actividad: ${entry.contenido}`; break;
                    case 'estres': entryText = `Estrés: ${entry.contenido}`; break;
                    default: entryText = `Registro: ${entry.contenido}`;
                }
                doc.text(entryText, 20, y); y += 6;
            });
            y += 5;
        });
        doc.save(`bitacora-salud-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    function analyzeLog() {
        const log = getUserLog();
        if (log.length < 2) { alert("No hay suficientes datos para analizar."); return; }
        let conclusionsHTML = '';
        const symptoms = log.filter(entry => entry.tipo === 'sintoma');
        if (symptoms.length === 0) {
            conclusionsHTML = '<p>¡No se han registrado síntomas! Eso es una excelente noticia.</p>';
        } else {
            symptoms.forEach(symptom => {
                const symptomTime = new Date(symptom.timestamp);
                const twentyFourHoursBefore = new Date(symptomTime.getTime() - (24 * 60 * 60 * 1000));
                const relevantEntries = log.filter(entry => new Date(entry.timestamp) >= twentyFourHoursBefore && new Date(entry.timestamp) < symptomTime);
                let potentialTriggers = [];
                if (symptom.clima && typeof symptom.clima.temperatura === 'number') {
                    if (symptom.clima.temperatura < 17) potentialTriggers.push(`<li>La <b>temperatura era baja</b> (${symptom.clima.temperatura.toFixed(1)}°C) al momento del síntoma.</li>`);
                    if (symptom.clima.temperatura > 27) potentialTriggers.push(`<li>La <b>temperatura era alta</b> (${symptom.clima.temperatura.toFixed(1)}°C) al momento del síntoma.</li>`);
                }
                relevantEntries.forEach(entry => {
                    if (entry.tipo === 'estres' && entry.contenido === 'Alto') potentialTriggers.push('<li>Se reportó un <b>nivel de estrés alto</b>.</li>');
                    if (entry.tipo === 'calidad_sueño' && ['Mala', 'Regular'].includes(entry.contenido)) potentialTriggers.push(`<li>La <b>calidad del sueño</b> fue reportada como "${entry.contenido}".</li>`);
                    if (entry.tipo === 'descanso') {
                        const horas = parseFloat(entry.contenido);
                        if (horas < 6) potentialTriggers.push(`<li>Se durmió <b>pocas horas</b> (${horas}hs).</li>`);
                        if (horas > 12) potentialTriggers.push(`<li>Se durmieron <b>demasiadas horas</b> (${horas}hs), lo que puede indicar un descanso no reparador.</li>`);
                    }
                    if (entry.tipo === 'agua' && entry.contenido === 'Poco') potentialTriggers.push('<li>El <b>consumo de agua</b> fue bajo.</li>');
                });
                const symptomDate = symptomTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long'});
                conclusionsHTML += `<div class="conclusion-block"><h4>Para el síntoma "${symptom.contenido}" del ${symptomDate}:</h4>`;
                if (potentialTriggers.length > 0) {
                    const uniqueTriggers = [...new Set(potentialTriggers)];
                    conclusionsHTML += `<ul>${uniqueTriggers.join('')}</ul><p><b>Posible Conclusión:</b> Estos factores podrían haber contribuido.</p>`;
                } else {
                    conclusionsHTML += `<p>No se encontraron factores de riesgo comunes en las 24 horas previas.</p>`;
                }
                conclusionsHTML += `</div>`;
            });
        }
        if (conclusionsContent) conclusionsContent.innerHTML = conclusionsHTML;
        if (conclusionsModalOverlay) conclusionsModalOverlay.classList.add('active');
    }
    
    async function getWeatherData() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) { return reject(new Error("Geolocalización no soportada.")); }
            navigator.geolocation.getCurrentPosition(async (position) => {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=${API_KEY}&units=metric&lang=es`;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Error del clima (código: ${response.status}).`);
                    const data = await response.json();
                    resolve({ temperatura: data.main.temp, ciudad: data.name });
                } catch (error) { reject(error); }
            }, () => { reject(new Error("No se pudo obtener la ubicación.")); });
        });
    }

    // --- 3. ASIGNACIÓN DE EVENT LISTENERS ---
    
    if (loginBtn) {
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
                } else { alert('Contraseña incorrecta.'); }
            } else {
                const newUser_Data = { passwordHash: passwordHash, log: [] };
                saveUserData(email, newUser_Data);
                sessionStorage.setItem('currentUser', email);
                checkSession();
            }
        });
    }
    
    if (loginForm) { loginForm.addEventListener('submit', (e) => { e.preventDefault(); if (loginBtn) loginBtn.click(); }); }
    
    if (consultBackupBtn) {
        consultBackupBtn.addEventListener('click', async () => {
            const email = prompt("Ingresa el correo para restaurar:");
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
                if (backupData.passwordHash !== enteredHash) throw new Error("Contraseña incorrecta.");
                localStorage.setItem(`bitacora_${email}`, decodedDataString);
                sessionStorage.setItem('currentUser', email);
                alert("¡Restauración completada!");
                checkSession();
            } catch (error) { alert(`Error al restaurar: ${error.message}`); }
        });
    }
    
    if (logoutBtn) { logoutBtn.addEventListener('click', () => { sessionStorage.removeItem('currentUser'); checkSession(); }); }
    
    if (logFoodBtn) { logFoodBtn.addEventListener('click', () => openInputModal('comida', '🍎 Registrar Comida')); }
    if (logSymptomBtn) { logSymptomBtn.addEventListener('click', () => openInputModal('sintoma', '🤒 ¿Cómo te sentís?')); }
    if (logSleepBtn) { logSleepBtn.addEventListener('click', () => openInputModal('descanso', '😴 ¿Cuántas horas dormiste?')); }
    
    if (dailySummaryBtn) {
        dailySummaryBtn.addEventListener('click', () => {
            updateButtonStates();
            if(dailySummaryModalOverlay) dailySummaryModalOverlay.classList.add('active');
        });
    }
    
    if (viewLogBtn) {
        viewLogBtn.addEventListener('click', () => {
            renderLog();
            if(logModalOverlay) logModalOverlay.classList.add('active');
        });
    }
    
    if (logActionsCategories) {
        logActionsCategories.addEventListener('click', (event) => {
            if (event.target.classList.contains('option-btn')) {
                const categoryDiv = event.target.closest('.log-category');
                if (categoryDiv) {
                    addLogEntry(categoryDiv.dataset.logType, event.target.dataset.logValue);
                }
            }
        });
    }
    
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        if(btn) btn.addEventListener('click', (e) => e.target.closest('.modal-overlay').classList.remove('active'));
    });
    
    if (modalSaveBtn) {
        modalSaveBtn.addEventListener('click', () => {
            let content = (currentLogType === 'descanso') ? sleepHoursDisplay.textContent : modalTextarea.value.trim();
            if (content) { addLogEntry(currentLogType, content); closeInputModal(); } 
            else { alert('El campo no puede estar vacío.'); }
        });
    }
    
    if (modalMicBtn) {
        modalMicBtn.addEventListener('click', () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) { alert("Tu navegador no soporta voz."); return; }
            recognition = new SpeechRecognition();
            recognition.lang = 'es-AR';
            recognition.interimResults = true;
            recognition.continuous = true;
            let final_transcript = modalTextarea.value;
            recognition.onstart = () => { if(modalStatus) modalStatus.style.display = 'block'; if(modalMicBtn) modalMicBtn.style.display = 'none'; if(modalStopBtn) modalStopBtn.style.display = 'block'; if(modalSaveBtn) modalSaveBtn.disabled = true; };
            recognition.onresult = (event) => { let interim_transcript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { final_transcript += event.results[i][0].transcript + '. '; } else { interim_transcript += event.results[i][0].transcript; } } if(modalTextarea) modalTextarea.value = final_transcript + interim_transcript; };
            recognition.onerror = (event) => { alert(`Error de voz: ${event.error}`); };
            recognition.onend = () => { if(modalStatus) modalStatus.style.display = 'none'; if(modalMicBtn) modalMicBtn.style.display = 'block'; if(modalStopBtn) modalStopBtn.style.display = 'none'; if(modalSaveBtn) modalSaveBtn.disabled = false; };
            recognition.start();
        });
    }
    
    if (modalStopBtn) { modalStopBtn.addEventListener('click', () => { if (recognition) recognition.stop(); }); }
    
    if (logEntries) { logEntries.addEventListener('click', (event) => { if (event.target.classList.contains('delete-btn')) { deleteLogEntry(event.target.dataset.id); } }); }
    
    if (shareLogBtn) {
        shareLogBtn.addEventListener('click', async () => {
            const textToShare = formatLogForSharing();
            try {
                if (navigator.share) { await navigator.share({ title: 'Mi Bitácora de Salud', text: textToShare }); }
                else if (navigator.clipboard) { await navigator.clipboard.writeText(textToShare); alert('¡Bitácora copiada!'); }
            } catch (err) { console.error('Error al compartir:', err); }
        });
    }
    
    if (pdfBtn) { pdfBtn.addEventListener('click', generatePDF); }
    if (conclusionsBtn) { conclusionsBtn.addEventListener('click', analyzeLog); }
    
    if (sleepMinusBtn) {
        sleepMinusBtn.addEventListener('click', () => {
            let hours = parseInt(sleepHoursDisplay.textContent);
            if (hours > 1) {
                hours--;
                sleepHoursDisplay.textContent = hours;
            }
        });
    }
    
    if (sleepPlusBtn) {
        sleepPlusBtn.addEventListener('click', () => {
            let hours = parseInt(sleepHoursDisplay.textContent);
            if (hours < 24) {
                hours++;
                sleepHoursDisplay.textContent = hours;
            }
        });
    }

    // --- 4. INICIALIZACIÓN ---
    checkSession();
});