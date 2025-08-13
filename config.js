// Configuration file for the Cabo Verde Help Map

// Google Sheets configuration
// To set this up:
// 1. Create a Google Sheet with columns: name, description, category, latitude, longitude, timestamp
// 2. Go to Google Apps Script (script.google.com)
// 3. Create a new project and paste the provided Apps Script code
// 4. Deploy as web app with "Anyone" access
// 5. Replace the URL below with your deployed web app URL

const CONFIG = {
  // Google Apps Script Web App URL
  // Replace this with your actual deployed web app URL
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",

  // Map configuration
  MAP_STYLE: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // default vector style
  RASTER_SATELLITE_STYLE:
    "https://api.maptiler.com/maps/satellite/style.json?key=kd4SrivtZ33mtbU6naqs",
  // Local sample data configuration
  USE_SAMPLE_DATA: true,
  INITIAL_VIEW_STATE: {
    longitude: -24.0, // Centered on Cabo Verde
    latitude: 16.0,
    zoom: 8,
    pitch: 0,
    bearing: 0,
  },

  // Category colors for map markers
  CATEGORY_COLORS: {
    hospital: [220, 53, 69, 180], // Red
    escuela: [40, 167, 69, 180], // Green
    centro_comunitario: [255, 193, 7, 180], // Yellow
    refugio: [108, 117, 125, 180], // Gray
    agua: [23, 162, 184, 180], // Cyan
    alimentos: [255, 133, 27, 180], // Orange
    otro: [111, 66, 193, 180], // Purple
  },

  // Default marker color for unknown categories
  DEFAULT_COLOR: [108, 117, 125, 180], // Gray

  // Marker size
  MARKER_SIZE: 100,
};

// Category display names (for tooltips and UI)
const CATEGORY_NAMES = {
  hospital: "Hospital",
  escuela: "Escuela",
  centro_comunitario: "Centro Comunitario",
  refugio: "Refugio",
  agua: "Fuente de Agua",
  alimentos: "Distribución de Alimentos",
  otro: "Otro",
};
