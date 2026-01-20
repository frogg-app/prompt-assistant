#!/usr/bin/env node
/**
 * Fetch Claude Models Script
 * 
 * Fetches available Claude model information from Anthropic's documentation/API.
 * This script can be run manually or as part of a scheduled task to update
 * the cached model list for Claude.
 * 
 * Usage:
 *   node fetch-claude-models.js [--output <file>] [--format json|text]
 * 
 * Note: Claude CLI doesn't provide a reliable way to list models, so we:
 * 1. Try parsing the Claude CLI help output
 * 2. Fall back to well-known model aliases
 * 3. Optionally fetch from Anthropic's public model documentation
 */

const https = require('https');
const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

// Well-known Claude model aliases (fallback)
const KNOWN_MODELS = [
  { id: 'sonnet', label: 'Sonnet (Latest)', description: 'Fast and intelligent' },
  { id: 'opus', label: 'Opus (Latest)', description: 'Most capable model' },
  { id: 'haiku', label: 'Haiku (Latest)', description: 'Fastest, most compact' },
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (May 2025)', description: 'Sonnet 4 release' },
  { id: 'claude-opus-4-20250514', label: 'Claude Opus 4 (May 2025)', description: 'Opus 4 release' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Oct 2024)', description: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Oct 2024)', description: 'Claude 3.5 Haiku' },
  { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Feb 2024)', description: 'Claude 3 Opus' },
];

// Anthropic model documentation URL patterns
const ANTHROPIC_DOCS_URLS = [
  'https://docs.anthropic.com/en/docs/about-claude/models',
  'https://www.anthropic.com/api'
];

/**
 * Run a command and capture output
 */
function runCommand(command, args, options = {}) {
  const { timeoutMs = 10000 } = options;
  
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Command exited with code ${code}: ${stderr || stdout}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Try to parse models from Claude CLI help
 */
async function fetchFromClaudeCli() {
  try {
    const { stdout } = await runCommand('claude', ['--help']);
    const models = [];
    const seen = new Set();

    // Look for model aliases
    const aliasPatterns = [
      /['"]?(sonnet|opus|haiku)['"]?/gi,
      /claude-([a-z]+)-(\d+(?:-\d+)*(?:-\d{8})?)/gi
    ];

    for (const pattern of aliasPatterns) {
      const matches = stdout.matchAll(pattern);
      for (const match of matches) {
        let id, label;
        
        if (match[2]) {
          // Full model name like claude-sonnet-4-20250514
          id = match[0];
          const modelType = match[1];
          const version = match[2].replace(/-/g, '.');
          label = `Claude ${modelType.charAt(0).toUpperCase() + modelType.slice(1)} ${version}`;
        } else {
          // Alias like sonnet, opus, haiku
          id = match[1].toLowerCase();
          label = id.charAt(0).toUpperCase() + id.slice(1);
        }

        if (!seen.has(id)) {
          seen.add(id);
          models.push({ id, label });
        }
      }
    }

    return models.length > 0 ? models : null;
  } catch (error) {
    console.error('Failed to fetch from Claude CLI:', error.message);
    return null;
  }
}

/**
 * Fetch and parse model information from a URL
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PromptAssistant/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchUrl(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve(data));
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Parse model names from HTML documentation
 */
function parseModelsFromHtml(html) {
  const models = [];
  const seen = new Set();

  // Pattern to match Claude model names in various formats
  const patterns = [
    /claude-(\d+(?:\.\d+)?)-?(sonnet|opus|haiku)(?:-(\d{8}))?/gi,
    /claude-(sonnet|opus|haiku)-(\d+)(?:-(\d{8}))?/gi,
    /"(claude-[a-z0-9-]+)"/gi
  ];

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const id = match[0].replace(/"/g, '').toLowerCase();
      
      if (!seen.has(id) && id.includes('claude')) {
        seen.add(id);
        
        // Generate human-readable label
        let label = id
          .replace(/^claude-/, 'Claude ')
          .replace(/-(\d{8})$/, ' ($1)')
          .replace(/-/g, ' ')
          .replace(/(\d+)\.(\d+)/g, '$1.$2')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        models.push({ id, label });
      }
    }
  }

  return models;
}

/**
 * Try to fetch models from Anthropic documentation
 */
async function fetchFromDocs() {
  for (const url of ANTHROPIC_DOCS_URLS) {
    try {
      console.log(`Fetching from ${url}...`);
      const html = await fetchUrl(url);
      const models = parseModelsFromHtml(html);
      
      if (models.length > 0) {
        console.log(`Found ${models.length} models from documentation`);
        return models;
      }
    } catch (error) {
      console.error(`Failed to fetch from ${url}:`, error.message);
    }
  }
  return null;
}

/**
 * Main function to fetch Claude models
 */
async function fetchClaudeModels() {
  console.log('Fetching Claude models...\n');

  // Strategy 1: Try Claude CLI
  console.log('1. Trying Claude CLI...');
  let models = await fetchFromClaudeCli();
  
  if (models && models.length > 0) {
    console.log(`   Found ${models.length} models from CLI\n`);
  } else {
    console.log('   No models found from CLI\n');
    
    // Strategy 2: Try documentation
    console.log('2. Trying Anthropic documentation...');
    models = await fetchFromDocs();
    
    if (models && models.length > 0) {
      console.log(`   Found ${models.length} models from docs\n`);
    } else {
      console.log('   No models found from docs\n');
    }
  }

  // Strategy 3: Fall back to known models
  if (!models || models.length === 0) {
    console.log('3. Using known model list as fallback\n');
    models = KNOWN_MODELS;
  }

  // Merge with known models to ensure we have the aliases
  const knownIds = new Set(KNOWN_MODELS.map(m => m.id));
  const finalModels = [...KNOWN_MODELS];
  
  for (const model of models) {
    if (!knownIds.has(model.id)) {
      finalModels.push(model);
    }
  }

  return finalModels;
}

/**
 * Output results
 */
async function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const formatIndex = args.indexOf('--format');
  
  const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : null;
  const format = formatIndex !== -1 ? args[formatIndex + 1] : 'json';

  try {
    const models = await fetchClaudeModels();
    
    console.log('Available Claude Models:');
    console.log('========================\n');

    if (format === 'text') {
      for (const model of models) {
        console.log(`  ${model.id}`);
        console.log(`    Label: ${model.label}`);
        if (model.description) {
          console.log(`    Description: ${model.description}`);
        }
        console.log();
      }
    } else {
      console.log(JSON.stringify(models, null, 2));
    }

    // Save to file if requested
    if (outputFile) {
      const outputPath = path.resolve(outputFile);
      const content = format === 'text' 
        ? models.map(m => `${m.id}: ${m.label}`).join('\n')
        : JSON.stringify(models, null, 2);
      
      await fs.writeFile(outputPath, content, 'utf-8');
      console.log(`\nSaved to: ${outputPath}`);
    }

    // Summary
    console.log(`\nTotal: ${models.length} models`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { fetchClaudeModels, KNOWN_MODELS };

// Run if called directly
if (require.main === module) {
  main();
}
