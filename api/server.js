const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json({ limit: '5mb' }));

// Las rutas ahora están dentro de /api/
const router = express.Router();

router.post('/backup', (req, res) => {
    const { email, data } = req.body;
    if (!email || !data) return res.status(400).json({ message: 'Faltan datos.' });

    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Vercel usa /tmp/ para escribir archivos
    const userBackupDir = path.join('/tmp', 'backups', userFolderName);
    fs.mkdirSync(userBackupDir, { recursive: true });
    
    const now = new Date();
    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.txt`;
    const filePath = path.join(userBackupDir, fileName);

    fs.writeFile(filePath, data, (err) => {
        if (err) return res.status(500).json({ message: 'Error al guardar backup.' });
        res.status(200).json({ message: 'Backup guardado.' });
    });
});

router.get('/backup/:email', (req, res) => {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: 'Falta email.' });

    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const userBackupDir = path.join('/tmp', 'backups', userFolderName);

    if (!fs.existsSync(userBackupDir)) {
        return res.status(404).json({ message: 'No hay backups para este usuario.' });
    }

    fs.readdir(userBackupDir, (err, files) => {
        if (err || files.length === 0) return res.status(404).json({ message: 'No hay archivos de backup.' });
        
        const latestFile = files.sort().pop();
        const filePath = path.join(userBackupDir, latestFile);

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return res.status(500).json({ message: 'Error al leer backup.' });
            res.status(200).json({ data });
        });
    });
});

app.use('/api', router);

module.exports = app;