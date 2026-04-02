#!/usr/bin/env node

/**
 * Grok Search Skill
 * Uses xAI's Grok model with web and X search capabilities
 */

import path from 'path';
import dotenv from 'dotenv';
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function parseDomainList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseHandleList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map(item => item.trim().replace(/^@/, ''))
    .filter(Boolean);
}

function parseBooleanValue(value, flagName) {
  if (typeof value !== 'string') {
    throw new Error(`Invalid value for ${flagName}`);
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }

  throw new Error(`Invalid value for ${flagName}: "${value}". Use true or false.`);
}

function parseToolMode(value) {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'web' || normalized === 'x' || normalized === 'both') {
    return normalized;
  }

  throw new Error(`Invalid value for --tool: "${value}". Use web, x, or both.`);
}

function parseDateValue(value, flagName) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return '';
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const asDate = new Date(trimmed);

  if (!isDateOnly || Number.isNaN(asDate.getTime())) {
    throw new Error(`Invalid value for ${flagName}: "${value}". Use YYYY-MM-DD.`);
  }

  return trimmed;
}

function parseCliArgs(argv) {
  const args = [...argv];
  let tool = 'web';
  let allowedDomainsRaw = '';
  let excludedDomainsRaw = '';
  let allowedXHandlesRaw = '';
  let excludedXHandlesRaw = '';
  let fromDateRaw = '';
  let toDateRaw = '';
  let enableImageUnderstanding = true;
  let enableVideoUnderstanding = false;
  const queryParts = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--tool=')) {
      tool = parseToolMode(arg.slice('--tool='.length));
      continue;
    }

    if (arg === '--tool' && i + 1 < args.length) {
      tool = parseToolMode(args[i + 1]);
      i++;
      continue;
    }

    if (arg.startsWith('--allowed_domains=')) {
      allowedDomainsRaw = arg.slice('--allowed_domains='.length);
      continue;
    }

    if (arg === '--allowed_domains' && i + 1 < args.length) {
      allowedDomainsRaw = args[i + 1] || '';
      i++;
      continue;
    }

    if (arg.startsWith('--excluded_domains=')) {
      excludedDomainsRaw = arg.slice('--excluded_domains='.length);
      continue;
    }

    if (arg === '--excluded_domains' && i + 1 < args.length) {
      excludedDomainsRaw = args[i + 1] || '';
      i++;
      continue;
    }

    if (arg.startsWith('--allowed_x_handles=')) {
      allowedXHandlesRaw = arg.slice('--allowed_x_handles='.length);
      continue;
    }

    if (arg === '--allowed_x_handles' && i + 1 < args.length) {
      allowedXHandlesRaw = args[i + 1] || '';
      i++;
      continue;
    }

    if (arg.startsWith('--excluded_x_handles=')) {
      excludedXHandlesRaw = arg.slice('--excluded_x_handles='.length);
      continue;
    }

    if (arg === '--excluded_x_handles' && i + 1 < args.length) {
      excludedXHandlesRaw = args[i + 1] || '';
      i++;
      continue;
    }

    if (arg.startsWith('--from_date=')) {
      fromDateRaw = parseDateValue(arg.slice('--from_date='.length), '--from_date');
      continue;
    }

    if (arg === '--from_date' && i + 1 < args.length) {
      fromDateRaw = parseDateValue(args[i + 1] || '', '--from_date');
      i++;
      continue;
    }

    if (arg.startsWith('--to_date=')) {
      toDateRaw = parseDateValue(arg.slice('--to_date='.length), '--to_date');
      continue;
    }

    if (arg === '--to_date' && i + 1 < args.length) {
      toDateRaw = parseDateValue(args[i + 1] || '', '--to_date');
      i++;
      continue;
    }

    if (arg.startsWith('--enable_image_understanding=')) {
      enableImageUnderstanding = parseBooleanValue(
        arg.slice('--enable_image_understanding='.length),
        '--enable_image_understanding',
      );
      continue;
    }

    if (arg === '--enable_image_understanding') {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        enableImageUnderstanding = parseBooleanValue(nextArg, '--enable_image_understanding');
        i++;
      } else {
        enableImageUnderstanding = true;
      }
      continue;
    }

    if (arg.startsWith('--enable_video_understanding=')) {
      enableVideoUnderstanding = parseBooleanValue(
        arg.slice('--enable_video_understanding='.length),
        '--enable_video_understanding',
      );
      continue;
    }

    if (arg === '--enable_video_understanding') {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        enableVideoUnderstanding = parseBooleanValue(nextArg, '--enable_video_understanding');
        i++;
      } else {
        enableVideoUnderstanding = true;
      }
      continue;
    }

    queryParts.push(arg);
  }

  return {
    query: queryParts.join(' ').trim(),
    tool,
    allowedDomains: parseDomainList(allowedDomainsRaw),
    excludedDomains: parseDomainList(excludedDomainsRaw),
    allowedXHandles: parseHandleList(allowedXHandlesRaw),
    excludedXHandles: parseHandleList(excludedXHandlesRaw),
    fromDate: fromDateRaw,
    toDate: toDateRaw,
    enableImageUnderstanding,
    enableVideoUnderstanding,
  };
}

function validateCliArgs(options) {
  const {
    tool,
    allowedDomains,
    excludedDomains,
    allowedXHandles,
    excludedXHandles,
    fromDate,
    toDate,
  } = options;

  if (allowedDomains.length > 0 && excludedDomains.length > 0) {
    throw new Error('--allowed_domains and --excluded_domains cannot be used together.');
  }

  if (allowedDomains.length > 5) {
    throw new Error('--allowed_domains supports at most 5 domains.');
  }

  if (excludedDomains.length > 5) {
    throw new Error('--excluded_domains supports at most 5 domains.');
  }

  if (allowedXHandles.length > 0 && excludedXHandles.length > 0) {
    throw new Error('--allowed_x_handles and --excluded_x_handles cannot be used together.');
  }

  if (allowedXHandles.length > 10) {
    throw new Error('--allowed_x_handles supports at most 10 handles.');
  }

  if (excludedXHandles.length > 10) {
    throw new Error('--excluded_x_handles supports at most 10 handles.');
  }

  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    throw new Error('--from_date cannot be later than --to_date.');
  }

  if (tool === 'web') {
    if (allowedXHandles.length > 0 || excludedXHandles.length > 0 || fromDate || toDate) {
      throw new Error('X search filters require --tool=x or --tool=both.');
    }
  }

  if (tool === 'x') {
    if (allowedDomains.length > 0 || excludedDomains.length > 0) {
      throw new Error('Web domain filters require --tool=web or --tool=both.');
    }
  }
}

async function performSearch(query, options = {}) {
  // Validate API key
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set');
  }

  // Get model from environment variable, default to grok-4-1-fast-reasoning
  const modelName = process.env.XAI_MODEL || 'grok-4-1-fast-reasoning';

  const {
    tool = 'web',
    allowedDomains = [],
    excludedDomains = [],
    allowedXHandles = [],
    excludedXHandles = [],
    fromDate = '',
    toDate = '',
    enableImageUnderstanding = true,
    enableVideoUnderstanding = false,
  } = options;

  console.log(`🔍 Searching with ${modelName} (${tool}): ${query}\n`);
  if (tool !== 'x' && allowedDomains.length > 0) {
    console.log(`✅ Allowed domains: ${allowedDomains.join(', ')}`);
  }
  if (tool !== 'x' && excludedDomains.length > 0) {
    console.log(`🚫 Excluded domains: ${excludedDomains.join(', ')}`);
  }
  if (tool !== 'web' && allowedXHandles.length > 0) {
    console.log(`✅ Allowed X handles: ${allowedXHandles.map(handle => `@${handle}`).join(', ')}`);
  }
  if (tool !== 'web' && excludedXHandles.length > 0) {
    console.log(`🚫 Excluded X handles: ${excludedXHandles.map(handle => `@${handle}`).join(', ')}`);
  }
  if (tool !== 'web' && fromDate) {
    console.log(`📅 From date: ${fromDate}`);
  }
  if (tool !== 'web' && toDate) {
    console.log(`📅 To date: ${toDate}`);
  }
  if (
    allowedDomains.length > 0 ||
    excludedDomains.length > 0 ||
    allowedXHandles.length > 0 ||
    excludedXHandles.length > 0 ||
    fromDate ||
    toDate ||
    enableVideoUnderstanding
  ) {
    console.log('');
  }

  try {
    const tools = {};

    if (tool === 'web' || tool === 'both') {
      tools.web_search = xai.tools.webSearch({
        ...(allowedDomains.length > 0 ? { allowedDomains } : {}),
        ...(excludedDomains.length > 0 ? { excludedDomains } : {}),
        enableImageUnderstanding,
      });
    }

    if (tool === 'x' || tool === 'both') {
      tools.x_search = xai.tools.xSearch({
        ...(allowedXHandles.length > 0 ? { allowedXHandles } : {}),
        ...(excludedXHandles.length > 0 ? { excludedXHandles } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
        enableImageUnderstanding,
        enableVideoUnderstanding,
      });
    }

    const { text, sources } = await generateText({
      model: xai.responses(modelName),
      prompt: query,
      tools,
    });

    // Display results
    console.log(text);

    // Return structured result
    return {
      answer: text,
      sources: sources || [],
    };
  } catch (error) {
    console.error('❌ Error performing search:', error.message);
    throw error;
  }
}

// Main execution
(async () => {
  let parsedArgs;

  try {
    parsedArgs = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  try {
    validateCliArgs(parsedArgs);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  const {
    query,
    tool,
    allowedDomains,
    excludedDomains,
    allowedXHandles,
    excludedXHandles,
    fromDate,
    toDate,
    enableImageUnderstanding,
    enableVideoUnderstanding,
  } = parsedArgs;

  if (!query) {
    console.error('Usage: node scripts/index.js "<your query>" [--tool=web|x|both] [--allowed_domains=domain1,domain2] [--excluded_domains=domain3,domain4] [--allowed_x_handles=handle1,handle2] [--excluded_x_handles=handle3,handle4] [--from_date=YYYY-MM-DD] [--to_date=YYYY-MM-DD] [--enable_image_understanding=true|false] [--enable_video_understanding=true|false]');
    console.error('Example (web): node scripts/index.js "What are the latest AI developments?" --tool=web --allowed_domains=techcrunch.com,theverge.com');
    console.error('Example (x): node scripts/index.js "What are people saying about xAI on X?" --tool=x --allowed_x_handles=xai,elonmusk --from_date=2026-03-01');
    process.exit(1);
  }

  try {
    await performSearch(query, {
      tool,
      allowedDomains,
      excludedDomains,
      allowedXHandles,
      excludedXHandles,
      fromDate,
      toDate,
      enableImageUnderstanding,
      enableVideoUnderstanding,
    });
  } catch (error) {
    process.exit(1);
  }
})();
