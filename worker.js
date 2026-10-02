const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function handleOptions(request) {
  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, { headers: corsHeaders });
  } else {
    return new Response(null, { headers: { Allow: "GET, HEAD, POST, OPTIONS" } });
  }
}

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function generateId() {
  return crypto.randomUUID();
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/auth/login" && request.method === "POST") {
        const { username, password } = await request.json();
        const hashed = await hashPassword(password);
        
        const { results } = await env.DB.prepare(
          "SELECT id, username FROM users WHERE username = ? AND password_hash = ?"
        ).bind(username, hashed).all();

        if (results.length > 0) {
          return new Response(JSON.stringify({ success: true, user: results[0] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } else {
          return new Response(JSON.stringify({ success: false, error: "Invalid credentials" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      if (path === "/api/auth/register" && request.method === "POST") {
        const { username, password } = await request.json();
        const hashed = await hashPassword(password);
        const id = generateId();
        
        try {
          await env.DB.prepare(
            "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)"
          ).bind(id, username, hashed).run();
          
          return new Response(JSON.stringify({ success: true, user: { id, username } }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: "Username already exists" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      if (path === "/api/conversations" && request.method === "GET") {
        const userId = url.searchParams.get("userId");
        const { results } = await env.DB.prepare(
          "SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC"
        ).bind(userId).all();
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/conversations" && request.method === "POST") {
        const { userId, title } = await request.json();
        const id = generateId();
        await env.DB.prepare(
          "INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)"
        ).bind(id, userId, title).run();
        
        return new Response(JSON.stringify({ id, title }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/messages" && request.method === "GET") {
        const conversationId = url.searchParams.get("conversationId");
        const { results } = await env.DB.prepare(
          "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
        ).bind(conversationId).all();
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/chat" && request.method === "POST") {
        const body = await request.json();
        const { model = "@cf/meta/llama-3-8b-instruct", system = "You are an expert full-stack developer.", messages, stream = true, conversationId } = body;
        
        // Save user message to D1
        const userMsg = messages[messages.length - 1];
        if (conversationId && userMsg.role === "user") {
          await env.DB.prepare(
            "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)"
          ).bind(generateId(), conversationId, "user", userMsg.content).run();
        }

        const aiMessages = [
          { role: "system", content: system },
          ...messages
        ];

        // Ensure we handle Cloudflare AI stream
        const response = await env.AI.run(model, {
          messages: aiMessages,
          stream: stream
        });

        if (!stream) {
          if (conversationId && response.response) {
            await env.DB.prepare(
              "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)"
            ).bind(generateId(), conversationId, "assistant", response.response).run();
          }
          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Handle stream and asynchronously save assistant message to DB after stream finishes
        // Since we are returning a stream directly, intercepting the full content requires a TransformStream
        const { readable, writable } = new TransformStream();
        
        ctx.waitUntil(
          (async () => {
            const reader = response.getReader();
            const writer = writable.getWriter();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let fullReply = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              await writer.write(value);
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");
              
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const jsonStr = line.replace("data: ", "").trim();
                  if (jsonStr === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const token = parsed.response || "";
                    fullReply += token;
                  } catch (e) {
                    // Ignore parsing errors for partial chunks
                  }
                }
              }
            }
            await writer.close();
            
            if (conversationId && fullReply) {
              await env.DB.prepare(
                "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)"
              ).bind(generateId(), conversationId, "assistant", fullReply).run();
              
              await env.DB.prepare(
                "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
              ).bind(conversationId).run();
            }
          })()
        );

        return new Response(readable, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
        });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
