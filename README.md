### `README.md`

# Bitácora de Salud v8.1 🍎🤒😴

Una aplicación web completa y moderna para el seguimiento diario de la salud. Diseñada con una arquitectura profesional de dos partes (frontend y backend), permite un registro local rápido, sincronización automática en la nube, restauración de datos en cualquier dispositivo y funciones de análisis para encontrar patrones en tus hábitos.

**Live Demo:** `https://daslatam.github.io/Bitacora_salud/` *(Puedes cambiar esta URL por la tuya)*

## ✨ Características Principales (v8.1 Estable)

### Registro Inteligente y Flexible
* **Múltiples Categorías:** Registra comidas, síntomas, horas de sueño, consumo de agua, calidad del sueño, estado de ánimo, nivel de energía, actividad física y nivel de estrés.
* **Entrada de Datos Versátil:** Utiliza el dictado por voz (con controles de inicio/parada) o escribe texto para los registros detallados. Para los indicadores diarios, usa botones de selección rápida para un registro instantáneo.
* **Control Numérico Mejorado:** Una interfaz de botones +/- para registrar las horas de sueño de forma cómoda y precisa.
* **Contexto Automático:** Cada entrada se enriquece automáticamente con la **ubicación (ciudad) y la temperatura** del momento, gracias a la integración con la API de OpenWeatherMap.

### Interfaz Limpia y Moderna
* **Diseño Minimalista:** La pantalla principal se ha simplificado para reducir el scroll y centrarse en las acciones principales.
* **Interacciones Basadas en Modales:** Todas las funciones (registro, bitácora, resumen diario, conclusiones) se abren en ventanas emergentes (modales) para una experiencia de usuario organizada y sin distracciones.
* **Feedback Visual Constante:** Los botones cambian de color para indicar qué categorías ya han sido registradas durante el día, dándote un resumen visual de tu progreso diario.

### Análisis y Exportación de Datos
* **💡 Conclusiones Inteligentes:** Un botón que analiza tu historial y busca correlaciones. Si registras un síntoma, la herramienta revisará las 24 horas previas y te sugerirá posibles causas basadas en reglas (estrés alto, pocas/demasiadas horas de sueño, temperaturas extremas, etc.).
* **📄 Descarga en PDF:** Exporta tu bitácora completa a un archivo PDF profesional, segmentado por días, con un solo clic.
* **🔗 Compartir Fácilmente:** Comparte un resumen de tu bitácora como texto a través del menú nativo de tu móvil o cópialo al portapapeles en tu computadora.

### Sincronización, Seguridad y Nube
* **Backend Dedicado:** Un servidor robusto construido con Node.js/Express, desplegado en Vercel.
* **Almacenamiento Permanente en la Nube:** Las copias de seguridad se guardan de forma segura y persistente en **Vercel Blob**, el servicio de almacenamiento de Vercel.
* **Sincronización Automática:** Cada vez que añades o borras un registro, tu bitácora se sincroniza silenciosamente con la nube.
* **Restauración Multi-dispositivo:** La función "Restaurar desde Servidor" te permite descargar tu última copia de seguridad y continuar tu sesión en cualquier dispositivo.
* **Privacidad con Contraseña:** Un sistema simple de email y contraseña protege el acceso a tus registros y backups.

## 🛠️ Tecnologías Utilizadas

* **Frontend:**
    * HTML5, CSS3, JavaScript (ES6+)
    * **Web APIs:** Geolocation, Web Speech, Web Share, Clipboard, Fetch.
    * **Librerías:** jsPDF.
* **Backend:**
    * Node.js, Express.js.
* **Cloud y Servicios:**
    * **GitHub Pages:** Alojamiento del frontend.
    * **Vercel:** Alojamiento del backend (funciones serverless).
    * **Vercel Blob:** Almacenamiento persistente de archivos en la nube.
    * **OpenWeatherMap API:** Para datos meteorológicos.

## 🏗️ Arquitectura del Sistema

Este proyecto utiliza una arquitectura de dos componentes separados para garantizar rendimiento y escalabilidad:

1.  **Frontend Estático:** Alojado en **GitHub Pages**, contiene toda la lógica de la interfaz de usuario.
2.  **Backend Serverless:** Alojado en **Vercel**, contiene la API que interactúa con el almacenamiento en la nube (Vercel Blob).

Esta separación es una práctica estándar en el desarrollo web moderno.