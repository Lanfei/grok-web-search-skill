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

async function performWebSearch(query) {
  // Validate API key
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set');
  }

  // Get model from environment variable, default to grok-4-1-fast
  const modelName = process.env.XAI_MODEL || 'grok-4-1-fast-reasoning';

  console.log(`🔍 Searching with ${modelName}: ${query}\n`);

  try {
    // Perform web search using xAI Grok with web_search tool
    // Note: web_search tool requires using xai.responses() API
    const { text, sources } = await generateText({
      model: xai.responses(modelName),
      prompt: query,
      tools: {
        web_search: xai.tools.webSearch({
          enableImageUnderstanding: true,
        }),
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
  const query = process.argv.slice(2).join(' ');

  if (!query) {
    console.error('Usage: node search.js "<your query>"');
    console.error('Example: node search.js "What are the latest AI developments?"');
    process.exit(1);
  }

  try {
    await performWebSearch(query);
  } catch (error) {
    process.exit(1);
  }
})();
