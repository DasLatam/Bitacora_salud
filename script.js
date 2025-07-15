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

    // --- ¡MUY IMPORTANTE! REEMPLAZA ESTA CLAVE ---
    // Obtén tu clave gratuita en https://openweathermap.org/appid
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
        if (API_KEY === "TU_API_KEY_DE_OPENWEATHERMAP") {
            alert("¡Atención! Aún no has configurado tu clave de API en el archivo script.js. El clima no funcionará.");
        }
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

    // 3. OBTENER CLIMA (API) - Lógica Corregida
    async function getWeatherData() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error("Geolocalización no es soportada."));
            }
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                // Usamos HTTPS explícitamente
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=es`;
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        // Si la respuesta no es OK, podría ser por la API Key
                        throw new Error(`Error del servidor de clima (código: ${response.status}). ¿Verificaste tu API Key?`);
                    }
                    const data = await response.json();
                    resolve({
                        temperatura: data.main.temp,
                        sensacion_termica: data.main.feels_like,
                        humedad: data.main.humidity,
                        ciudad: data.name
                    });
                } catch (error) {
                    reject(error); // Rechaza con el error específico
                }
            }, (error) => {
                // El error de geolocalización es manejado aquí
                reject(new Error("No se pudo obtener la ubicacion. Revisa los permisos del navegador."));
            });
        });
    }

    // 4. REGISTRAR ENTRADAS (Función más robusta)
    async function addLogEntry(type, content) {
        let weatherData;
        try {
            weatherData = await getWeatherData();
        } catch (error) {
            alert(`Alerta: ${error.message}\nSe guardará el registro sin datos del clima.`);
            weatherData = {
                temperatura: 'N/A',
                sensacion_termica: 'N/A',
                humedad: 'N/A',
                ciudad: 'Ubicación no disponible'
            };
        }

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

        alert(`Registro de '${type}' guardado.`);
        if (!logContainer.classList.contains('hidden')) {
            renderLog();
        }
    }
    
    // 5. RECONOCIMIENTO DE VOZ
    function startSpeechRecognition(callback) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const manualInput = prompt("Tu navegador no soporta voz. Ingresa tu registro manualmente:");
            if (manualInput) callback(manualInput);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.interimResults = false;

        recognition.onstart = () => { document.body.style.backgroundColor = '#e6f7ff'; };
        recognition.onresult = (event) => { callback(event.results[0][0].transcript); };
        recognition.onerror = (event) => { alert(`Error de voz: ${event.error}`); };
        recognition.onend = () => { document.body.style.backgroundColor = '#f0f2f5'; };

        recognition.start();
    }

    // Event Listeners para los botones de registro
    logFoodBtn.addEventListener('click', () => {
        alert("Habla ahora para registrar tu comida...");
        startSpeechRecognition(text => addLogEntry('comida', text));
    });

    logSymptomBtn.addEventListener('click', () => {
        alert("Habla ahora para registrar tu síntoma...");
        startSpeechRecognition(text => addLogEntry('sintoma', text));
    });
    
    logSleepBtn.addEventListener('click', () => {
        const sleep = prompt('¿Cuántas horas dormiste? (ej: 7.5)');
        if (sleep && !isNaN(parseFloat(sleep))) {
            addLogEntry('descanso', parseFloat(sleep));
        } else if (sleep) {
            alert('Por favor, ingresa un número válido de horas.');
        }
    });


    // 6. MOSTRAR BITÁCORA
    viewLogBtn.addEventListener('click', () => {
        logContainer.classList.toggle('hidden');
        if (!logContainer.classList.contains('hidden')) {
            renderLog();
        }
    });

    function renderLog() {
        const log = getUserLog().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        logEntries.innerHTML = '';

        if (log.length === 0) {
            logEntries.innerHTML = '<p>Aún no hay registros.</p>';
            return;
        }

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
            
            // Maneja el caso de N/A para no mostrar ".0"
            const temp = typeof entry.clima.temperatura === 'number' ? entry.clima.temperatura.toFixed(1) : 'N/A';
            const sens = typeof entry.clima.sensacion_termica === 'number' ? entry.clima.sensacion_termica.toFixed(1) : 'N/A';

            const climaHTML = `📍 ${entry.clima.ciudad} | 🌡️ ${temp}°C (sensación ${sens}°C) | 💧 ${entry.clima.humedad}%`;

            entryDiv.innerHTML = `
                <div class="log-entry-header">${formattedDate}</div>
                <div class="log-entry-content">${contentHTML}</div>
                <div class="log-entry-meta">${climaHTML}</div>
            `;
            logEntries.appendChild(entryDiv);
        });
    }
    
    // 7. RECORDATORIO DE REGISTROS FALTANTES
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

    // 8. BACKUP AL SERVIDOR (Función de ejemplo)
    backupBtn.addEventListener('click', () => {
        const log = getUserLog();
        if (log.length === 0) {
            alert('No hay datos para respaldar.');
            return;
        }

        const dataToBackup = btoa(JSON.stringify(log));
        alert('Copia de seguridad preparada. Esta función requiere un servidor para funcionar.');
        console.log("Datos para enviar al servidor (en Base64):", dataToBackup);
    });

    // --- INICIALIZACIÓN ---
    checkSession();
});