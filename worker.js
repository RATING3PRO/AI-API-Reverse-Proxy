export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // ========= 使用说明页 =========
    if (path === "/") {
      return new Response(renderUsage(url.origin), {
        headers: { "content-type": "text/html; charset=utf-8" }
      })
    }

    let upstreamBase

    if (path.startsWith("/openai/")) {
      upstreamBase = "https://api.openai.com"
    } else if (path.startsWith("/anthropic/")) {
      upstreamBase = "https://api.anthropic.com"
    } else if (path.startsWith("/groq/")) {
      upstreamBase = "https://api.groq.com"
    } else if (path.startsWith("/deepseek/")) {
      upstreamBase = "https://api.deepseek.com"
    } else if (path.startsWith("/gemini/")) {
      upstreamBase = "https://generativelanguage.googleapis.com"
    } else {
      return new Response("Unknown route", { status: 404 })
    }

    const upstreamUrl =
      upstreamBase +
      path.replace(/^\/(openai|anthropic|groq|deepseek|gemini)/, "") +
      url.search

    // ========= 纯透明转发 =========
    return fetch(new Request(upstreamUrl, {
      method: request.method,
      headers: request.headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? null
          : request.body,
      redirect: "manual"
    }))
  }
}

// ========= 前端说明页（域名自适应） =========
function renderUsage(origin) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI API Reverse Proxy</title>
  <style>
    body { font-family: system-ui; max-width: 900px; margin: 40px auto; }
    pre { background: #0f172a; color: #e5e7eb; padding: 16px; }
    h1 { margin-bottom: 0; }
    small { color: #666; }
  </style>
</head>
<body>

<h1>AI API Reverse Proxy</h1>

<p>当前使用域名：</p>
<pre>${origin}</pre>

<h2>OpenAI</h2>
<pre>
Base URL:
${origin}/openai

官方 SDK 示例：
client = OpenAI({
  baseURL: "${origin}/openai",
  apiKey: "YOUR_API_KEY"
})
</pre>

<h2>Anthropic (Claude)</h2>
<pre>
POST ${origin}/anthropic/v1/messages
Header:
x-api-key: YOUR_API_KEY
</pre>

<h2>Groq</h2>
<pre>
POST ${origin}/groq/openai/v1/chat/completions
Authorization: Bearer YOUR_API_KEY
</pre>

<h2>DeepSeek</h2>
<pre>
POST ${origin}/deepseek/v1/chat/completions
Authorization: Bearer YOUR_API_KEY
</pre>

<h2>Gemini</h2>
<pre>
POST ${origin}/gemini/v1beta/models/...
?key=YOUR_API_KEY
</pre>

</body>
</html>
`
}
