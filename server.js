const express = require('express');
const cors = require('cors'); // Importa el paquete CORS
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---

// ✅ ESTA ES LA LÍNEA CLAVE
// Habilita CORS para todas las rutas y orígenes.
// Esto añade la cabecera 'Access-Control-Allow-Origin' a las respuestas.
app.use(cors()); 

app.use(express.json({ limit: '5mb' })); // Para procesar los datos JSON

// --- RUTAS DE LA API ---

// Ruta para GUARDAR un backup
app.post('/backup', (req, res) => {
    const { email, data } = req.body;
    if (!email || !data) {
        return res.status(400).json({ message: 'Faltan datos (email o data).' });
    }

    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const userBackupDir = path.join(__dirname, 'backups', userFolderName);
    fs.mkdirSync(userBackupDir, { recursive: true });
    
    const now = new Date();
    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.txt`;
    const filePath = path.join(userBackupDir, fileName);

    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
            return res.status(500).json({ message: 'Error interno al guardar el backup.' });
        }
        console.log(`Backup guardado para ${email} en ${filePath}`);
        res.status(200).json({ message: 'Copia de seguridad guardada exitosamente.' });
    });
});

// Ruta para CONSULTAR el último backup
app.get('/backup/:email', (req, res) => {
    const { email } = req.params;
    if (!email) {
        return res.status(400).json({ message: 'Falta el email.' });
    }

    const userFolderName = email.replace(/[^a-zA-Z0-9.-]/g, '_');
    const userBackupDir = path.join(__dirname, 'backups', userFolderName);

    if (!fs.existsSync(userBackupDir)) {
        return res.status(404).json({ message: 'No se encontraron backups para este usuario.' });
    }

    fs.readdir(userBackupDir, (err, files) => {
        if (err || files.length === 0) {
            return res.status(404).json({ message: 'No se encontraron archivos de backup.' });
        }

        const latestFile = files.sort().pop();
        const filePath = path.join(userBackupDir, latestFile);

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error al leer el archivo de backup.' });
            }
            res.status(200).json({ data: data });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de backup escuchando en el puerto ${PORT}`);
});