const express = require('express');
const cors = require('cors');
const { put, list, del } = require('@vercel/blob');

const app = express();
app.use(cors()); 
app.use(express.json({ limit: '5mb' }));

const router = express.Router();

// Ruta para GUARDAR un backup en Vercel Blob
router.post('/backup', async (req, res) => {
    const { email, data } = req.body;
    if (!email || !data) return res.status(400).json({ message: 'Faltan datos.' });

    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const now = new Date();
    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.txt`;
    const pathname = `backups/${userFolderName}/${fileName}`;

    try {
        const blob = await put(pathname, data, {
            access: 'public', // Los datos estarán encriptados en Base64 de todos modos
            contentType: 'text/plain',
        });
        return res.status(200).json({ message: 'Backup guardado en la nube.' });
    } catch (error) {
        return res.status(500).json({ message: `Error al guardar en Vercel Blob: ${error.message}` });
    }
});

// Ruta para CONSULTAR el último backup desde Vercel Blob
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

        // El último blob en la lista es el más reciente si los nombres son fechas
        const latestBlob = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname))[0];
        
        // El contenido está encriptado en Base64, que es lo que necesitamos
        const response = await fetch(latestBlob.url);
        const data = await response.text();

        return res.status(200).json({ data: data });
    } catch (error) {
        return res.status(500).json({ message: `Error al leer desde Vercel Blob: ${error.message}` });
    }
});

app.use('/api', router);

module.exports = app;