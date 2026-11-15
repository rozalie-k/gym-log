// Password gate for the whole site. The password lives in Netlify as the environment variable GYMLOG_PASSWORD.
// Enter it once per device; a signed cookie keeps you in for a year.
const COOKIE = "gl_auth";
const OPEN = ["/manifest.webmanifest", "/sw.js", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/favicon.ico"];

async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function page(wrong) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0B0B0B"><meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest">
<title>Gym Log</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&display=swap">
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#0B0B0B;color:#E4E2DE;font:12px "Inter Tight",Helvetica,Arial,sans-serif;display:grid;place-items:center;padding:max(16px,env(safe-area-inset-left))}
form{width:min(320px,100%);display:grid;gap:22px}
h1{margin:0;display:flex;justify-content:space-between;font-size:20px;letter-spacing:.14em;filter:blur(1.1px)}
input{width:100%;background:none;border:0;border-radius:0;color:#fff;font:600 16px "Inter Tight",Helvetica,sans-serif;padding:8px 0;
  background-image:linear-gradient(to bottom,rgba(228,226,222,0),rgba(228,226,222,.3) 50%,rgba(228,226,222,0));background-size:100% 3px;background-position:bottom;background-repeat:no-repeat}
input:focus{outline:none}
button{background:rgba(232,230,226,.04);border:0;color:#E4E2DE;padding:13px;font:700 12px "Inter Tight",Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
p{margin:0;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(228,226,222,.5);min-height:14px}
</style></head><body>
<form method="post" action="/login">
<h1><span>GYM</span><span>LOG</span></h1>
<input type="text" name="username" value="gym log" autocomplete="username" hidden>
<input type="password" name="password" placeholder="password" autocomplete="current-password" autofocus>
<button type="submit">Enter</button>
<p>${wrong ? "wrong password" : ""}</p>
</form></body></html>`;
  return new Response(html, { status: 401, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export default async (request) => {
  const pass = Netlify.env.get("GYMLOG_PASSWORD");
  if (!pass) return; // no password set: site stays open
  const url = new URL(request.url);
  if (OPEN.includes(url.pathname)) return;

  const token = await sha("gymlog-v1:" + pass);
  const cookies = (request.headers.get("cookie") || "").split(/;\s*/);
  if (cookies.includes(`${COOKIE}=${token}`)) return;

  if (url.pathname === "/login" && request.method === "POST") {
    const form = await request.formData();
    if ((form.get("password") || "") === pass) {
      return new Response(null, {
        status: 303,
        headers: { location: "/", "set-cookie": `${COOKIE}=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax` },
      });
    }
    return page(true);
  }
  if (url.pathname.startsWith("/api/")) return new Response("locked", { status: 401 });
  return page(false);
};

export const config = { path: "/*" };
