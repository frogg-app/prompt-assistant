const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const { spawn } = require("child_process");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR));

const PROVIDERS = [
  { id: "openai", name: "OpenAI", supports_dynamic_models: true },
  { id: "gemini", name: "Google Gemini", supports_dynamic_models: true },
  { id: "copilot", name: "Copilot CLI", supports_dynamic_models: false },
  { id: "claude", name: "Claude Code", supports_dynamic_models: false }
];

const FALLBACK_MODELS = {
  openai: [
    { id: "gpt-4o-mini", label: "gpt-4o-mini" },
    { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
    { id: "gpt-4o", label: "gpt-4o" }
  ],
  gemini: [
    { id: "gemini-1.5-pro", label: "gemini-1.5-pro" },
    { id: "gemini-1.5-flash", label: "gemini-1.5-flash" },
    { id: "gemini-2.0-flash-exp", label: "gemini-2.0-flash-exp" }
  ],
  copilot: [{ id: "copilot-default", label: "default (Copilot CLI)" }],
  claude: [
    { id: "sonnet", label: "sonnet (latest)" },
    { id: "opus", label: "opus (latest)" },
    { id: "haiku", label: "haiku (fast)" }
  ]
};

const SYSTEM_PROMPT = `You are PromptRefiner. Your job is to infer the user's objective and rewrite their rough prompt into a significantly improved, ready-to-paste prompt for the selected model/provider.

Rules:
- Decide if clarifications are REQUIRED to avoid likely failure. Ask only when necessary.
- If clarifications are required, return only clarification items; do not generate an improved prompt yet.
- If clarifications are NOT required, return the improved prompt directly.
- If clarifications are provided in the input, treat them as final and produce the improved prompt. Do NOT request additional clarifications unless it is absolutely impossible to proceed.
- Always infer and list any assumptions you made (empty array if none).
- If learning_mode is false, learning_report MUST be null.
- Output MUST be valid JSON only, no extra commentary.

Clarification item schema:
- id: stable snake_case identifier
- question: plain language question
- why_required: 1-2 concrete sentences
- type: one of [single_select, multi_select, short_text, long_text, number, boolean]
- options: only for select types
- default: optional
- validation: optional object with required/min/max or regex-like guidance

Learning report schema (when learning_mode is true):
- overall_grade: "A"-"F" or 0-100
- overall_justification: short sentence
- category_scores: object with 0-10 scores for clarity_specificity, context_completeness, constraints_success_criteria, input_output_definition, ambiguity_assumptions, testability
- top_weaknesses: array of exactly 3 items, each with issue, example, fix
- actionable_suggestions: short bullet-like strings

You must return one of these JSON shapes:
Case A (clarifications required):
{
  "needs_clarification": true,
  "clarifications": [ ... ],
  "improved_prompt": null,
  "assumptions": [],
  "learning_report": { ... } | null
}

Case B (no clarifications required):
{
  "needs_clarification": false,
  "clarifications": [],
  "improved_prompt": "string",
  "assumptions": ["string"],
  "learning_report": { ... } | null
}
`;

const CLARIFICATION_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["id", "question", "why_required", "type"],
  properties: {
    id: { type: "string" },
    question: { type: "string" },
    why_required: { type: "string" },
    type: {
      type: "string",
      enum: [
        "single_select",
        "multi_select",
        "short_text",
        "long_text",
        "number",
        "boolean"
      ]
    },
    options: { type: "array", items: { type: "string" } },
    default: {
      anyOf: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "array" },
        { type: "object" },
        { type: "null" }
      ]
    },
    validation: { type: "object", additionalProperties: true }
  }
};

const LEARNING_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_grade",
    "overall_justification",
    "category_scores",
    "top_weaknesses",
    "actionable_suggestions"
  ],
  properties: {
    overall_grade: {
      anyOf: [
        { type: "string" },
        { type: "number", minimum: 0, maximum: 100 }
      ]
    },
    overall_justification: { type: "string" },
    category_scores: {
      type: "object",
      additionalProperties: false,
      required: [
        "clarity_specificity",
        "context_completeness",
        "constraints_success_criteria",
        "input_output_definition",
        "ambiguity_assumptions",
        "testability"
      ],
      properties: {
        clarity_specificity: { type: "number", minimum: 0, maximum: 10 },
        context_completeness: { type: "number", minimum: 0, maximum: 10 },
        constraints_success_criteria: {
          type: "number",
          minimum: 0,
          maximum: 10
        },
        input_output_definition: { type: "number", minimum: 0, maximum: 10 },
        ambiguity_assumptions: { type: "number", minimum: 0, maximum: 10 },
        testability: { type: "number", minimum: 0, maximum: 10 }
      }
    },
    top_weaknesses: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["issue", "example", "fix"],
        properties: {
          issue: { type: "string" },
          example: { type: "string" },
          fix: { type: "string" }
        }
      }
    },
    actionable_suggestions: { type: "array", items: { type: "string" } }
  }
};

const CLI_JSON_SCHEMA = JSON.stringify({
  type: "object",
  additionalProperties: false,
  required: [
    "needs_clarification",
    "clarifications",
    "improved_prompt",
    "assumptions",
    "learning_report"
  ],
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: [
        "needs_clarification",
        "clarifications",
        "improved_prompt",
        "assumptions",
        "learning_report"
      ],
      properties: {
        needs_clarification: { const: true },
        clarifications: { type: "array", items: CLARIFICATION_ITEM_SCHEMA },
        improved_prompt: { type: "null" },
        assumptions: { type: "array", items: { type: "string" } },
        learning_report: {
          anyOf: [LEARNING_REPORT_SCHEMA, { type: "null" }]
        }
      }
    },
    {
      type: "object",
      additionalProperties: false,
      required: [
        "needs_clarification",
        "clarifications",
        "improved_prompt",
        "assumptions",
        "learning_report"
      ],
      properties: {
        needs_clarification: { const: false },
        clarifications: { type: "array", maxItems: 0 },
        improved_prompt: { type: "string", minLength: 1 },
        assumptions: { type: "array", items: { type: "string" } },
        learning_report: {
          anyOf: [LEARNING_REPORT_SCHEMA, { type: "null" }]
        }
      }
    }
  ]
});

function providerById(id) {
  return PROVIDERS.find((provider) => provider.id === id);
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = text.slice(firstBrace, lastBrace + 1);
      try {
        return { ok: true, value: JSON.parse(slice) };
      } catch (sliceError) {
        return { ok: false, error: sliceError };
      }
    }
    return { ok: false, error };
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    return false;
  }
}

async function anyPathExists(paths) {
  const results = await Promise.all(paths.map(pathExists));
  return results.some(Boolean);
}

function copilotConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, "copilot");
  }
  return path.join(os.homedir(), ".copilot");
}

function copilotAuthDirs() {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return [
    path.join(base, "github-copilot"),
    path.join(base, "copilot")
  ];
}

function claudeAuthPaths() {
  return [
    path.join(os.homedir(), ".claude.json"),
    path.join(os.homedir(), ".claude")
  ];
}

async function ensureCopilotConfig(trustedDir) {
  const configDir = copilotConfigDir();
  const configPath = path.join(configDir, "config.json");
  let payload = {};

  try {
    const raw = await fs.readFile(configPath, "utf-8");
    payload = JSON.parse(raw);
  } catch (error) {
    if (error.code && error.code !== "ENOENT") {
      return;
    }
  }

  if (!Array.isArray(payload.trusted_folders)) {
    payload.trusted_folders = [];
  }

  if (!payload.trusted_folders.includes(trustedDir)) {
    payload.trusted_folders.push(trustedDir);
  }

  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(payload, null, 2), "utf-8");
}

function runCommand(command, args, options = {}) {
  const { timeoutMs = 120000, cwd, env } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        NO_COLOR: "1",
        TERM: "dumb",
        ...env
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const detail = stderr.trim() || stdout.trim();
        reject(
          new Error(
            `${command} exited with code ${code}${detail ? `: ${detail}` : ""}`
          )
        );
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function fetchOpenAIModels(apiKey) {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`OpenAI models request failed: ${response.status}`);
  }

  const data = await response.json();
  const models = Array.isArray(data.data) ? data.data : [];
  const filtered = models
    .map((model) => model.id)
    .filter((id) => typeof id === "string" && /^(gpt|o1)/.test(id))
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, label: id }));

  return filtered.length ? filtered : FALLBACK_MODELS.openai;
}

async function fetchGeminiModels(apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Gemini models request failed: ${response.status}`);
  }

  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models : [];
  const filtered = models
    .filter((model) =>
      (model.supportedGenerationMethods || []).includes("generateContent")
    )
    .map((model) => {
      const name = model.name || "";
      const id = name.includes("/") ? name.split("/").pop() : name;
      if (!id || !id.includes("gemini")) {
        return null;
      }
      const label = model.displayName ? `${model.displayName} (${id})` : id;
      return { id, label };
    })
    .filter(Boolean);

  return filtered.length ? filtered : FALLBACK_MODELS.gemini;
}

async function callOpenAI({ apiKey, model, userContent }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return content.trim();
}

async function callGemini({ apiKey, model, userContent }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userContent }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") ||
    "";
  return content.trim();
}

async function callCopilotCli({ userContent }) {
  const workdir = process.env.COPILOT_WORKDIR || "/tmp";
  await ensureCopilotConfig(workdir);
  const args = ["-p", userContent];
  const { stdout } = await runCommand("copilot", args, { cwd: workdir });
  return stdout;
}

async function callClaudeCli({ model, userContent }) {
  const args = [
    "-p",
    userContent,
    "--output-format",
    "json",
    "--json-schema",
    CLI_JSON_SCHEMA,
    "--system-prompt",
    SYSTEM_PROMPT,
    "--tools",
    ""
  ];

  if (model) {
    args.push("--model", model);
  }

  const { stdout } = await runCommand("claude", args, { cwd: "/tmp" });
  const parsed = safeJsonParse(stdout);
  if (!parsed.ok) {
    throw new Error("Claude CLI returned invalid JSON.");
  }

  const payload = parsed.value || {};
  if (payload.structured_output) {
    return payload.structured_output;
  }

  if (typeof payload.result === "string") {
    const inner = safeJsonParse(payload.result);
    if (inner.ok) {
      return inner.value;
    }
  }

  if (payload.result && typeof payload.result === "object") {
    return payload.result;
  }

  throw new Error("Claude CLI response missing structured output.");
}

function providerSetup(providerId) {
  switch (providerId) {
    case "openai":
      return {
        env: ["OPENAI_API_KEY"],
        docs: "https://platform.openai.com/api-keys",
        steps: [
          "Create an API key in the OpenAI dashboard.",
          "Set OPENAI_API_KEY in your environment or .env file.",
          "Restart the server or container."
        ]
      };
    case "gemini":
      return {
        env: ["GEMINI_API_KEY"],
        docs: "https://ai.google.dev/gemini-api/docs/api-key",
        steps: [
          "Create a Gemini API key in Google AI Studio.",
          "Set GEMINI_API_KEY in your environment or .env file.",
          "Restart the server or container."
        ]
      };
    case "copilot":
      return {
        env: ["GH_TOKEN", "GITHUB_TOKEN"],
        docs: "https://docs.github.com/copilot/concepts/agents/about-copilot-cli",
        steps: [
          "Install the Copilot CLI and authenticate with /login or a PAT.",
          "Set GH_TOKEN or GITHUB_TOKEN with the Copilot Requests permission.",
          "If using Docker + OAuth login, mount ~/.config/github-copilot.",
          "Restart the server or container."
        ]
      };
    case "claude":
      return {
        env: [],
        docs: "https://code.claude.com/docs/en/setup",
        steps: [
          "Install Claude Code and run `claude`, then use /login.",
          "Mount ~/.claude and ~/.claude.json into the container if needed.",
          "Restart the server or container."
        ]
      };
    default:
      return { env: [], docs: "", steps: [] };
  }
}

async function providerAvailability(providerId) {
  if (providerId === "openai") {
    if (process.env.OPENAI_API_KEY) {
      return { available: true, reason: "" };
    }
    return { available: false, reason: "OPENAI_API_KEY not set." };
  }

  if (providerId === "gemini") {
    if (process.env.GEMINI_API_KEY) {
      return { available: true, reason: "" };
    }
    return { available: false, reason: "GEMINI_API_KEY not set." };
  }

  if (providerId === "copilot") {
    if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
      return { available: true, reason: "" };
    }
    const dirs = copilotAuthDirs();
    const hasAuth = await anyPathExists(dirs);
    if (hasAuth) {
      return { available: true, reason: "" };
    }
    return {
      available: false,
      reason: "Copilot CLI auth not configured."
    };
  }

  if (providerId === "claude") {
    const paths = claudeAuthPaths();
    const hasAuth = await anyPathExists(paths);
    if (hasAuth) {
      return { available: true, reason: "" };
    }
    return {
      available: false,
      reason: "Claude Code login not detected."
    };
  }

  return { available: false, reason: "Unknown provider." };
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/providers", async (req, res) => {
  const providers = await Promise.all(
    PROVIDERS.map(async (provider) => {
      const availability = await providerAvailability(provider.id);
      return {
        ...provider,
        available: availability.available,
        unavailable_reason: availability.reason,
        setup: providerSetup(provider.id)
      };
    })
  );
  res.json({ providers });
});

app.get("/models", async (req, res) => {
  const providerId = String(req.query.provider || "").toLowerCase();
  const provider = providerById(providerId);

  if (!provider) {
    return res.status(400).json({ error: "Unknown provider" });
  }

  try {
    if (providerId === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.json({
          provider: providerId,
          is_dynamic: false,
          models: FALLBACK_MODELS.openai,
          note: "OPENAI_API_KEY not set; using fallback list."
        });
      }
      const models = await fetchOpenAIModels(apiKey);
      return res.json({ provider: providerId, is_dynamic: true, models });
    }

    if (providerId === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          provider: providerId,
          is_dynamic: false,
          models: FALLBACK_MODELS.gemini,
          note: "GEMINI_API_KEY not set; using fallback list."
        });
      }
      const models = await fetchGeminiModels(apiKey);
      return res.json({ provider: providerId, is_dynamic: true, models });
    }

    if (providerId === "claude") {
      return res.json({
        provider: providerId,
        is_dynamic: false,
        models: FALLBACK_MODELS.claude,
        note: "Claude Code models are CLI aliases."
      });
    }

    if (providerId === "copilot") {
      return res.json({
        provider: providerId,
        is_dynamic: false,
        models: FALLBACK_MODELS.copilot,
        note: "Copilot CLI manages model selection."
      });
    }

    return res.json({
      provider: providerId,
      is_dynamic: false,
      models: []
    });
  } catch (error) {
    const fallback = FALLBACK_MODELS[providerId] || [];
    return res.json({
      provider: providerId,
      is_dynamic: false,
      models: fallback,
      note: `Using fallback list: ${error.message}`
    });
  }
});

app.post("/improve", async (req, res) => {
  const {
    provider,
    model,
    rough_prompt: roughPrompt,
    constraints,
    learning_mode: learningMode,
    clarifications
  } = req.body || {};

  if (!provider || !model || !roughPrompt) {
    return res
      .status(400)
      .json({ error: "provider, model, and rough_prompt are required." });
  }

  const providerId = String(provider).toLowerCase();

  const inputPayload = {
    rough_prompt: String(roughPrompt),
    constraints: constraints ? String(constraints) : "",
    learning_mode: Boolean(learningMode),
    clarifications: clarifications || null
  };

  const userContent = `Input:\n${JSON.stringify(inputPayload, null, 2)}`;

  try {
    let raw;
    if (providerId === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "OPENAI_API_KEY not set." });
      }
      raw = await callOpenAI({ apiKey, model, userContent });
    } else if (providerId === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY not set." });
      }
      raw = await callGemini({ apiKey, model, userContent });
    } else if (providerId === "claude") {
      raw = await callClaudeCli({ model, userContent });
      return res.json(raw);
    } else if (providerId === "copilot") {
      const prompt = `${SYSTEM_PROMPT}\n\n${userContent}`;
      raw = await callCopilotCli({ userContent: prompt });
    } else {
      return res.status(400).json({ error: "Unknown provider." });
    }

    const parsed = safeJsonParse(raw);
    if (!parsed.ok) {
      return res.status(502).json({
        error: "Model returned invalid JSON.",
        raw
      });
    }

    return res.json(parsed.value);
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Prompt Assistant running on http://${HOST}:${PORT}`);
});
