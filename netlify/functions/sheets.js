// Netlify Function: Proxy Google Apps Script with CORS and server-side token injection
const crypto = require("crypto");

module.exports.handler = async function (event) {
  const sheetsUrl = process.env.GOOGLE_SCRIPT_URL;
  const writeToken = process.env.WRITE_TOKEN || "";
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
    return {
      statusCode: 204,
      headers: corsHeaders(
        event.headers && (event.headers.origin || event.headers.Origin),
        allowedOrigins
      ),
    };
  }

  try {
    const url = new URL(sheetsUrl);
    const method = event.httpMethod || "GET";
    const origin =
      (event.headers && (event.headers.origin || event.headers.Origin)) || "";
    if (allowedOrigins.length && origin && !allowedOrigins.includes(origin)) {
      return {
        statusCode: 403,
        headers: corsHeaders(origin, allowedOrigins),
        body: JSON.stringify({ success: false, error: "Origin not allowed" }),
      };
    }
    const headers = corsHeaders(origin, allowedOrigins);

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

      // Basic server-side validation (min fields)
      const d = bodyObj.data || {};
      if (
        !d.name ||
        !d.category ||
        typeof d.latitude !== "number" ||
        typeof d.longitude !== "number"
      ) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "Missing required fields",
          }),
        };
      }

      // Client fingerprint for rate limiting
      const ip =
        event.headers &&
        (event.headers["x-nf-client-connection-ip"] ||
          (event.headers["x-forwarded-for"] || "").split(",")[0].trim());
      const ua = event.headers && (event.headers["user-agent"] || "");
      const clientId = crypto
        .createHash("sha256")
        .update(String(ip || "") + "|" + String(ua || ""), "utf8")
        .digest("hex")
        .slice(0, 32);

      // Optional reCAPTCHA verification
      const recaptchaSecret = process.env.RECAPTCHA_SECRET || "";
      const recaptchaToken = bodyObj.recaptchaToken || "";
      if (recaptchaSecret && recaptchaToken) {
        try {
          const verify = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded;charset=UTF-8",
              },
              body: new URLSearchParams({
                secret: recaptchaSecret,
                response: recaptchaToken,
              }).toString(),
            }
          );
          const vjson = await verify.json();
          if (
            !vjson.success ||
            (typeof vjson.score === "number" && vjson.score < 0.5)
          ) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: "Failed human verification",
              }),
            };
          }
        } catch (e) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: "reCAPTCHA check failed",
            }),
          };
        }
      }

      // Prepare form-encoded body to Apps Script and attach token + client id
      const form = new URLSearchParams();
      form.set("action", bodyObj.action || "addLocation");
      form.set("data", JSON.stringify(bodyObj.data || {}));
      if (writeToken) form.set("token", writeToken);
      if (clientId) form.set("client", clientId);

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

function corsHeaders(origin, allowedOrigins) {
  const allow =
    allowedOrigins && allowedOrigins.length
      ? allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0] || "*"
      : "*";
  return {
    "Access-Control-Allow-Origin": allow,
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
