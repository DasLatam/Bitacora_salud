### `README.md`

# Bitácora de Salud v4.0 🍎🤒😴

Una aplicación web completa y moderna para el seguimiento diario de la salud. Diseñada con una arquitectura de dos partes (frontend y backend), permite un registro local rápido, sincronización automática en la nube y restauración de datos en cualquier dispositivo.

**Live Demo:** `https://daslatam.github.io/Bitacora_salud/` *(Reemplaza con la URL de tu frontend)*

## ✨ Características Principales (v4.0)

### Funcionalidad Central
* **Registro Multimodal:** Anota comidas, síntomas y horas de descanso.
* **Identificación de Usuario:** Un sistema de login local por email permite que varios usuarios utilicen la aplicación en el mismo dispositivo de forma separada.
* **Almacenamiento Local-First:** Los datos se guardan instantáneamente en el navegador para una experiencia de usuario rápida y con capacidad sin conexión.

### Interfaz y Experiencia de Usuario (UI/UX)
* **Entrada Flexible:** Para cada registro, puedes elegir entre **escribir texto** o usar el **dictado por voz**.
* **Control de Voz Avanzado:** Inicia y para la grabación de voz manualmente, con feedback en tiempo real que transcribe tus palabras en la pantalla mientras hablas.
* **Bitácora Siempre Activa:** El historial de registros está siempre visible y se actualiza automáticamente al añadir o eliminar entradas.
* **Gestión de Entradas:** Elimina cualquier registro individual con un solo clic y una confirmación para evitar errores.
* **Compartir Fácilmente:** Un botón "Compartir" que utiliza la función nativa del móvil o copia todo el historial al portapapeles en una computadora.
* **Recordatorio Diario:** Un banner no intrusivo te recuerda si te has saltado el registro del día anterior.

### Sincronización y Nube
* **Backend Dedicado:** Un servidor Node.js/Express robusto que gestiona las copias de seguridad.
* **Almacenamiento Permanente en la Nube:** Los backups se guardan de forma segura en **Vercel Blob**, garantizando que los datos no se pierdan.
* **Sincronización Automática:** Cada vez que añades o borras un registro, tu bitácora completa se sincroniza silenciosamente con la nube.
* **Restauración Multi-dispositivo:** La función "Restaurar desde Servidor" en la pantalla de inicio te permite descargar tu última copia de seguridad y continuar tu sesión en cualquier dispositivo.

### Datos Automáticos
* **Geolocalización y Clima:** Cada entrada se enriquece automáticamente con la ciudad y la temperatura del momento, obtenidas mediante la geolocalización del navegador y la API de OpenWeatherMap.

## 🛠️ Tecnologías Utilizadas

* **Frontend:**
    * HTML5
    * CSS3
    * JavaScript (ES6+)
    * **Web APIs:** Geolocation, Web Speech, Web Share, Clipboard, Fetch.

* **Backend:**
    * Node.js
    * Express.js

* **Cloud y Servicios:**
    * **GitHub Pages:** Alojamiento del frontend.
    * **Vercel:** Alojamiento del backend y funciones serverless.
    * **Vercel Blob:** Almacenamiento persistente de archivos en la nube.
    * **OpenWeatherMap API:** Para datos meteorológicos.

## 🏗️ Arquitectura del Sistema

Este proyecto utiliza una arquitectura moderna de dos componentes separados:

1.  **Frontend Estático:** Alojado en **GitHub Pages**, contiene toda la lógica de la interfaz de usuario. Es rápido de cargar y ligero.
2.  **Backend Serverless:** Alojado en **Vercel**, contiene la lógica de la API para interactuar con el almacenamiento en la nube (Vercel Blob), garantizando la persistencia y seguridad de los datos.

Esta separación asegura que la aplicación sea escalable, segura y fácil de mantener.

## 🚀 Instalación y Despliegue

Para desplegar tu propia versión de esta aplicación, sigue estos pasos:

1.  **Backend:**
    * Clona el repositorio del backend.
    * Ejecuta `npm install` para instalar las dependencias.
    * Crea un proyecto en Vercel, impórtalo y conéctalo a un "Blob Store" desde la pestaña "Storage".
    * Vercel desplegará el servidor y te dará una URL pública.

2.  **Frontend:**
    * Clona el repositorio del frontend.
    * Abre `script.js` y actualiza la variable `BACKEND_URL` con la URL de tu backend desplegado en Vercel.
    * Sube los archivos a un repositorio y despliégalo usando GitHub Pages.

    