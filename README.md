### `README.md`

# Mi Bitácora de Salud 🍎🤒😴

Una aplicación web moderna y sencilla para el seguimiento diario de comidas, síntomas y horas de sueño. Diseñada para funcionar perfectamente en el navegador de tu computadora o celular, con una interfaz de usuario fluida y controles intuitivos.

## ✨ Características Principales

  * **Login Local por Email:** Utiliza tu correo electrónico para mantener tus registros separados de otros usuarios en un mismo dispositivo. Es simple y no requiere contraseña.
  * **Registro Flexible:** Para cada tipo de entrada (comida, síntoma o descanso), puedes elegir cómo ingresar los datos:
      * ⌨️ **Escribiendo** en un campo de texto claro.
      * 🎤 **Usando tu voz** con control total para empezar y parar la grabación cuando quieras.
  * **Feedback en Tiempo Real:** Al usar el dictado por voz, verás tus palabras aparecer en la pantalla mientras hablas.
  * **Entrada de Descanso Especializada:** Un campo numérico dedicado para registrar las horas de sueño de forma rápida y sin errores.
  * **Datos Ambientales Automáticos:** Cada registro captura automáticamente la **ubicación (ciudad), temperatura y clima** del momento, usando la geolocalización y la API de OpenWeatherMap.
  * **Bitácora Siempre Visible y Gestionable:**
      * Tu historial de registros se muestra directamente en la pantalla principal.
      * 🗑️ **Borra** cualquier entrada individual con un solo clic.
  * **Comparte Fácilmente:** Con el botón "🔗 Compartir", puedes:
      * 📲 **En móviles:** Abrir el menú nativo para enviar tu bitácora por WhatsApp, email, etc.
      * 💻 **En escritorio:** Copiar toda la bitácora formateada a tu portapapeles.
  * **Recordatorio Inteligente:** Si olvidas registrar tu actividad un día, la aplicación te lo recordará amablemente la próxima vez que la abras.

## 🛠️ Tecnologías Utilizadas

  * **Frontend:** HTML5, CSS3, JavaScript (ES6+)
  * **APIs del Navegador:**
      * `localStorage` y `sessionStorage` para el guardado de datos y sesión.
      * `Geolocation API` para obtener la ubicación del usuario.
      * `Web Speech API` para el reconocimiento de voz.
      * `Clipboard API` y `Web Share API` para las funciones de copiar y compartir.
  * **Servicios Externos:**
      * **OpenWeatherMap:** Para obtener los datos del clima en tiempo real.

## 🚀 Cómo Usarlo

1.  **Clonar el Repositorio:**

    ```bash
    git clone https://github.com/TU_USUARIO/NOMBRE_DEL_REPOSITORIO.git
    ```

2.  **Configurar la Clave API:**

      * Este proyecto utiliza OpenWeatherMap para los datos del clima. Necesitarás una clave de API gratuita.
      * Ve a [OpenWeatherMap.org](https://openweathermap.org/appid) y regístrate para obtener tu clave.
      * Abre el archivo `script.js`.
      * Busca la línea `const API_KEY = "7be1ab7811ed2f6edac7f1077a058ed4";` y reemplaza la clave con la tuya si es necesario (el código actual ya tiene una clave de ejemplo funcional).

3.  **Publicar en GitHub Pages (Recomendado):**

      * Sube los tres archivos (`index.html`, `style.css`, `script.js`) a tu repositorio en GitHub.
      * En la pestaña **"Settings"** (Configuración) de tu repositorio, ve a la sección **"Pages"**.
      * En "Branch", selecciona la rama `main` y haz clic en "Save".
      * GitHub te dará una URL `https://...`. **Usa esta URL para acceder a la aplicación.** Esto es importante para que funciones como la geolocalización, que requieren una conexión segura (HTTPS).