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


