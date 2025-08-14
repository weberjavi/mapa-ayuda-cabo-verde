// Main application JavaScript for Cabo Verde Help Map

class CaboVerdeMap {
  constructor() {
    this.deck = null;
    this.overlay = null;
    this.map = null;
    this.data = [];
    this.isLoading = true;
    this.blinkData = [];
    this.animationTick = 0;
    this._animRaf = null;

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
    // Define bounds
    // Initial viewport bounds (used only on first load)
    const INITIAL_BOUNDS = [
      [-25.186355591850088, 16.77147184854499], // SW
      [-24.85236779679923, 17.060273719317834], // NE
    ];
    // Max panning bounds (restrict map movement)
    const MAX_BOUNDS = [
      [-29.823669573774595, 10.709360169832735], // SW
      [-17.85710795955933, 20.458434734525298], // NE
    ];

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
      maxBounds: MAX_BOUNDS,
    });

    // Wait for map to load before initializing overlay
    this.map.on("load", () => {
      // Use Deck.GL MapboxOverlay for seamless integration with MapLibre
      this.overlay = new deck.MapboxOverlay({
        layers: [],
        getTooltip: this.getTooltip.bind(this),
      });

      this.map.addControl(this.overlay);

      // Fit map to initial bounding box (viewport on first load only)
      const bounds = INITIAL_BOUNDS;
      try {
        this.map.fitBounds(bounds, { padding: 40, duration: 0 });
      } catch (_) {}

      // Ensure sidebar initial state reflected on body for toggle position
      const sidebarEl = document.getElementById("sidebar");
      if (sidebarEl && sidebarEl.classList.contains("open")) {
        document.body.classList.add("sidebar-open");
      }

      // Basemap toggle handler
      const toggleBtn = document.getElementById("toggle-basemap");
      const toggleBtn2 = document.getElementById("toggle-basemap-2");
      const themeBtn = document.getElementById("theme-toggle");
      const sidebarContentToggle = document.getElementById(
        "sidebar-content-toggle"
      );
      let isSatellite = false;
      const handleBaseToggle = () => {
        isSatellite = !isSatellite;
        const nextStyle = isSatellite
          ? CONFIG.RASTER_SATELLITE_STYLE
          : CONFIG.MAP_STYLE;
        this.map.setStyle(nextStyle);
        // After style loads, re-apply overlay layers
        this.map.once("styledata", () => {
          this.updateMapLayers();
        });
        const label = isSatellite ? "Vector" : "Satélite";
        if (toggleBtn) toggleBtn.textContent = label;
        if (toggleBtn2) toggleBtn2.textContent = label;
      };
      if (toggleBtn) toggleBtn.addEventListener("click", handleBaseToggle);
      if (toggleBtn2) toggleBtn2.addEventListener("click", handleBaseToggle);

      // Theme toggle
      if (themeBtn) {
        // Default to dark theme
        document.body.classList.add("theme-dark");
        themeBtn.textContent = "Claro";
        themeBtn.addEventListener("click", () => {
          const isDark = document.body.classList.contains("theme-dark");
          if (isDark) {
            document.body.classList.remove("theme-dark");
            document.body.classList.add("theme-light");
            themeBtn.textContent = "Oscuro";
          } else {
            document.body.classList.remove("theme-light");
            document.body.classList.add("theme-dark");
            themeBtn.textContent = "Claro";
          }
        });
      }

      // Sidebar content toggle: info <-> legend
      if (sidebarContentToggle) {
        const infoEl = document.getElementById("sidebar-info");
        const legendEl = document.getElementById("sidebar-legend");
        // Build legend once from modal select
        if (legendEl && !legendEl.innerHTML) {
          const select = document.getElementById("category");
          const categories = select
            ? Array.from(select.options)
                .map((o) => (o.text || o.value || "").trim())
                .filter((v) => v && v !== "Seleccionar categoría")
            : [];
          const seen = new Set();
          const uniqueCategories = categories.filter((c) =>
            seen.has(c) ? false : (seen.add(c), true)
          );
          const list = document.createElement("ul");
          list.style.listStyle = "none";
          list.style.margin = "0";
          list.style.padding = "0";
          uniqueCategories.forEach((name) => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.gap = "8px";
            li.style.margin = "6px 0";
            const swatch = document.createElement("span");
            swatch.style.display = "inline-block";
            swatch.style.width = "14px";
            swatch.style.height = "14px";
            swatch.style.borderRadius = "50%";
            const col = this.getCategoryColor(name) ||
              CONFIG.DEFAULT_COLOR || [120, 120, 120, 180];
            swatch.style.backgroundColor = `rgba(${col[0]},${col[1]},${
              col[2]
            },${(col[3] || 180) / 255})`;
            const label = document.createElement("span");
            label.textContent = name;
            li.appendChild(swatch);
            li.appendChild(label);
            list.appendChild(li);
          });
          legendEl.appendChild(list);
        }
        sidebarContentToggle.addEventListener("click", () => {
          const showingInfo = infoEl && infoEl.style.display !== "none";
          if (showingInfo) {
            if (infoEl) infoEl.style.display = "none";
            if (legendEl) legendEl.style.display = "";
            sidebarContentToggle.textContent = "Instruções";
          } else {
            if (legendEl) legendEl.style.display = "none";
            if (infoEl) infoEl.style.display = "";
            sidebarContentToggle.textContent = "Legenda";
          }
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
        this.computeBlinkData();
        this.updateMapLayers();
        this.startAnimation();
        return;
      }

      // Fetch via Netlify Function proxy (no CORS issues)
      const response = await fetch("/.netlify/functions/sheets?action=getData");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result && result.success) {
        this.data = result.data || [];
        this.computeBlinkData();
        this.updateMapLayers();
        this.startAnimation();
      } else {
        throw new Error(
          (result && result.error) || "Failed to load data from proxy"
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
      this.data = [];
      this.blinkData = [];
      this.updateMapLayers();
      this.stopAnimation();
    } finally {
      // Hide loading indicator after data is loaded (or failed to load)
      this.hideLoading();
    }
  }

  updateMapLayers() {
    if (!this.overlay && !this.deck) return;

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

    // Blinking overlay for oldest three points
    const layers = [scatterplotLayer];
    if (this.blinkData && this.blinkData.length > 0) {
      const blinkLayer = new deck.ScatterplotLayer({
        id: "locations-blink",
        data: this.blinkData,
        pickable: false,
        stroked: false,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 10,
        radiusMaxPixels: 24,
        getPosition: (d) => [parseFloat(d.longitude), parseFloat(d.latitude)],
        getRadius: (d) => {
          const base = 12;
          const pulse = 6 * (0.5 + 0.5 * Math.sin(this.animationTick));
          return base + pulse;
        },
        getFillColor: (d) => {
          const col = this.getCategoryColor(d.category) || [108, 117, 125, 180];
          const phase = 0.5 + 0.5 * Math.sin(this.animationTick);
          const a = Math.round(80 + phase * 150);
          return [col[0], col[1], col[2], a];
        },
        updateTriggers: {
          getFillColor: [this.animationTick],
          getRadius: [this.animationTick],
        },
      });
      layers.push(blinkLayer);
    }

    if (this.overlay) {
      this.overlay.setProps({ layers });
    } else if (this.deck) {
      this.deck.setProps({ layers });
    }
  }

  computeBlinkData() {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      this.blinkData = [];
      return;
    }
    // Prefer entries with valid timestamps, oldest first
    const withTime = [];
    const withoutTime = [];
    for (let i = 0; i < this.data.length; i++) {
      const d = this.data[i];
      const t = Date.parse(d.timestamp);
      if (!isNaN(t)) withTime.push({ d, t });
      else withoutTime.push({ d, idx: i });
    }
    let selected = [];
    if (withTime.length >= 3) {
      withTime.sort((a, b) => a.t - b.t);
      selected = withTime.slice(0, 3).map((x) => x.d);
    } else {
      // Fill from withTime then from earliest rows
      selected = withTime.sort((a, b) => a.t - b.t).map((x) => x.d);
      for (let i = 0; i < withoutTime.length && selected.length < 3; i++) {
        selected.push(withoutTime[i].d);
      }
    }
    this.blinkData = selected;
  }

  startAnimation() {
    this.stopAnimation();
    const animate = () => {
      this.animationTick = performance.now() / 350; // speed factor
      this.updateMapLayers();
      this._animRaf = requestAnimationFrame(animate);
    };
    this._animRaf = requestAnimationFrame(animate);
  }

  stopAnimation() {
    if (this._animRaf) {
      cancelAnimationFrame(this._animRaf);
      this._animRaf = null;
    }
  }

  getCategoryColor(category) {
    const configured =
      CONFIG.CATEGORY_COLORS && CONFIG.CATEGORY_COLORS[category];
    if (configured) return configured;
    const hue = this.stringToHue(category || "");
    const [r, g, b] = this.hslToRgb(hue / 360, 0.55, 0.55);
    return [r, g, b, 180];
  }

  stringToHue(str) {
    let hash = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++)
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return hash % 360;
  }

  hslToRgb(h, s, l) {
    if (s === 0) {
      const v = Math.round(l * 255);
      return [v, v, v];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const tc = [h + 1 / 3, h, h - 1 / 3];
    const rgb = tc.map((t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    });
    return rgb.map((v) => Math.round(v * 255));
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
    // Click/double-tap to add locations
    const isTouchDevice =
      "ontouchstart" in window || (navigator && navigator.maxTouchPoints > 0);
    if (!isTouchDevice) {
      // Desktop: use dblclick
      this.map.on("dblclick", (e) => {
        e.preventDefault();
        const { lng, lat } = e.lngLat;
        this.showAddLocationForm(lng, lat);
      });
    } else {
      // Mobile: detect double tap and prevent default zoom
      try {
        this.map.doubleClickZoom &&
          this.map.doubleClickZoom.disable &&
          this.map.doubleClickZoom.disable();
      } catch (_) {}
      const container = this.map.getCanvasContainer();
      let lastTapTime = 0;
      let lastX = 0;
      let lastY = 0;
      container.addEventListener(
        "touchend",
        (ev) => {
          if (ev.touches && ev.touches.length) return;
          const now = Date.now();
          const touch = ev.changedTouches && ev.changedTouches[0];
          if (!touch) return;
          const rect = container.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          const dt = now - lastTapTime;
          const dx = x - lastX;
          const dy = y - lastY;
          const dist2 = dx * dx + dy * dy;
          const isDouble = dt < 350 && dist2 < 625; // <~25px movement
          if (isDouble) {
            ev.preventDefault();
            ev.stopPropagation();
            const lngLat = this.map.unproject([x, y]);
            this.showAddLocationForm(lngLat.lng, lngLat.lat);
            lastTapTime = 0; // reset
          } else {
            lastTapTime = now;
            lastX = x;
            lastY = y;
          }
        },
        { passive: false }
      );
    }

    // Sidebar toggle
    const sidebar = document.getElementById("sidebar");
    const openBtn = document.getElementById("sidebar-toggle");
    if (openBtn && sidebar) {
      openBtn.addEventListener("click", () => {
        const isClosed = sidebar.classList.contains("closed");
        if (isClosed) {
          sidebar.classList.remove("closed");
          sidebar.setAttribute("aria-hidden", "true");
          document.body.classList.remove("sidebar-closed");
        } else {
          sidebar.classList.add("closed");
          sidebar.setAttribute("aria-hidden", "false");
          document.body.classList.add("sidebar-closed");
        }
      });
    }

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
      prioridad: formData.get("prioridad") || "",
      personas: formData.get("personas")
        ? Number(formData.get("personas"))
        : null,
      ubicacion: formData.get("ubicacion") || "",
      email: formData.get("email") || "",
      telefono: formData.get("telefono") || "",
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

      // Send via Netlify Function proxy
      const response = await fetch("/.netlify/functions/sheets", {
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
        // Refetch from backend to render authoritative data
        await this.loadData();

        // Hide modal
        this.hideModal();

        // Show success message
        this.showMessage("Ubicación agregada exitosamente", "success");
      } else {
        // Refresh via proxy read to reflect server state
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
