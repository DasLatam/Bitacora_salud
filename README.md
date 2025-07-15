# Mi Bitácora de Salud 🍎🤒😴

Una aplicación web sencilla para el seguimiento diario de comidas, síntomas y horas de sueño. Diseñada para funcionar localmente en el navegador y con la capacidad de crear una copia de seguridad en un servidor.

## ✨ Características

* **Login Local:** Usa tu correo para separar tus datos de los de otros usuarios en el mismo dispositivo. ¡No requiere contraseña!
* **Tres Tipos de Registro:**
    * 🍎 **Comidas:** Anota qué desayunaste, almorzaste, merendaste y cenaste.
    * 🤒 **Síntomas:** Registra dolencias como dolores de cabeza, congestión, etc.
    * 😴 **Descanso:** Lleva la cuenta de tus horas de sueño.
* **Datos Ambientales Automáticos:** Cada registro captura automáticamente la **ubicación (ciudad), temperatura, sensación térmica y humedad** del momento, usando la geolocalización y la API de OpenWeatherMap.
* **Bitácora Visual:** Consulta todos tus registros ordenados por fecha, con un estilo visual claro que resalta los síntomas.
* **Recordatorio Diario:** Si olvidas registrar datos un día, la app te lo recordará amablemente la próxima vez que la abras.
* **Copia de Seguridad:** Funcionalidad para enviar una copia de tus datos (ofuscada en Base64) a un servidor para tener un respaldo.

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **APIs del Navegador:**
    * `localStorage` y `sessionStorage` para el guardado de datos y sesión.
    * `Geolocation API` para obtener la ubicación del usuario.
    * `Fetch API` para la comunicación con servicios externos.
* **Servicios Externos:**
    * **OpenWeatherMap:** Para obtener los datos del clima en tiempo real.

## 🚀 Cómo Usarlo

1.  **Clonar el Repositorio:**
    ```bash
    git clone [https://github.com/TU_USUARIO/NOMBRE_DEL_REPOSITORIO.git](https://github.com/TU_USUARIO/NOMBRE_DEL_REPOSITORIO.git)
    ```

2.  **Obtener una API Key:**
    * Ve a [OpenWeatherMap.org](https://openweathermap.org/appid) y regístrate para obtener una API Key gratuita.
    * Abre el archivo `script.js`.
    * Busca la línea `const API_KEY = "TU_API_KEY_DE_OPENWEATHERMAP";` y reemplaza el texto entre comillas con tu clave.

3.  **Abrir la Aplicación:**
    * Simplemente abre el archivo `index.html` en tu navegador web. ¡Y listo!

4.  **Publicar en GitHub Pages (Opcional):**
    * Sube estos tres archivos (`index.html`, `style.css`, `script.js`) a un nuevo repositorio en tu cuenta de GitHub.
    * En la pestaña "Settings" de tu repositorio, ve a la sección "Pages".
    * En "Source", selecciona la rama `main` y haz clic en "Save".
    * ¡Tu aplicación estará online en la URL que te indique GitHub!