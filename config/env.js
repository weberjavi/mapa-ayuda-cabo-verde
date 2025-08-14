// Configuration file for the Cabo Verde Help Map

// Google Sheets configuration
// To set this up:
// 1. Create a Google Sheet with columns: name, description, category, latitude, longitude, timestamp
// 2. Go to Google Apps Script (script.google.com)
// 3. Create a new project and paste the provided Apps Script code
// 4. Deploy as web app with "Anyone" access
// 5. Replace the URL below with your deployed web app URL

const CONFIG = {
  // Map configuration
  MAP_STYLE: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // default vector style
  RASTER_SATELLITE_STYLE:
    "https://api.maptiler.com/maps/satellite/style.json?key=kd4SrivtZ33mtbU6naqs",
  // Local sample data configuration
  USE_SAMPLE_DATA: false,
  // Optional shared secret to protect write access. Set the same value in Apps Script API_TOKEN.
  WRITE_TOKEN: "",
  INITIAL_VIEW_STATE: {
    longitude: -24.0, // Centered on Cabo Verde
    latitude: 16.0,
    zoom: 8,
    pitch: 0,
    bearing: 0,
  },

  // Category colors for map markers
  CATEGORY_COLORS: {
    "Labores de Limpieza": [59, 130, 246, 200], // Vivid blue
    "Faltan energía": [245, 158, 11, 200], // Amber
    "Faltan agua": [16, 185, 129, 200], // Emerald
    "Faltan transporte": [99, 102, 241, 200], // Indigo
    "Faltan comunicaciones": [236, 72, 153, 200], // Pink
    "Faltan servicios": [234, 179, 8, 200], // Gold
    "Alojamiento temporal": [168, 85, 247, 200], // Purple
    "Necesidad de suministros y material": [2, 132, 199, 200], // Sky blue
    "Equipo de rescate (evacuación)": [239, 68, 68, 200], // Red
    "Asistencia médica": [244, 63, 94, 200], // Rose
    "Apoyo psicológico": [20, 184, 166, 200], // Teal
    "Apoyo logístico": [34, 197, 94, 200], // Green
    "Maquinaria para movilidad reducida": [234, 88, 12, 200], // Orange
    "Maquinaria pesada (grúas, palas, ...)": [217, 119, 6, 200], // Deep orange
    "Contenedores de Escombros": [71, 85, 105, 200], // Slate
    "Ayuda general": [15, 118, 110, 200], // Dark teal
  },

  // Default marker color for unknown categories
  DEFAULT_COLOR: [107, 114, 128, 200], // Gray (slightly stronger alpha)

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

const DATA = [
  {
    name: "Hospital Agostinho Neto",
    description: "Principal hospital público de Praia",
    category: "hospital",
    latitude: 14.9177,
    longitude: -23.5092,
    timestamp: "2024-01-15T10:00:00.000Z",
  },
  {
    name: "Escola Secundária Domingos Ramos",
    description: "Escuela secundaria en el centro de Praia",
    category: "escuela",
    latitude: 14.9208,
    longitude: -23.5087,
    timestamp: "2024-01-15T10:05:00.000Z",
  },
  {
    name: "Centro Comunitário Achada Santo António",
    description: "Centro comunitario para eventos y reuniones",
    category: "centro_comunitario",
    latitude: 14.9156,
    longitude: -23.5134,
    timestamp: "2024-01-15T10:10:00.000Z",
  },
  {
    name: "Refugio Temporário Plateau",
    description: "Refugio temporal para emergencias",
    category: "refugio",
    latitude: 14.9189,
    longitude: -23.5098,
    timestamp: "2024-01-15T10:15:00.000Z",
  },
  {
    name: "Fonte de Água Pública",
    description: "Fuente de agua potable pública",
    category: "agua",
    latitude: 14.9145,
    longitude: -23.5078,
    timestamp: "2024-01-15T10:20:00.000Z",
  },
  {
    name: "Centro de Distribución de Alimentos",
    description: "Punto de distribución de alimentos de emergencia",
    category: "alimentos",
    latitude: 14.9201,
    longitude: -23.5112,
    timestamp: "2024-01-15T10:25:00.000Z",
  },
];
