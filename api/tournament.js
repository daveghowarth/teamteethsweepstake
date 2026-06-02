const stateId = "live";

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  try {
    if (request.method === "GET") {
      await handleGet(response);
      return;
    }

    if (request.method === "PUT") {
      await handlePut(request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, 500, {
      error: "Tournament API failed.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleGet(response) {
  const supabase = getSupabaseConfig();
  const apiResponse = await fetch(
    `${supabase.url}/rest/v1/tournament_state?id=eq.${stateId}&select=data,updated_at`,
    {
      headers: getSupabaseHeaders(supabase.serviceKey),
    }
  );
  const rows = await apiResponse.json();

  if (!apiResponse.ok) {
    sendJson(response, apiResponse.status, {
      error: "Could not load live tournament data from Supabase.",
      details: rows,
    });
    return;
  }

  sendJson(response, 200, {
    data: rows?.[0]?.data || null,
    updatedAt: rows?.[0]?.updated_at || null,
  });
}

async function handlePut(request, response) {
  const body = await readJsonBody(request);

  if (!body?.data?.teams || !body?.data?.fixtures) {
    sendJson(response, 400, {
      error: "The saved tournament data must include teams and fixtures.",
    });
    return;
  }

  const supabase = getSupabaseConfig();
  const apiResponse = await fetch(
    `${supabase.url}/rest/v1/tournament_state?on_conflict=id`,
    {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(supabase.serviceKey),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: stateId,
        data: body.data,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  const rows = await apiResponse.json();

  if (!apiResponse.ok) {
    sendJson(response, apiResponse.status, {
      error: "Could not save live tournament data to Supabase.",
      details: rows,
    });
    return;
  }

  sendJson(response, 200, {
    data: rows?.[0]?.data || body.data,
    updatedAt: rows?.[0]?.updated_at || new Date().toISOString(),
  });
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return { url: url.replace(/\/$/, ""), serviceKey };
}

function getSupabaseHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
