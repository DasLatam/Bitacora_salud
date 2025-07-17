const express = require('express');
const cors = require('cors');
const { put, list } = require('@vercel/blob');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

const corsOptions = { origin: 'https://daslatam.github.io' };
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Inicializa Google AI con la clave secreta desde las variables de entorno de Vercel
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const router = express.Router();

// ENDPOINT PARA ANÁLISIS CON IA
router.post('/analyze', async (req, res) => {
    const { payload } = req.body;
    if (!payload || !payload.symptom) {
        return res.status(400).json({ conclusion: "Faltan datos para el análisis." });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Eres un asistente de salud experto en análisis de datos. Tu objetivo es encontrar patrones y posibles causas para un síntoma específico, analizando los datos en diferentes ventanas de tiempo.
            Tu respuesta debe estar en formato Markdown, ser concisa, empática y fácil de leer. No des consejos médicos, solo presenta correlaciones y patrones basados en los datos proporcionados.

            El síntoma a analizar es:
            - **Síntoma:** ${payload.symptom.contenido}
            - **Fecha:** ${new Date(payload.symptom.timestamp).toLocaleString('es-ES')}
            - **Clima durante el síntoma:** ${payload.symptom.clima.temperatura}°C en ${payload.symptom.clima.ciudad}

            ---

            ### Análisis por Período

            **1. Factores Inmediatos (Últimas 24 horas):**
            *Basado en estos datos: ${JSON.stringify(payload.data_24h)}*
            - (Tu análisis de posibles disparadores directos como comidas específicas, estrés puntual, mal descanso la noche anterior).

            **2. Patrones a Corto Plazo (Últimos 3 días):**
            *Basado en estos datos: ${JSON.stringify(payload.data_72h)}*
            - (Tu análisis de factores acumulativos: ¿Se repite un patrón de mal descanso? ¿El estrés ha sido constante?).

            **3. Tendencias a Mediano Plazo (Última Semana):**
            *Basado en estos datos: ${JSON.stringify(payload.data_7d)}*
            - (Tu análisis de tendencias más generales, como cambios en la dieta o actividad física).
            
            ---

            ### Conclusión General
            Resume en 2-3 frases las correlaciones más probables y significativas que encontraste, combinando la información de todos los períodos.
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

// Rutas de backup
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

router.get('/backup/:email', async (req, res) => {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: 'Falta email.' });
    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathnamePrefix = `backups/${userFolderName}/`;
    try {
        const { blobs } = await list({ prefix: pathnamePrefix });
        if (blobs.length === 0) return res.status(404).json({ message: 'No se encontraron backups.' });
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