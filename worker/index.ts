import { isValidPuzzle, type Puzzle } from "../src/types";

export interface Env {
  PUZZLES: KVNamespace;
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const CODE_LENGTH = 7;
const MAX_CREATE_ATTEMPTS = 5;

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/puzzles" && request.method === "POST") {
      return handleCreate(request, env);
    }

    const getMatch = url.pathname.match(/^\/api\/puzzles\/([A-Za-z0-9]+)$/);
    if (getMatch && request.method === "GET") {
      return handleGet(getMatch[1], env);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;

async function handleCreate(request: Request, env: Env): Promise<Response> {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be JSON" }, 400);
  }

  if (!isValidPuzzle(data)) {
    return jsonResponse({ error: "That doesn't look like a valid puzzle" }, 400);
  }

  const puzzle = data as Puzzle;
  let code = "";
  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
    code = generateCode();
    const existing = await env.PUZZLES.get(code);
    if (existing === null) break;
    if (attempt === MAX_CREATE_ATTEMPTS - 1) {
      return jsonResponse({ error: "Could not allocate a short code, try again" }, 500);
    }
  }

  await env.PUZZLES.put(code, JSON.stringify(puzzle));
  return jsonResponse({ code }, 201);
}

async function handleGet(code: string, env: Env): Promise<Response> {
  const raw = await env.PUZZLES.get(code);
  if (raw === null) {
    return jsonResponse({ error: "Puzzle not found" }, 404);
  }
  return new Response(raw, {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
