const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const { spawn } = require("child_process");
const express = require("express");
const providersStorage = require("./providers-storage");
const promptTypesStorage = require("./prompt-types-storage");

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR));

// Fallback model lists when dynamic fetching fails
const FALLBACK_MODELS = {
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { id: "gpt-4", label: "GPT-4" },
    { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { id: "o1", label: "O1" },
    { id: "o1-mini", label: "O1 Mini" },
    { id: "o1-preview", label: "O1 Preview" }
  ],
  gemini: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { id: "gemini-1.0-pro", label: "Gemini 1.0 Pro" }
  ],
  copilot: [
    { id: "claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
    { id: "claude-haiku-4.5", label: "Claude Haiku 4.5" },
    { id: "claude-opus-4.5", label: "Claude Opus 4.5" },
    { id: "claude-sonnet-4", label: "Claude Sonnet 4" },
    { id: "gpt-5.2-codex", label: "GPT-5.2 Codex" },
    { id: "gpt-5.1-codex-max", label: "GPT-5.1 Codex Max" },
    { id: "gpt-5.1-codex", label: "GPT-5.1 Codex" },
    { id: "gpt-5.2", label: "GPT-5.2" },
    { id: "gpt-5.1", label: "GPT-5.1" },
    { id: "gpt-5", label: "GPT-5" },
    { id: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini" },
    { id: "gpt-5-mini", label: "GPT-5 Mini" },
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview" }
  ],
  claude: [
    { id: "sonnet", label: "Sonnet (Latest)", description: "Fast and intelligent" },
    { id: "opus", label: "Opus (Latest)", description: "Most capable model" },
    { id: "haiku", label: "Haiku (Latest)", description: "Fastest, most compact" },
    { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" }
  ]
};

const SYSTEM_PROMPT = `You are PromptRefiner. Your job is to rewrite the user's prompt into a significantly improved, ready-to-paste prompt.

CLARIFICATION PHILOSOPHY:
- Be EXTREMELY conservative about asking for clarifications. Most prompts should NOT need any.
- Match clarification complexity to prompt complexity: simple prompts = simple assumptions.
- Only clarify when the answer would DRASTICALLY change the output direction (5x+ scope difference).
- Maximum 1-3 clarifications, but prefer 0-1 for simple prompts.
- Fast identification: if clarification is needed, identify it quickly without deep analysis.

NEVER CLARIFY (even if technically relevant):
- Target audience when context makes it obvious (coffee shop = general public)
- Technical vs non-technical delivery when context is clear
- Accessibility, compliance, regulations (would be explicit if required)
- Existing systems/integrations when none are mentioned (assume none)
- Goals when self-evident ("build a website" = wants a working website)
- Data sensitivity for clearly simple use cases
- Timelines, deadlines, urgency
- Branding, styling preferences
- Output format, tone, detail level

ONLY CLARIFY WHEN:
- User explicitly mentions something complex but omits critical details (e.g., "integrate with our API" but no API specified)
- Multiple completely different outputs are equally valid (e.g., "write a script" - shell? python? javascript?)
- Scope is genuinely ambiguous by 5x+ (e.g., "build an app" - landing page or full SaaS platform?)

SIMPLE PROMPT HANDLING:
For vague prompts like "build me a website for a coffee shop":
- Assume simple, standard requirements
- At most 1 clarification on core FEATURES/SCOPE if truly ambiguous
- Example good clarification: "What key features? (static info site, online ordering, reservations)"
- Example bad clarifications: audience, accessibility, integrations, goals, timeline

GOOD ASSUMPTION PATTERNS:
- No tech specified → pick sensible default and note it
- No audience specified → infer from context
- No integrations mentioned → assume standalone
- No compliance mentioned → assume standard web practices

Other rules:
- If the prompt type is "none" or "generic", apply sensible general-purpose refinement.
- If clarifications are required, return ONLY clarification items; do not generate an improved prompt yet.
- If clarifications are NOT required, return the improved prompt directly with assumptions listed.
- If clarifications are provided in the input, treat them as final and produce the improved prompt.
- Always infer and list any assumptions you made (empty array if none).
- If learning_mode is false: learning_report MUST be null, and is_already_excellent MUST be false (always improve the prompt).
- If learning_mode is true: Grade the prompt (0-100 score) and provide a learning_report. If the prompt is already excellent (85+ overall score), set is_already_excellent: true.
- Output MUST be valid JSON only, no extra commentary.

Grading criteria (ONLY used when learning_mode is true) - each scored 0-100:
- Clarity & Specificity: Is the goal crystal clear? Are key terms defined? (0-100)
- Context Completeness: Does it provide necessary background information? (0-100)
- Constraints & Success Criteria: Are boundaries and success metrics defined? (0-100)
- Input/Output Definition: Are expected inputs and outputs clearly specified? (0-100)
- Ambiguity & Assumptions: Is it free from vague language and unclear references? (0-100)
- Testability: Can you objectively verify if the output meets the goal? (0-100)

The overall_score is calculated from category scores: (sum of all 6 category scores) / 6

Clarification item schema:
- id: stable snake_case identifier
- question: plain language question
- why_required: 1-2 concrete sentences
- type: one of [single_select, multi_select, short_text, long_text, number, boolean]
- options: only for select types
- default: optional
- validation: optional object with required/min/max or regex-like guidance

Learning report schema (when learning_mode is true):
- overall_score: 0-100 number (average of category scores)
- overall_justification: short sentence explaining the score
- category_scores: object with 0-100 scores for clarity_specificity, context_completeness, constraints_success_criteria, input_output_definition, ambiguity_assumptions, testability
- top_weaknesses: array of up to 3 items (fewer if prompt is strong), each with issue, example, fix
- strengths: array of strings highlighting what the prompt does well
- actionable_suggestions: short bullet-like strings for improvement

You must return one of these JSON shapes:
Case A (clarifications required):
{
  "needs_clarification": true,
  "clarifications": [ ... ],
  "improved_prompt": null,
  "is_already_excellent": false,
  "excellence_reason": null,
  "assumptions": [],
  "learning_report": null
}

Case B (prompt is already excellent - ONLY when learning_mode is true and score >= 85):
{
  "needs_clarification": false,
  "clarifications": [],
  "improved_prompt": "original prompt here",
  "is_already_excellent": true,
  "excellence_reason": "Brief explanation of why this prompt is already well-crafted",
  "assumptions": [],
  "learning_report": { ... }
}

Case C (prompt improved):
{
  "needs_clarification": false,
  "clarifications": [],
  "improved_prompt": "improved prompt here",
  "is_already_excellent": false,
  "excellence_reason": null,
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
    "overall_score",
    "overall_justification",
    "category_scores",
    "top_weaknesses",
    "strengths",
    "actionable_suggestions"
  ],
  properties: {
    overall_score: {
      type: "number",
      minimum: 0,
      maximum: 100
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
        clarity_specificity: { type: "number", minimum: 0, maximum: 100 },
        context_completeness: { type: "number", minimum: 0, maximum: 100 },
        constraints_success_criteria: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        input_output_definition: { type: "number", minimum: 0, maximum: 100 },
        ambiguity_assumptions: { type: "number", minimum: 0, maximum: 100 },
        testability: { type: "number", minimum: 0, maximum: 100 }
      }
    },
    top_weaknesses: {
      type: "array",
      minItems: 0,
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
    strengths: { type: "array", items: { type: "string" } },
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

async function providerById(id) {
  const providers = await providersStorage.getAllProviders();
  return providers.find((provider) => provider.id === id);
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
    path.join(base, "copilot"),
    path.join(os.homedir(), ".copilot")  // Copilot CLI default config dir
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

/**
 * Parse model choices from CLI help output
 * Looks for patterns like: --model <model> ... (choices: "model1", "model2", ...)
 */
function parseCliModelChoices(helpOutput) {
  // Match the --model line and capture all quoted model names
  const modelMatch = helpOutput.match(/--model\s+<model>\s+[^(]*\(choices:\s*([^)]+)\)/is);
  if (!modelMatch) {
    return null;
  }

  const choicesStr = modelMatch[1];
  const models = [];
  const regex = /"([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(choicesStr)) !== null) {
    const id = match[1];
    // Create a readable label from the model ID
    const label = id
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    models.push({ id, label });
  }

  return models.length > 0 ? models : null;
}

/**
 * Fetch available models from Copilot CLI dynamically
 * Tries multiple strategies to get models from the CLI help output
 */
async function fetchCopilotModels() {
  try {
    // Use an invalid model name to trigger the error message that lists all valid models
    const { stdout, stderr } = await runCommand(
      "copilot", 
      ["--model", "invalid-model-to-list-choices", "-p", "test"], 
      { timeoutMs: 10000 }
    ).catch(err => {
      // The command will fail, but we can parse stderr for the model list
      return { stdout: '', stderr: err.message || '' };
    });
    
    // Look for the error message pattern: "Allowed choices are model1, model2, ..."
    const errorText = stderr || stdout || '';
    const choicesMatch = errorText.match(/Allowed choices are (.+?)\.?$/m);
    
    if (choicesMatch && choicesMatch[1]) {
      const modelNames = choicesMatch[1]
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);
      
      if (modelNames.length > 0) {
        const models = modelNames.map(id => ({
          id,
          label: id.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
        }));
        console.log(`Copilot CLI: Found ${models.length} models`);
        return models;
      }
    }
    
    // Fallback if parsing fails
    console.log("Copilot CLI: Using fallback model list");
    return FALLBACK_MODELS.copilot;
  } catch (error) {
    console.error("Failed to fetch Copilot models:", error.message);
    return FALLBACK_MODELS.copilot;
  }
}

/**
 * Fetch available models from Claude CLI dynamically
 * Note: Claude CLI uses aliases (sonnet, opus, haiku) + specific model names
 */
async function fetchClaudeModels() {
  try {
    const { stdout } = await runCommand("claude", ["--help"], { timeoutMs: 10000 });
    
    const models = [];
    const seen = new Set();
    
    // Parse model aliases from --model help text
    // Look for patterns like: 'sonnet', 'opus', 'haiku', or full model names
    const aliasRegex = /['"]?(sonnet|opus|haiku)(?:\s+\d+(?:\.\d+)?)?['"]?/gi;
    const aliasMatches = stdout.matchAll(aliasRegex);
    
    for (const match of aliasMatches) {
      const alias = match[0].replace(/['"`]/g, '').trim().toLowerCase();
      const baseAlias = alias.split(/\s+/)[0]; // Get just 'sonnet', 'opus', 'haiku'
      if (!seen.has(baseAlias)) {
        seen.add(baseAlias);
        const version = alias.includes(' ') ? ` ${alias.split(/\s+/).slice(1).join(' ')}` : '';
        models.push({ 
          id: baseAlias, 
          label: `${baseAlias.charAt(0).toUpperCase() + baseAlias.slice(1)}${version}` 
        });
      }
    }
    
    // Also look for specific versioned model names like claude-sonnet-4-5-20250929
    const versionedRegex = /claude-([a-z]+)-([\d-]+)/gi;
    const versionedMatches = stdout.matchAll(versionedRegex);
    
    for (const match of versionedMatches) {
      const fullId = match[0];
      if (!seen.has(fullId)) {
        seen.add(fullId);
        const modelType = match[1]; // sonnet, opus, haiku
        const version = match[2].replace(/-/g, '.');
        models.push({ 
          id: fullId, 
          label: `Claude ${modelType.charAt(0).toUpperCase() + modelType.slice(1)} ${version}` 
        });
      }
    }
    
    // If we found models, return them; otherwise use fallback
    if (models.length > 0) {
      console.log(`Claude CLI: Found ${models.length} models`);
      return models;
    }
    
    console.log("Claude CLI: Using fallback model list");
    return FALLBACK_MODELS.claude;
  } catch (error) {
    console.error("Failed to fetch Claude models:", error.message);
    return FALLBACK_MODELS.claude;
  }
}

async function callOpenAI({ apiKey, model, userContent, promptTypeSystemPrompt = '' }) {
  const systemPrompt = SYSTEM_PROMPT + promptTypeSystemPrompt;
  
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
        { role: "system", content: systemPrompt },
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

async function callGemini({ apiKey, model, userContent, promptTypeSystemPrompt = '' }) {
  const systemPrompt = SYSTEM_PROMPT + promptTypeSystemPrompt;
  
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
          parts: [{ text: systemPrompt }]
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

async function callCopilotCli({ model, userContent, promptTypeSystemPrompt = '' }) {
  const workdir = process.env.COPILOT_WORKDIR || "/tmp";
  await ensureCopilotConfig(workdir);
  
  // Build the full prompt with system instructions and any prompt type guidance
  const systemPrompt = SYSTEM_PROMPT + promptTypeSystemPrompt;
  const fullPrompt = `${systemPrompt}\n\n${userContent}`;
  
  // Use -s flag for streaming output and -p for prompt
  const args = ["-s", "-p", fullPrompt];
  
  // Add model flag if specified
  if (model) {
    args.unshift("--model", model);
  }
  
  const { stdout } = await runCommand("copilot", args, { cwd: workdir });
  return stdout;
}

async function callClaudeCli({ model, userContent, promptTypeSystemPrompt = '' }) {
  const systemPrompt = SYSTEM_PROMPT + promptTypeSystemPrompt;
  
  const args = [
    "-p",
    userContent,
    "--output-format",
    "json",
    "--json-schema",
    CLI_JSON_SCHEMA,
    "--system-prompt",
    systemPrompt,
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

async function providerAvailability(provider) {
  const providerId = provider.id;
  const config = provider.config || {};
  
  // Built-in providers with specific logic
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

  // Custom providers
  if (config.type === "api_key") {
    // Check if API key is provided in config or env
    if (config.api_key) {
      return { available: true, reason: "" };
    }
    if (config.env_var && process.env[config.env_var]) {
      return { available: true, reason: "" };
    }
    return { 
      available: false, 
      reason: `API key not configured${config.env_var ? ` (set ${config.env_var} or configure in provider settings)` : ''}.` 
    };
  }

  if (config.type === "openai_compatible") {
    // Check if API endpoint and key are provided
    if (config.base_url && (config.api_key || (config.env_var && process.env[config.env_var]))) {
      return { available: true, reason: "" };
    }
    return { available: false, reason: "API endpoint and key not configured." };
  }

  // Default: assume unavailable
  return { available: false, reason: "Provider not configured." };
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/providers", async (req, res) => {
  try {
    const allProviders = await providersStorage.getAllProviders();
    const providers = await Promise.all(
      allProviders.map(async (provider) => {
        const availability = await providerAvailability(provider);
        return {
          ...provider,
          available: availability.available,
          unavailable_reason: availability.reason,
          setup: providerSetup(provider.id)
        };
      })
    );
    res.json({ providers });
  } catch (error) {
    res.status(500).json({ error: "Failed to load providers" });
  }
});

app.get("/models", async (req, res) => {
  const providerId = String(req.query.provider || "").toLowerCase();
  const forceRefresh = req.query.refresh === "true";
  const provider = await providerById(providerId);

  if (!provider) {
    return res.status(400).json({ error: "Unknown provider" });
  }

  try {
    let models = [];
    let isDynamic = false;
    let note = "";
    let fromCache = false;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = providersStorage.getCachedModels(providerId);
      if (cached && cached.models.length > 0 && !providersStorage.isCacheStale(providerId)) {
        models = cached.models;
        isDynamic = true;
        fromCache = true;
        note = `Cached models (refreshed ${new Date(cached.fetchedAt).toLocaleString()}).`;
      }
    }
    
    // Fetch fresh models if no cache or force refresh
    if (!fromCache) {
      if (providerId === "openai") {
        const apiKey = provider.config?.api_key || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          note = "OPENAI_API_KEY not set; no models available.";
        } else {
          models = await fetchOpenAIModels(apiKey);
          isDynamic = true;
          await providersStorage.setCachedModels(providerId, models);
        }
      } else if (providerId === "gemini") {
        const apiKey = provider.config?.api_key || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          note = "GEMINI_API_KEY not set; no models available.";
        } else {
          models = await fetchGeminiModels(apiKey);
          isDynamic = true;
          await providersStorage.setCachedModels(providerId, models);
        }
      } else if (providerId === "claude") {
        models = await fetchClaudeModels();
        isDynamic = true;
        note = "Claude Code uses model aliases (sonnet, opus, haiku) or full model names.";
        if (models.length > 0) {
          await providersStorage.setCachedModels(providerId, models);
        }
      } else if (providerId === "copilot") {
        models = await fetchCopilotModels();
        isDynamic = true;
        note = "Models fetched from Copilot CLI.";
        if (models.length > 0) {
          await providersStorage.setCachedModels(providerId, models);
        }
      } else if (provider.config?.type === "openai_compatible") {
        // For OpenAI-compatible APIs with security controls
        const apiKey = provider.config?.api_key || 
                      (provider.config?.env_var ? process.env[provider.config.env_var] : null);
        const baseUrl = provider.config?.base_url;
      
        if (apiKey && baseUrl) {
          try {
            // Validate URL
            const url = new URL(baseUrl);
            if (!['http:', 'https:'].includes(url.protocol)) {
              throw new Error('Invalid protocol');
            }
            
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${baseUrl}/models`, {
              headers: { Authorization: `Bearer ${apiKey}` },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              // Check response size
              const contentLength = response.headers.get('content-length');
              if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
                throw new Error('Response too large');
              }
              
              const data = await response.json();
              models = Array.isArray(data.data) 
                ? data.data.map(m => ({ id: m.id, label: m.id })).slice(0, 1000) // Limit to 1000 models
                : [];
              isDynamic = true;
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              note = "Request timeout; using configured list.";
            } else {
              note = "Failed to fetch models from API; using configured list.";
            }
            models = provider.models || [];
          }
        } else {
          models = provider.models || [];
          note = "API key not configured; using configured list.";
        }
      } else {
        // Custom provider with static model list
        models = provider.models || [];
      }
    }
    
    // Apply model filtering if configured
    const filteredModelIds = await providersStorage.getFilteredModels(providerId);
    if (filteredModelIds && filteredModelIds.length > 0) {
      models = models.filter(m => filteredModelIds.includes(m.id));
      if (!note) {
        note = `Showing ${models.length} filtered model(s).`;
      }
    }
    
    return res.json({ 
      provider: providerId, 
      is_dynamic: isDynamic, 
      models,
      note: note || undefined
    });
  } catch (error) {
    const fallback = FALLBACK_MODELS[providerId] || provider.models || [];
    return res.json({
      provider: providerId,
      is_dynamic: false,
      models: fallback,
      note: `Using fallback list: ${error.message}`
    });
  }
});

// POST /providers - Add a new provider
app.post("/providers", async (req, res) => {
  try {
    const { id, name, config, supports_dynamic_models, models } = req.body;
    
    if (!id || !name || !config) {
      return res.status(400).json({ 
        error: "Missing required fields: id, name, config" 
      });
    }
    
    // Validate provider ID format with length and position restrictions
    // Must start with letter, be 2-32 chars, and end with letter/number
    if (id.length < 2 || id.length > 32 || !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(id)) {
      return res.status(400).json({ 
        error: "Provider ID must start with a letter, end with a letter or number, contain only lowercase letters, numbers, and dashes, and be between 2-32 characters" 
      });
    }
    
    // Validate URL if provided
    if (config.base_url) {
      try {
        const url = new URL(config.base_url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return res.status(400).json({
            error: "Base URL must use HTTP or HTTPS protocol"
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: "Invalid base URL format"
        });
      }
    }
    
    const provider = {
      id,
      name,
      config,
      supports_dynamic_models: Boolean(supports_dynamic_models),
      models: models || []
    };
    
    const newProvider = await providersStorage.addProvider(provider);
    res.status(201).json({ provider: newProvider });
  } catch (error) {
    if (error.message === "Provider ID already exists") {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to add provider" });
    }
  }
});

// PUT /providers/:id - Update a provider
app.put("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedProvider = await providersStorage.updateProvider(id, updates);
    res.json({ provider: updatedProvider });
  } catch (error) {
    if (error.message === "Provider not found or is built-in") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update provider" });
    }
  }
});

// DELETE /providers/:id - Delete a provider
app.delete("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await providersStorage.deleteProvider(id);
    res.status(204).send();
  } catch (error) {
    if (error.message === "Provider not found or is built-in") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete provider" });
    }
  }
});

// POST /providers/:id/test - Test provider connection
app.post("/providers/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await providersStorage.getProvider(id);
    
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    
    const availability = await providerAvailability(provider);
    res.json({ 
      success: availability.available,
      message: availability.available ? "Provider is configured correctly" : availability.reason
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to test provider" });
  }
});

// GET /providers/:id/available-models - Get all available models for a provider
app.get("/providers/:id/available-models", async (req, res) => {
  try {
    const providerId = req.params.id;
    const provider = await providersStorage.getProvider(providerId);
    
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    
    let models = [];
    
    // Handle CLI providers (copilot and claude)
    if (providerId === "copilot") {
      models = await fetchCopilotModels();
    } else if (providerId === "claude") {
      models = await fetchClaudeModels();
    } else if (provider.supports_dynamic_models) {
      // Try to fetch dynamic models for API-based providers
      try {
        if (providerId === "openai") {
          const apiKey = provider.config?.api_key || process.env.OPENAI_API_KEY;
          if (apiKey) {
            models = await fetchOpenAIModels(apiKey);
          }
        } else if (providerId === "gemini") {
          const apiKey = provider.config?.api_key || process.env.GEMINI_API_KEY;
          if (apiKey) {
            models = await fetchGeminiModels(apiKey);
          }
        } else if (provider.config?.type === "openai_compatible") {
          // For OpenAI-compatible APIs, try to fetch models with security controls
          const apiKey = provider.config?.api_key || 
                        (provider.config?.env_var ? process.env[provider.config.env_var] : null);
          const baseUrl = provider.config?.base_url;
          
          if (apiKey && baseUrl) {
            // Validate URL before making request
            try {
              const url = new URL(baseUrl);
              if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Invalid protocol');
              }
            } catch (error) {
              console.error(`Invalid base URL for provider ${providerId}:`, error);
              models = [];
            }
            
            if (models.length === 0) {
              // Create abort controller for timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
              
              try {
                const response = await fetch(`${baseUrl}/models`, {
                  headers: { Authorization: `Bearer ${apiKey}` },
                  signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                  // Limit response size
                  const contentLength = response.headers.get('content-length');
                  if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
                    throw new Error('Response too large');
                  }
                  
                  const data = await response.json();
                  models = Array.isArray(data.data) 
                    ? data.data.map(m => ({ id: m.id, label: m.id })).slice(0, 1000) // Limit to 1000 models
                    : [];
                }
              } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                  console.error(`Request timeout for provider ${providerId}`);
                } else {
                  console.error(`Failed to fetch models for ${providerId}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch models for ${providerId}:`, error);
      }
    }
    
    // Fall back to configured models
    if (models.length === 0 && provider.models) {
      models = provider.models;
    }
    
    res.json({ 
      provider: providerId,
      models,
      is_dynamic: provider.supports_dynamic_models && models.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available models" });
  }
});

// GET /providers/:id/filtered-models - Get filtered models for a provider
app.get("/providers/:id/filtered-models", async (req, res) => {
  try {
    const providerId = req.params.id;
    const filteredModels = await providersStorage.getFilteredModels(providerId);
    
    res.json({ 
      provider: providerId,
      filtered_models: filteredModels
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get filtered models" });
  }
});

// PUT /providers/:id/filtered-models - Set filtered models for a provider
app.put("/providers/:id/filtered-models", async (req, res) => {
  try {
    const providerId = req.params.id;
    const { model_ids } = req.body;
    
    if (!Array.isArray(model_ids)) {
      return res.status(400).json({ error: "model_ids must be an array" });
    }
    
    await providersStorage.setFilteredModels(providerId, model_ids);
    
    res.json({ 
      provider: providerId,
      filtered_models: model_ids
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to set filtered models" });
  }
});

// POST /providers/rescan - Rescan all providers to refresh model lists
app.post("/providers/rescan", async (req, res) => {
  try {
    // Clear all model caches
    await providersStorage.clearModelCache();
    
    const allProviders = await providersStorage.getAllProviders();
    const results = {};
    
    // Fetch fresh models for each available provider
    for (const provider of allProviders) {
      const availability = await providerAvailability(provider);
      if (!availability.available) {
        results[provider.id] = { success: false, reason: availability.reason };
        continue;
      }
      
      try {
        let models = [];
        
        if (provider.id === "openai") {
          const apiKey = provider.config?.api_key || process.env.OPENAI_API_KEY;
          if (apiKey) {
            models = await fetchOpenAIModels(apiKey);
          }
        } else if (provider.id === "gemini") {
          const apiKey = provider.config?.api_key || process.env.GEMINI_API_KEY;
          if (apiKey) {
            models = await fetchGeminiModels(apiKey);
          }
        } else if (provider.id === "claude") {
          models = await fetchClaudeModels();
        } else if (provider.id === "copilot") {
          models = await fetchCopilotModels();
        }
        
        if (models.length > 0) {
          await providersStorage.setCachedModels(provider.id, models);
          results[provider.id] = { success: true, count: models.length };
        } else {
          results[provider.id] = { success: false, reason: "No models found" };
        }
      } catch (error) {
        results[provider.id] = { success: false, reason: error.message };
      }
    }
    
    res.json({ 
      message: "Rescan completed",
      results
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to rescan providers" });
  }
});

// ============================================================================
// PROMPT TYPES ENDPOINTS
// ============================================================================

/**
 * GET /prompt-types
 * Get all prompt types (built-in + custom)
 */
app.get("/prompt-types", async (req, res) => {
  try {
    const types = await promptTypesStorage.getAllPromptTypes();
    res.json({ promptTypes: types });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prompt types" });
  }
});

/**
 * GET /prompt-types/:id
 * Get a single prompt type by ID
 */
app.get("/prompt-types/:id", async (req, res) => {
  try {
    const type = await promptTypesStorage.getPromptType(req.params.id);
    if (!type) {
      return res.status(404).json({ error: "Prompt type not found" });
    }
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prompt type" });
  }
});

/**
 * POST /prompt-types
 * Add a new custom prompt type
 */
app.post("/prompt-types", async (req, res) => {
  try {
    const { id, name, description, icon, systemPrompt } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: "ID and name are required" });
    }
    
    const newType = await promptTypesStorage.addPromptType({
      id,
      name,
      description: description || '',
      icon: icon || '📝',
      systemPrompt: systemPrompt || ''
    });
    
    res.json(newType);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to add prompt type" });
  }
});

/**
 * PUT /prompt-types/:id
 * Update an existing prompt type
 */
app.put("/prompt-types/:id", async (req, res) => {
  try {
    const { name, description, icon, systemPrompt } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    
    const updated = await promptTypesStorage.updatePromptType(req.params.id, updates);
    res.json(updated);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Cannot update')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to update prompt type" });
  }
});

/**
 * DELETE /prompt-types/:id
 * Delete a custom prompt type
 */
app.delete("/prompt-types/:id", async (req, res) => {
  try {
    await promptTypesStorage.deletePromptType(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Cannot delete')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to delete prompt type" });
  }
});

/**
 * POST /prompt-types/:id/reset
 * Reset a built-in prompt type to its default system prompt
 */
app.post("/prompt-types/:id/reset", async (req, res) => {
  try {
    const reset = await promptTypesStorage.resetPromptType(req.params.id);
    res.json(reset);
  } catch (error) {
    if (error.message.includes('not a built-in')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to reset prompt type" });
  }
});

app.post("/improve", async (req, res) => {
  const {
    provider,
    model,
    rough_prompt: roughPrompt,
    constraints,
    learning_mode: learningMode,
    prompt_type: promptType,
    clarifications
  } = req.body || {};

  if (!provider || !model || !roughPrompt) {
    return res
      .status(400)
      .json({ error: "provider, model, and rough_prompt are required." });
  }

  const providerId = String(provider).toLowerCase();

  // Get prompt type system prompt if specified
  let promptTypeSystemPrompt = '';
  if (promptType && promptType !== 'none') {
    try {
      const type = await promptTypesStorage.getPromptType(promptType);
      if (type && type.systemPrompt) {
        promptTypeSystemPrompt = `\n\nPrompt Type Guidance (${type.name}):\n${type.systemPrompt}`;
      }
    } catch (error) {
      console.error('Failed to load prompt type:', error);
    }
  }

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
      raw = await callOpenAI({ apiKey, model, userContent, promptTypeSystemPrompt });
    } else if (providerId === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY not set." });
      }
      raw = await callGemini({ apiKey, model, userContent, promptTypeSystemPrompt });
    } else if (providerId === "claude") {
      raw = await callClaudeCli({ model, userContent, promptTypeSystemPrompt });
      return res.json(raw);
    } else if (providerId === "copilot") {
      raw = await callCopilotCli({ model, userContent, promptTypeSystemPrompt });
    } else {
      return res.status(400).json({ error: "Unknown provider." });
    }

    const parsed = safeJsonParse(raw);
    if (!parsed.ok) {
      console.error('Model returned invalid JSON:', {
        provider: providerId,
        model,
        rawResponse: raw.substring(0, 500) // Log first 500 chars
      });
      return res.status(502).json({
        error: "Model returned invalid JSON.",
        raw: raw.substring(0, 1000) // Send first 1000 chars to client
      });
    }

    return res.json(parsed.value);
  } catch (error) {
    console.error('Improve endpoint error:', {
      provider: providerId,
      model,
      error: error.message,
      stack: error.stack
    });
    return res.status(502).json({ 
      error: error.message,
      details: error.stack ? error.stack.split('\n')[0] : undefined
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Prompt Assistant running on http://${HOST}:${PORT}`);
});
