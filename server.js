const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Ruta para el backup
app.post('/backup', (req, res) => {
    const { email, data } = req.body;

    if (!email || !data) {
        return res.status(400).json({ message: 'Faltan datos (email o data).' });
    }

    // 1. Crea un nombre de carpeta seguro a partir del email
    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const userBackupDir = path.join(__dirname, 'backups', userFolderName);

    // 2. Crea la carpeta del usuario (ej: /backups/tu_email) si no existe
    fs.mkdirSync(userBackupDir, { recursive: true });
    
    // 3. Crea un nombre de archivo basado en la fecha actual
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const fileName = `${year}-${month}-${day}.txt`;

    const filePath = path.join(userBackupDir, fileName);

    // Guarda los datos (sobrescribe el archivo del día si ya existe)
    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
            return res.status(500).json({ message: 'Error interno al guardar el backup.' });
        }

        console.log(`Backup guardado para ${email} en ${filePath}`);
        res.status(200).json({ message: 'Copia de seguridad guardada exitosamente.' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de backup escuchando en http://localhost:${PORT}`);
});