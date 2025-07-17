const express = require('express');
const cors = require('cors');
const { put, list } = require('@vercel/blob');

const app = express();

// --- Middleware ---

// Configuración de CORS explícita para aceptar peticiones
// desde tu dominio de GitHub Pages.
const corsOptions = {
  origin: 'https://daslatam.github.io'
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '5mb' }));

const router = express.Router();

// Ruta para GUARDAR un backup
router.post('/backup', async (req, res) => {
    const { email, data } = req.body;
    if (!email || !data) return res.status(400).json({ message: 'Faltan datos.' });

    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const now = new Date();
    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.txt`;
    const pathname = `backups/${userFolderName}/${fileName}`;

    try {
        await put(pathname, data, { access: 'public', contentType: 'text/plain' });
        return res.status(200).json({ message: 'Backup guardado en la nube.' });
    } catch (error) {
        return res.status(500).json({ message: `Error al guardar en Vercel Blob: ${error.message}` });
    }
});

// Ruta para CONSULTAR el último backup
router.get('/backup/:email', async (req, res) => {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: 'Falta email.' });

    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathnamePrefix = `backups/${userFolderName}/`;

    try {
        const { blobs } = await list({ prefix: pathnamePrefix });
        if (blobs.length === 0) {
            return res.status(404).json({ message: 'No se encontraron backups para este usuario.' });
        }
        const latestBlob = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0];
        const response = await fetch(latestBlob.url);
        const data = await response.text();
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(500).json({ message: `Error al leer desde Vercel Blob: ${error.message}` });
    }
});

app.use('/api', router);

module.exports = app;

const express = require('express');
const cors = require('cors');
const { put, list } = require('@vercel/blob');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

const corsOptions = { origin: 'https://daslatam.github.io' };
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Inicializa Google AI con la clave secreta desde las variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const router = express.Router();

// --- NUEVO ENDPOINT PARA ANÁLISIS CON IA ---
router.post('/analyze', async (req, res) => {
    const { log } = req.body;
    if (!log || log.length === 0) {
        return res.status(400).json({ conclusion: "No hay datos suficientes para analizar." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Eres un asistente de salud y bienestar. Analiza los siguientes datos de una bitácora de salud. 
            Tu objetivo es encontrar correlaciones lógicas y probables entre los síntomas reportados y los eventos de las 24 horas previas.
            Sé conciso, empático y presenta tus hallazgos en formato de lista (markdown). No des consejos médicos, solo presenta las posibles correlaciones basadas en los datos.
            
            Aquí están los datos del registro:
            ${JSON.stringify(log, null, 2)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ conclusion: text });

    } catch (error) {
        console.error("Error en la API de IA:", error);
        res.status(500).json({ conclusion: "No se pudo generar el análisis en este momento." });
    }
});


// Rutas de backup (sin cambios)
router.post('/backup', async (req, res) => { /* ...código sin cambios... */ });
router.get('/backup/:email', async (req, res) => { /* ...código sin cambios... */ });

app.use('/api', router);

module.exports = app;
