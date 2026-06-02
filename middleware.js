const AUTH_COOKIE = "team_teeth_site_auth";
const LOGIN_PATH = "/site-login";

export const config = {
  matcher: ["/((?!_vercel|favicon.ico).*)"],
};

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD;

  if (!password) {
    return;
  }

  const url = new URL(request.url);
  const expectedCookieValue = await hashPassword(password);
  const currentCookieValue = getCookieValue(request.headers.get("cookie"), AUTH_COOKIE);

  if (currentCookieValue === expectedCookieValue) {
    return;
  }

  if (url.pathname === LOGIN_PATH && request.method === "POST") {
    const formData = await request.formData();
    const enteredPassword = String(formData.get("password") || "");

    if (enteredPassword === password) {
      const redirectUrl = new URL("/", request.url);
      const response = new Response(null, {
        status: 303,
        headers: { Location: redirectUrl.toString() },
      });

      response.headers.set(
        "Set-Cookie",
        `${AUTH_COOKIE}=${expectedCookieValue}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
      );

      return response;
    }

    return new Response(renderLoginPage(true), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname === LOGIN_PATH) {
    return new Response(renderLoginPage(false), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response(null, {
    status: 303,
    headers: { Location: new URL(LOGIN_PATH, request.url).toString() },
  });
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getCookieValue(cookieHeader, cookieName) {
  return (cookieHeader || "")
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}

function renderLoginPage(hasError) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Team Teeth Sweepstake</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          linear-gradient(rgba(6, 17, 31, 0.28), rgba(6, 17, 31, 0.52)),
          url("/images/hero-optimized.jpg") center top / cover fixed,
          #06111f;
        color: white;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(100%, 420px);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        padding: 28px;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.07));
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
        backdrop-filter: blur(18px);
      }
      h1 {
        margin: 0;
        font-size: 1.65rem;
        line-height: 1.1;
      }
      p {
        margin: 10px 0 0;
        color: rgba(207, 250, 254, 0.78);
        line-height: 1.55;
      }
      label {
        display: block;
        margin-top: 22px;
        font-size: 0.74rem;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(207, 250, 254, 0.78);
      }
      input {
        width: 100%;
        margin-top: 8px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 10px;
        padding: 13px 14px;
        background: rgba(2, 6, 23, 0.78);
        color: white;
        font-size: 1rem;
        outline: none;
      }
      input:focus {
        border-color: #67e8f9;
      }
      button {
        width: 100%;
        margin-top: 16px;
        border: 0;
        border-radius: 10px;
        padding: 13px 14px;
        background: #67e8f9;
        color: #06111f;
        font-weight: 950;
        cursor: pointer;
      }
      .error {
        margin-top: 14px;
        border: 1px solid rgba(252, 165, 165, 0.38);
        border-radius: 10px;
        padding: 10px 12px;
        background: rgba(127, 29, 29, 0.34);
        color: #fecaca;
        font-weight: 750;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Team Teeth and Friends World Cup Sweepstake 2026</h1>
      <p>This page is private for sweepstake participants.</p>
      <form method="post" action="${LOGIN_PATH}">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" autofocus />
        <button type="submit">Enter site</button>
      </form>
      ${hasError ? '<div class="error">That password was not right. Please try again.</div>' : ""}
    </main>
  </body>
</html>`;
}
