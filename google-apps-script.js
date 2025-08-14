// Google Apps Script code for Cabo Verde Help Map
// This file should be copied to Google Apps Script (script.google.com)
// and deployed as a web app with "Anyone" access

// Configuration
const SHEET_NAME = "Locations"; // Name of the sheet tab
const API_TOKEN =
  PropertiesService.getScriptProperties().getProperty("API_TOKEN") || "";
const HEADERS = [
  "name",
  "description",
  "category",
  "prioridad",
  "personas",
  "ubicacion",
  "email",
  "telefono",
  "latitude",
  "longitude",
  "timestamp",
];

/**
 * Main function to handle HTTP requests
 */
function doGet(e) {
  try {
    e = e || { parameter: {} };
    const action = e.parameter && e.parameter.action;

    if (action === "getData") {
      // Support JSONP when callback is provided
      const resp = getData(); // ContentService JSON output
      const callback = e.parameter && e.parameter.callback;
      if (callback) {
        const json = resp.getContent();
        // Sanitize callback to reduce XSS risk
        const safe =
          String(callback)
            .replace(/[^\w$.]/g, "")
            .slice(0, 64) || "callback";
        return ContentService.createTextOutput(`${safe}(${json})`).setMimeType(
          ContentService.MimeType.JAVASCRIPT
        );
      }
      return resp;
    }

    return createResponse(false, "Invalid action");
  } catch (error) {
    console.error("Error in doGet:", error);
    return createResponse(false, error.toString());
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    e = e || { parameter: {}, postData: null };
    const params = e.parameter || {};
    let action = params.action || "";
    let payload = {};
    if (e.postData && e.postData.type === "application/json") {
      const requestData = JSON.parse(e.postData.contents || "{}");
      action = requestData.action || action;
      payload = requestData.data || {};
    } else {
      if (params.data) {
        try {
          payload = JSON.parse(params.data);
        } catch (err) {
          payload = {};
        }
      }
    }

    if (action === "addLocation") {
      return addLocation(payload, params.token || "");
    }

    return createResponse(false, "Invalid action");
  } catch (error) {
    console.error("Error in doPost:", error);
    return createResponse(false, error.toString());
  }
}

/**
 * Get all location data from the spreadsheet
 */
function getData() {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      // Only headers or empty sheet
      return createResponse(true, []);
    }

    // Convert to array of objects
    const headers = data[0];
    const locations = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const location = {};

      for (let j = 0; j < headers.length; j++) {
        location[headers[j]] = row[j];
      }

      // Only include rows with valid coordinates
      if (location.latitude && location.longitude) {
        locations.push(location);
      }
    }

    return createResponse(true, locations);
  } catch (error) {
    console.error("Error getting data:", error);
    return createResponse(false, error.toString());
  }
}

/**
 * Add a new location to the spreadsheet
 */
function addLocation(locationData, token) {
  try {
    // Validate required fields
    if (
      !locationData.name ||
      !locationData.category ||
      !locationData.latitude ||
      !locationData.longitude
    ) {
      return createResponse(false, "Missing required fields");
    }

    // Optional token check
    if (API_TOKEN && token !== API_TOKEN) {
      return createResponse(false, "Unauthorized");
    }

    const sheet = getOrCreateSheet();

    // Prepare row data
    const rowData = [
      locationData.name,
      locationData.description || "",
      locationData.category,
      locationData.prioridad || "",
      locationData.personas || "",
      locationData.ubicacion || "",
      locationData.email || "",
      locationData.telefono || "",
      locationData.latitude,
      locationData.longitude,
      locationData.timestamp || new Date().toISOString(),
    ];

    // Add the new row
    sheet.appendRow(rowData);

    return createResponse(true, "Location added successfully");
  } catch (error) {
    console.error("Error adding location:", error);
    return createResponse(false, error.toString());
  }
}

/**
 * Get or create the sheet with proper headers
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    // Create new sheet
    sheet = spreadsheet.insertSheet(SHEET_NAME);

    // Add headers
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f0f0f0");
  } else {
    // Check if headers exist
    const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const hasHeaders = HEADERS.every(
      (header, index) => firstRow[index] === header
    );

    if (!hasHeaders) {
      // Add or update headers
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f0f0f0");
    }
  }

  return sheet;
}

/**
 * Create a standardized response object
 */
function createResponse(success, data, error = null) {
  const response = {
    success: success,
    data: success ? data : null,
    error: success ? null : error || data,
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions() {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.TEXT
  );
}

/**
 * Test function to verify the setup
 */
function testSetup() {
  try {
    const sheet = getOrCreateSheet();
    console.log("Sheet created/found:", sheet.getName());

    // Test adding a sample location
    const sampleData = {
      name: "Test Location",
      description: "This is a test location",
      category: "hospital",
      latitude: 16.0,
      longitude: -24.0,
      timestamp: new Date().toISOString(),
    };

    const result = addLocation(sampleData);
    console.log("Add location result:", result.getContent());

    // Test getting data
    const getData = getData();
    console.log("Get data result:", getData.getContent());
  } catch (error) {
    console.error("Test failed:", error);
  }
}
