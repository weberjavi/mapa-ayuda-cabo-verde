// Netlify Function: Proxy Google Apps Script with CORS and server-side token injection
module.exports.handler = async function (event) {
  const sheetsUrl = process.env.GOOGLE_SCRIPT_URL;
  const writeToken = process.env.WRITE_TOKEN || "";

  if (!sheetsUrl) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: false,
        error: "Missing GOOGLE_SCRIPT_URL env",
      }),
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }

  try {
    const url = new URL(sheetsUrl);
    const method = event.httpMethod || "GET";
    const headers = corsHeaders();

    if (method === "GET") {
      const params = new URLSearchParams(event.queryStringParameters || {});
      // Default action
      if (!params.get("action")) params.set("action", "getData");
      params.forEach((v, k) => url.searchParams.set(k, v));

      const r = await fetch(url.toString());
      const text = await r.text();
      return {
        statusCode: r.status,
        headers: { ...headers, "Content-Type": "application/json" },
        body: text,
      };
    }

    if (method === "POST") {
      // Accept JSON or form-encoded bodies
      const contentType =
        (event.headers &&
          (event.headers["content-type"] || event.headers["Content-Type"])) ||
        "";
      let bodyObj = {};
      if (contentType.includes("application/json")) {
        bodyObj = JSON.parse(event.body || "{}");
      } else {
        const params = new URLSearchParams(event.body || "");
        bodyObj = {
          action: params.get("action"),
          data: safeJsonParse(params.get("data")) || {},
        };
      }

      // Prepare form-encoded body to Apps Script and attach token
      const form = new URLSearchParams();
      form.set("action", bodyObj.action || "addLocation");
      form.set("data", JSON.stringify(bodyObj.data || {}));
      // if (writeToken) form.set("token", writeToken);

      const r = await fetch(sheetsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: form.toString(),
      });
      const text = await r.text();
      return {
        statusCode: r.status,
        headers: { ...headers, "Content-Type": "application/json" },
        body: text,
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: "Method Not Allowed",
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: false,
        error: String((err && err.message) || err),
      }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
