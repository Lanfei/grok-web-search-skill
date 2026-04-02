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

function parseCliArgs(argv) {
  const args = [...argv];
  let allowedDomainsRaw = process.env.XAI_ALLOWED_DOMAINS || '';
  let excludedDomainsRaw = process.env.XAI_EXCLUDED_DOMAINS || '';
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

    queryParts.push(arg);
  }

  return {
    query: queryParts.join(' ').trim(),
    allowedDomains: parseDomainList(allowedDomainsRaw),
    excludedDomains: parseDomainList(excludedDomainsRaw),
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

  const { allowedDomains = [], excludedDomains = [] } = options;

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
    const webSearchOptions = {
      enableImageUnderstanding: true,
    };

    if (allowedDomains.length > 0) {
      webSearchOptions.allowedDomains = allowedDomains;
    }

    if (excludedDomains.length > 0) {
      webSearchOptions.excludedDomains = excludedDomains;
    }

    const { text, sources } = await generateText({
      model: xai.responses(modelName),
      prompt: query,
      tools: {
        web_search: xai.tools.webSearch(webSearchOptions),
      },
    });

    // Display results
    console.log('📝 Answer:\n');
    console.log(text);
    console.log('\n');

    // Display sources
    if (sources && sources.length > 0) {
      console.log('📚 Sources:\n');
      sources.forEach((source, index) => {
        if (source.sourceType === 'url') {
          console.log(`${index + 1}. ${source.url}`);
          if (source.title) {
            console.log(`   Title: ${source.title}`);
          }
        }
      });
    } else {
      console.log('ℹ️  No web sources were used for this query.');
    }

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
  const { query, allowedDomains, excludedDomains } = parseCliArgs(process.argv.slice(2));

  if (!query) {
    console.error('Usage: node scripts/index.js "<your query>" [--allowed_domains=domain1,domain2] [--excluded_domains=domain3,domain4]');
    console.error('Example: node scripts/index.js "What are the latest AI developments?" --allowed_domains=techcrunch.com,theverge.com');
    process.exit(1);
  }

  try {
    await performWebSearch(query, { allowedDomains, excludedDomains });
  } catch (error) {
    process.exit(1);
  }
})();
