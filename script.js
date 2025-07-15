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

    const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4"; // <-- ¡REEMPLAZAR!

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
        logContainer.classList.add('hidden'); // Ocultar bitácora al salir
        checkSession();
    });

    // 2. OBTENER DATOS DEL USUARIO (localStorage)
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

    // 3. OBTENER CLIMA (API)
    async function getWeatherData() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject("Geolocalización no es soportada por este navegador.");
            }
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=es`;
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Respuesta de red no fue ok.');
                    const data = await response.json();
                    resolve({
                        temperatura: data.main.temp,
                        sensacion_termica: data.main.feels_like,
                        humedad: data.main.humidity,
                        ciudad: data.name
                    });
                } catch (error) {
                    reject("No se pudo obtener el clima.");
                }
            }, () => {
                reject("No se pudo obtener la ubicación.");
            });
        });
    }

    // 4. REGISTRAR ENTRADAS
    async function addLogEntry(type, content) {
        try {
            const weatherData = await getWeatherData();
            const newEntry = {
                id: Date.now(),
                tipo: type,
                contenido: content,
                timestamp: new Date().toISOString(),
                clima: weatherData
            };

            const log = getUserLog();
            log.push(newEntry);
            saveUserLog(log);

            alert(`Registro de "${type}" guardado exitosamente.`);
            if (!logContainer.classList.contains('hidden')) {
                renderLog(); // Actualizar bitácora si está visible
            }

        } catch (error) {
            alert(`Error: ${error}`);
        }
    }

    logFoodBtn.addEventListener('click', () => {
        const food = prompt('¿Qué ingeriste? (Usa el micrófono de tu teclado si quieres)');
        if (food) addLogEntry('comida', food);
    });

    logSymptomBtn.addEventListener('click', () => {
        const symptom = prompt('¿Qué síntoma o dolencia tienes?');
        if (symptom) addLogEntry('sintoma', symptom);
    });

    logSleepBtn.addEventListener('click', () => {
        const sleep = prompt('¿Cuántas horas dormiste? (ej: 7.5)');
        if (sleep && !isNaN(parseFloat(sleep))) {
            addLogEntry('descanso', parseFloat(sleep));
        } else if (sleep) {
            alert('Por favor, ingresa un número válido de horas.');
        }
    });

    // 5. MOSTRAR BITÁCORA
    viewLogBtn.addEventListener('click', () => {
        logContainer.classList.toggle('hidden');
        if (!logContainer.classList.contains('hidden')) {
            renderLog();
        }
    });

    function renderLog() {
        const log = getUserLog().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Ordenar del más nuevo al más viejo
        logEntries.innerHTML = ''; // Limpiar antes de renderizar

        if (log.length === 0) {
            logEntries.innerHTML = '<p>Aún no hay registros.</p>';
            return;
        }

        log.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('log-entry');
            if (entry.tipo === 'sintoma') {
                entryDiv.classList.add('log-entry-symptom');
            }

            const date = new Date(entry.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            let contentHTML = '';
            switch(entry.tipo) {
                case 'comida': contentHTML = `🍎 Comida: ${entry.contenido}`; break;
                case 'sintoma': contentHTML = `🤒 Síntoma: ${entry.contenido}`; break;
                case 'descanso': contentHTML = `😴 Descanso: ${entry.contenido} horas`; break;
            }
            
            const climaHTML = `📍 ${entry.clima.ciudad} | 🌡️ ${entry.clima.temperatura.toFixed(1)}°C (sensación ${entry.clima.sensacion_termica.toFixed(1)}°C) | 💧 ${entry.clima.humedad}%`;

            entryDiv.innerHTML = `
                <div class="log-entry-header">${formattedDate}</div>
                <div class="log-entry-content">${contentHTML}</div>
                <div class="log-entry-meta">${climaHTML}</div>
            `;
            logEntries.appendChild(entryDiv);
        });
    }
    
    // 6. RECORDATORIO DE REGISTROS FALTANTES
    function checkForMissedLogs() {
        const log = getUserLog();
        if (log.length === 0) return;

        const lastEntryDate = new Date(log[log.length - 1].timestamp);
        const now = new Date();
        
        const diffTime = Math.abs(now - lastEntryDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 1) {
            reminderBanner.textContent = `¡Hola! Parece que no has registrado nada en ${diffDays} día(s).`;
            reminderBanner.classList.remove('hidden');
        } else {
            reminderBanner.classList.add('hidden');
        }
    }

    // 7. BACKUP AL SERVIDOR (Función de ejemplo)
    backupBtn.addEventListener('click', () => {
        const log = getUserLog();
        if (log.length === 0) {
            alert('No hay datos para respaldar.');
            return;
        }

        // Ofuscamos los datos con Base64
        const dataToBackup = btoa(JSON.stringify(log));

        alert('Preparando copia de seguridad...\nEsta función requiere un servidor para funcionar.');
        
        // --- CÓDIGO DE EJEMPLO PARA ENVIAR AL SERVIDOR ---
        // Esto fallará si no tienes un servidor escuchando en esa URL
        /*
        fetch('URL_DE_TU_SERVIDOR/backup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: sessionStorage.getItem('currentUser'),
                data: dataToBackup
            })
        })
        .then(response => response.json())
        .then(data => alert('Copia de seguridad creada exitosamente.'))
        .catch(error => alert('Error al crear la copia de seguridad. Asegúrate de que el servidor esté funcionando.'));
        */
    });

    // --- INICIALIZACIÓN ---
    checkSession();
});