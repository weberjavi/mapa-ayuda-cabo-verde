// Main application JavaScript for Cabo Verde Help Map

class CaboVerdeMap {
  constructor() {
    this.deck = null;
    this.overlay = null;
    this.map = null;
    this.data = [];
    this.isLoading = true;

    this.init();
  }

  async init() {
    try {
      // Initialize the map (this will handle loading data and setup)
      this.initializeMap();

      // Setup event handlers
      this.setupEventHandlers();
    } catch (error) {
      console.error("Error initializing map:", error);
      this.showError("Error al cargar el mapa. Por favor, recarga la página.");
    }
  }

  initializeMap() {
    // Initialize MapLibre GL map
    this.map = new maplibregl.Map({
      container: "map",
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [
        CONFIG.INITIAL_VIEW_STATE.longitude,
        CONFIG.INITIAL_VIEW_STATE.latitude,
      ],
      zoom: CONFIG.INITIAL_VIEW_STATE.zoom,
      pitch: CONFIG.INITIAL_VIEW_STATE.pitch,
      bearing: CONFIG.INITIAL_VIEW_STATE.bearing,
    });

    // Wait for map to load before initializing overlay
    this.map.on("load", () => {
      // Use Deck.GL MapboxOverlay for seamless integration with MapLibre
      this.overlay = new deck.MapboxOverlay({
        layers: [],
        getTooltip: this.getTooltip.bind(this),
      });

      this.map.addControl(this.overlay);

      // Basemap toggle handler
      const toggleBtn = document.getElementById("toggle-basemap");
      let isSatellite = false;
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          isSatellite = !isSatellite;
          const nextStyle = isSatellite
            ? CONFIG.RASTER_SATELLITE_STYLE
            : CONFIG.MAP_STYLE;
          this.map.setStyle(nextStyle);
          // After style loads, re-apply overlay layers
          this.map.once("styledata", () => {
            this.updateMapLayers();
          });
          toggleBtn.textContent = isSatellite ? "Vector" : "Satélite";
        });
      }

      // Load initial data after overlay is ready
      this.loadData();
    });
  }

  async loadData() {
    try {
      if (CONFIG.USE_SAMPLE_DATA) {
        this.data = Array.isArray(window.SAMPLE_DATA) ? window.SAMPLE_DATA : [];
        this.updateMapLayers();
        return;
      }

      // JSONP read from Apps Script endpoint to avoid CORS
      await new Promise((resolve, reject) => {
        const callbackName = `onSheetData_${Date.now()}`;
        window[callbackName] = (result) => {
          try {
            if (result && result.success) {
              this.data = result.data || [];
              this.updateMapLayers();
              resolve();
            } else {
              reject(
                new Error(
                  result && result.error ? result.error : "Invalid response"
                )
              );
            }
          } finally {
            delete window[callbackName];
            script &&
              script.parentNode &&
              script.parentNode.removeChild(script);
          }
        };
        const script = document.createElement("script");
        script.src = `${CONFIG.GOOGLE_SCRIPT_URL}?action=getData&callback=${callbackName}`;
        script.onerror = () => {
          delete window[callbackName];
          script && script.parentNode && script.parentNode.removeChild(script);
          reject(new Error("JSONP request failed"));
        };
        document.body.appendChild(script);
      });
    } catch (error) {
      console.error("Error loading data:", error);
      this.data = [];
      this.updateMapLayers();
    } finally {
      // Hide loading indicator after data is loaded (or failed to load)
      this.hideLoading();
    }
  }

  updateMapLayers() {
    if (!this.overlay && !this.deck) return;
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
    const scatterplotLayer = new deck.ScatterplotLayer({
      id: "locations",
      data: this.data,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 8,
      radiusMaxPixels: 15,
      lineWidthMinPixels: 2,
      getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
      getRadius: CONFIG.MARKER_SIZE,
      getFillColor: (d) => this.getCategoryColor(d.category),
      getLineColor: [255, 255, 255, 255],
    });

    if (this.overlay) {
      this.overlay.setProps({ layers: [scatterplotLayer] });
    } else if (this.deck) {
      this.deck.setProps({ layers: [scatterplotLayer] });
    }
  }

  getCategoryColor(category) {
    return CONFIG.CATEGORY_COLORS[category] || CONFIG.DEFAULT_COLOR;
  }

  getTooltip({ object }) {
    if (!object) return null;

    const categoryName = CATEGORY_NAMES[object.category] || object.category;
    const esc = (s) =>
      String(s).replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
      );

    return {
      html: `
                <div>
                    <strong>${esc(object.name)}</strong><br/>
                    <em>${esc(categoryName)}</em><br/>
                    ${
                      object.description
                        ? `<p>${esc(object.description)}</p>`
                        : ""
                    }
                    <small>Lat: ${parseFloat(object.latitude).toFixed(
                      4
                    )}, Lng: ${parseFloat(object.longitude).toFixed(4)}</small>
                </div>
            `,
    };
  }

  setupEventHandlers() {
    // Double-click handler for adding new locations
    this.map.on("dblclick", (e) => {
      e.preventDefault();
      const { lng, lat } = e.lngLat;
      this.showAddLocationForm(lng, lat);
    });

    // Modal handlers
    const modal = document.getElementById("form-modal");
    const closeBtn = document.querySelector(".close");
    const cancelBtn = document.getElementById("cancel-btn");
    const form = document.getElementById("location-form");

    closeBtn.onclick = () => this.hideModal();
    cancelBtn.onclick = () => this.hideModal();

    // Close modal when clicking outside
    window.onclick = (event) => {
      if (event.target === modal) {
        this.hideModal();
      }
    };

    // Form submission
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    };
  }

  showAddLocationForm(longitude, latitude) {
    const modal = document.getElementById("form-modal");
    const form = document.getElementById("location-form");

    // Reset form
    form.reset();

    // Set coordinates
    document.getElementById("latitude").value = latitude.toFixed(6);
    document.getElementById("longitude").value = longitude.toFixed(6);

    // Show modal
    modal.style.display = "block";

    // Focus on name field
    setTimeout(() => {
      document.getElementById("name").focus();
    }, 100);
  }

  hideModal() {
    const modal = document.getElementById("form-modal");
    modal.style.display = "none";
  }

  async handleFormSubmit() {
    const form = document.getElementById("location-form");
    const formData = new FormData(form);

    const locationData = {
      name: formData.get("name"),
      description: formData.get("description") || "",
      category: formData.get("category"),
      latitude: parseFloat(formData.get("latitude")),
      longitude: parseFloat(formData.get("longitude")),
      timestamp: new Date().toISOString(),
    };

    try {
      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Guardando...";
      submitBtn.disabled = true;

      // Send to Google Sheets (use form-encoded to avoid CORS preflight)
      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: `action=addLocation&data=${encodeURIComponent(
          JSON.stringify(locationData)
        )}`,
      });

      const result = await response.json();

      if (result && result.success) {
        // Add to local data
        this.data.push(locationData);
        this.updateMapLayers();

        // Hide modal
        this.hideModal();

        // Show success message
        this.showMessage("Ubicación agregada exitosamente", "success");
      } else {
        // Fall back: refresh via JSONP to reflect server state (no CORS read)
        await this.loadData();
        if (result && result.error) throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error saving location:", error);
      this.showMessage(
        "Error al guardar la ubicación. Por favor, intenta de nuevo.",
        "error"
      );
    } finally {
      // Reset submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = "Guardar";
      submitBtn.disabled = false;
    }
  }

  hideLoading() {
    const loading = document.getElementById("loading");
    loading.style.display = "none";
    document.body.classList.add("loaded");
  }

  showMessage(message, type = "info") {
    // Create message element
    const messageEl = document.createElement("div");
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

    // Set background color based on type
    switch (type) {
      case "success":
        messageEl.style.backgroundColor = "#28a745";
        break;
      case "error":
        messageEl.style.backgroundColor = "#dc3545";
        break;
      default:
        messageEl.style.backgroundColor = "#007bff";
    }

    document.body.appendChild(messageEl);

    // Auto remove after 3 seconds
    setTimeout(() => {
      messageEl.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 3000);
  }

  showError(message) {
    this.hideLoading();
    this.showMessage(message, "error");
  }
}

// Add CSS for message animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new CaboVerdeMap();
});
