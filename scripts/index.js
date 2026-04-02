#!/usr/bin/env node

/**
 * Grok WebSearch Skill
 * Uses xAI's Grok model with web search capabilities
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

function parseCliArgs(argv) {
  const args = [...argv];
  let allowedDomainsRaw = '';
  let excludedDomainsRaw = '';
  let enableImageUnderstanding = true;
  const queryParts = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

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

    queryParts.push(arg);
  }

  return {
    query: queryParts.join(' ').trim(),
    allowedDomains: parseDomainList(allowedDomainsRaw),
    excludedDomains: parseDomainList(excludedDomainsRaw),
    enableImageUnderstanding,
  };
}

async function performWebSearch(query, options = {}) {
  // Validate API key
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set');
  }

  // Get model from environment variable, default to grok-4-1-fast
  const modelName = process.env.XAI_MODEL || 'grok-4-1-fast-reasoning';

  const { allowedDomains = [], excludedDomains = [], enableImageUnderstanding = true } = options;

  console.log(`🔍 Searching with ${modelName}: ${query}\n`);
  if (allowedDomains.length > 0) {
    console.log(`✅ Allowed domains: ${allowedDomains.join(', ')}`);
  }
  if (excludedDomains.length > 0) {
    console.log(`🚫 Excluded domains: ${excludedDomains.join(', ')}`);
  }
  if (allowedDomains.length > 0 || excludedDomains.length > 0) {
    console.log('');
  }

  try {
    // Perform web search using xAI Grok with web_search tool
    // Note: web_search tool requires using xai.responses() API
    const { text, sources } = await generateText({
      model: xai.responses(modelName),
      prompt: query,
      tools: {
        web_search: xai.tools.webSearch({
          allowedDomains,
          excludedDomains,
          enableImageUnderstanding,
        }),
      },
    });

    // Display results
    console.log(text);

    // Return structured result
    return {
      answer: text,
      sources: sources || [],
    };
  } catch (error) {
    console.error('❌ Error performing web search:', error.message);
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

  const { query, allowedDomains, excludedDomains, enableImageUnderstanding } = parsedArgs;

  if (allowedDomains.length > 0 && excludedDomains.length > 0) {
    console.error('❌ --allowed_domains and --excluded_domains cannot be used together.');
    process.exit(1);
  }

  if (!query) {
    console.error('Usage: node scripts/index.js "<your query>" [--allowed_domains=domain1,domain2] [--excluded_domains=domain3,domain4] [--enable_image_understanding=true|false]');
    console.error('Example: node scripts/index.js "What are the latest AI developments?" --allowed_domains=techcrunch.com,theverge.com');
    process.exit(1);
  }

  try {
    await performWebSearch(query, { allowedDomains, excludedDomains, enableImageUnderstanding });
  } catch (error) {
    process.exit(1);
  }
})();
