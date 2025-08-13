# Mapa de Ayuda - Cabo Verde

A simple interactive map application built with DeckGL and MapLibre GL, backed by Google Sheets for data storage. Users can double-click on the map to add new locations with categorized information.

## Features

- Interactive map centered on Cabo Verde
- Double-click to add new locations
- Categorized markers with different colors
- Form-based data entry
- Google Sheets integration for data persistence
- Responsive design
- Static deployment ready (GitHub Pages)

## Setup Instructions

### 1. Google Sheets Setup

1. **Create a Google Sheet:**

   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Name it something like "Cabo Verde Help Map Data"

2. **Set up Google Apps Script:**

   - Go to [Google Apps Script](https://script.google.com)
   - Click "New Project"
   - Delete the default code and paste the contents of `google-apps-script.js`
   - Save the project with a meaningful name

3. **Deploy the Web App:**

   - Click "Deploy" > "New Deployment"
   - Choose "Web app" as the type
   - Set the following settings:
     - Execute as: "Me"
     - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the web app URL (it will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

4. **Update Configuration:**
   - Open `config.js` in this project
   - Replace `YOUR_SCRIPT_ID` in the `GOOGLE_SCRIPT_URL` with your actual script ID from the URL above

### 2. Local Development

1. **Clone or download this repository**

2. **Serve the files:**
   Since this uses ES6 modules and makes API calls, you need to serve the files through a web server.

   **Option A - Using Python:**

   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B - Using Node.js:**

   ```bash
   npx http-server
   ```

   **Option C - Using PHP:**

   ```bash
   php -S localhost:8000
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8000` in your web browser

### 3. GitHub Pages Deployment

1. **Push to GitHub:**

   - Create a new repository on GitHub
   - Push all files to the repository

2. **Enable GitHub Pages:**

   - Go to repository Settings
   - Scroll down to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

3. **Access your map:**
   Your map will be available at: `https://yourusername.github.io/repository-name`

## Usage

1. **Viewing locations:** All existing locations from the Google Sheet will be displayed as colored markers on the map
2. **Adding locations:** Double-click anywhere on the map to add a new location
3. **Form fields:**
   - **Name:** Required - Name of the location
   - **Description:** Optional - Additional details
   - **Category:** Required - Select from predefined categories
   - **Coordinates:** Auto-filled based on click location

## Categories

The application supports the following categories with distinct colors:

- 🏥 **Hospital** (Red)
- 🏫 **Escuela** (Green)
- 🏢 **Centro Comunitario** (Yellow)
- 🏠 **Refugio** (Gray)
- 💧 **Fuente de Agua** (Cyan)
- 🍽️ **Distribución de Alimentos** (Orange)
- 📍 **Otro** (Purple)

## File Structure

```
mapa-ayuda-cabo-verde/
├── index.html              # Main HTML file
├── app.js                  # Main application logic
├── config.js               # Configuration file
├── styles.css              # Styling
├── google-apps-script.js   # Backend code for Google Apps Script
└── README.md               # This file
```

## Customization

### Changing the Map Center

Edit the `INITIAL_VIEW_STATE` in `config.js`:

```javascript
INITIAL_VIEW_STATE: {
    longitude: -24.0, // Your longitude
    latitude: 16.0,   // Your latitude
    zoom: 8,          // Zoom level
    pitch: 0,
    bearing: 0
}
```

### Adding New Categories

1. Add the category to the HTML select options in `index.html`
2. Add the category color to `CATEGORY_COLORS` in `config.js`
3. Add the display name to `CATEGORY_NAMES` in `config.js`

### Changing Map Style

Replace the `MAP_STYLE` URL in `config.js` with any MapLibre GL compatible style:

```javascript
MAP_STYLE: "https://your-style-url.json";
```

## Troubleshooting

### Common Issues

1. **"Failed to load data" error:**

   - Check that your Google Apps Script is deployed correctly
   - Verify the `GOOGLE_SCRIPT_URL` in `config.js` is correct
   - Ensure the Google Apps Script has "Anyone" access permissions

2. **Map not loading:**

   - Make sure you're serving the files through a web server (not opening `index.html` directly)
   - Check browser console for JavaScript errors

3. **Markers not appearing:**
   - Verify your Google Sheet has the correct column headers
   - Check that latitude/longitude values are valid numbers

### Testing the Google Apps Script

You can test your Google Apps Script setup by:

1. Open the Apps Script editor
2. Run the `testSetup()` function
3. Check the execution log for any errors

## Dependencies

This project uses CDN versions of:

- **MapLibre GL JS** (v3.6.2) - For the base map
- **Deck.GL** (latest) - For data visualization layers

No build process or package management required!

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and pull requests to improve this application!
