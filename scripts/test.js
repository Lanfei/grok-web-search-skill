#!/usr/bin/env node

/**
 * Grok Search Skill - Test Suite
 *
 * Usage:
 *   npm test                    - Run all predefined tests
 *   npm test "custom query"     - Test a single custom query
 *   npm test -- --tool=x "query" - Test single query with tool mode
 *   node test.js                - Run all predefined tests
 *   node test.js "custom query" - Test a single custom query
 */

import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const modelName = process.env.XAI_MODEL || 'grok-4-1-fast-reasoning';

function parseTestCliArgs(argv) {
  const args = [...argv];
  let tool = 'web';
  const queryParts = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--tool=')) {
      tool = arg.slice('--tool='.length);
      continue;
    }

    if (arg === '--tool' && i + 1 < args.length) {
      tool = args[i + 1] || 'web';
      i++;
      continue;
    }

    queryParts.push(arg);
  }

  return {
    tool,
    query: queryParts.join(' ').trim(),
  };
}

function normalizeToolMode(tool) {
  const normalized = (tool || 'web').trim().toLowerCase();
  if (normalized === 'web' || normalized === 'x' || normalized === 'both') {
    return normalized;
  }

  throw new Error(`Invalid --tool value: "${tool}". Use web, x, or both.`);
}

const parsedCliArgs = parseTestCliArgs(process.argv.slice(2));
const customTool = normalizeToolMode(parsedCliArgs.tool);
const customQuery = parsedCliArgs.query;

function buildTools({
  tool = 'web',
  enableImageUnderstanding = true,
  enableVideoUnderstanding = false,
  webOptions = {},
  xOptions = {},
} = {}) {
  const tools = {};

  if (tool === 'web' || tool === 'both') {
    tools.web_search = xai.tools.webSearch({
      ...webOptions,
      enableImageUnderstanding,
    });
  }

  if (tool === 'x' || tool === 'both') {
    tools.x_search = xai.tools.xSearch({
      ...xOptions,
      enableImageUnderstanding,
      enableVideoUnderstanding,
    });
  }

  return tools;
}

// Test cases
const testCases = [
  {
    name: '英文时事查询',
    query: 'What happened in tech news today?',
    tool: 'web',
    expectedSources: true,
  },
  {
    name: '中文时事查询',
    query: '今天有什么重要新闻？',
    tool: 'web',
    expectedSources: true,
  },
  {
    name: '技术话题查询',
    query: 'What are the latest developments in AI?',
    tool: 'web',
    expectedSources: true,
  },
  {
    name: '特定公司查询',
    query: 'What is SpaceX doing recently?',
    tool: 'web',
    expectedSources: true,
  },
  {
    name: 'X 平台舆情查询',
    query: 'What are people saying about xAI on X?',
    tool: 'x',
    expectedSources: true,
  },
  {
    name: '双工具自动选择',
    query: 'Latest updates about xAI and AI industry this week',
    tool: 'both',
    expectedSources: true,
  },
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: testCases.length,
  details: [],
};

console.log('🧪 Grok Search Skill - Test Suite\n');
console.log(`Model: ${modelName}`);
console.log(`Total Tests: ${testCases.length}\n`);
console.log('='.repeat(60));

async function runTest(testCase, index) {
  const {
    name,
    query,
    tool = 'web',
    expectedSources,
    enableImageUnderstanding = true,
    enableVideoUnderstanding = false,
    webOptions = {},
    xOptions = {},
  } = testCase;

  console.log(`\n📋 Test ${index + 1}/${testCases.length}: ${name}`);
  console.log(`Tool: ${tool}`);
  console.log(`Query: "${query}"`);

  const startTime = Date.now();

  try {
    const { text, sources } = await generateText({
      model: xai.responses(modelName),
      prompt: query,
      tools: buildTools({
        tool,
        enableImageUnderstanding,
        enableVideoUnderstanding,
        webOptions,
        xOptions,
      }),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const hasText = text && text.length > 0;
    const hasSources = sources && sources.length > 0;
    const sourcesCount = sources ? sources.length : 0;

    // Validate results
    let passed = true;
    const issues = [];

    if (!hasText) {
      passed = false;
      issues.push('No text returned');
    }

    if (expectedSources && !hasSources) {
      passed = false;
      issues.push('Expected sources but got none');
    }

    // Display results
    if (passed) {
      console.log(`✅ PASSED (${duration}s)`);
      console.log(`   - Text length: ${text.length} characters`);
      console.log(`   - Sources: ${sourcesCount}`);
      results.passed++;
    } else {
      console.log(`❌ FAILED (${duration}s)`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      results.failed++;
    }

    // Show sample sources
    if (hasSources && sourcesCount > 0) {
      console.log('   - Sample sources:');
      sources.slice(0, 3).forEach((source, i) => {
        if (source.sourceType === 'url') {
          console.log(`     ${i + 1}. ${source.url}`);
        }
      });
      if (sourcesCount > 3) {
        console.log(`     ... and ${sourcesCount - 3} more`);
      }
    }

    results.details.push({
      name,
      query,
      tool,
      passed,
      duration: parseFloat(duration),
      textLength: text.length,
      sourcesCount,
      issues,
    });

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ FAILED (${duration}s)`);
    console.log(`   - Error: ${error.message}`);

    results.failed++;
    results.details.push({
      name,
      query,
      tool,
      passed: false,
      duration: parseFloat(duration),
      error: error.message,
    });
  }
}

async function runSingleQuery(query, tool = 'web') {
  console.log('🚀 Single Query Test\n');
  console.log(`Model: ${modelName}`);
  console.log(`Tool: ${tool}`);
  console.log(`Query: "${query}"\n`);

  const startTime = Date.now();

  try {
    const { text, sources } = await generateText({
      model: xai.responses(modelName),
      prompt: query,
      tools: buildTools({ tool, enableImageUnderstanding: true }),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Success (${duration}s)\n`);
    console.log('📝 Answer:\n');
    console.log(text.substring(0, 500) + (text.length > 500 ? '...\n' : '\n'));

    if (sources && sources.length > 0) {
      console.log(`\n📚 Sources (${sources.length} total):\n`);
      sources.slice(0, 5).forEach((source, i) => {
        if (source.sourceType === 'url') {
          console.log(`${i + 1}. ${source.url}`);
        }
      });
      if (sources.length > 5) {
        console.log(`... and ${sources.length - 5} more`);
      }
    } else {
      console.log('\nℹ️  No sources returned');
    }

    console.log(`\n⏱️  Duration: ${duration}s`);
    console.log(`📏 Text length: ${text.length} characters`);
    console.log(`📚 Sources: ${sources ? sources.length : 0}`);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ Failed (${duration}s)`);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function runAllTests() {
  // Check API key
  if (!process.env.XAI_API_KEY) {
    console.error('❌ XAI_API_KEY environment variable is not set');
    console.error('Please set your API key: export XAI_API_KEY="your-key"');
    process.exit(1);
  }

  // If custom query provided, run single test
  if (customQuery) {
    await runSingleQuery(customQuery, customTool);
    return;
  }

  // Run all predefined tests sequentially
  for (let i = 0; i < testCases.length; i++) {
    await runTest(testCases[i], i);

    // Add delay between tests to avoid rate limiting
    if (i < testCases.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);

  // Calculate average metrics
  const successfulTests = results.details.filter(d => d.passed);
  if (successfulTests.length > 0) {
    const avgDuration = (successfulTests.reduce((sum, d) => sum + d.duration, 0) / successfulTests.length).toFixed(2);
    const avgSources = (successfulTests.reduce((sum, d) => sum + (d.sourcesCount || 0), 0) / successfulTests.length).toFixed(1);

    console.log(`\n📈 Performance Metrics (successful tests):`);
    console.log(`   - Average duration: ${avgDuration}s`);
    console.log(`   - Average sources: ${avgSources}`);
  }

  // Failed tests details
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.details.filter(d => !d.passed).forEach((detail, i) => {
      console.log(`\n${i + 1}. ${detail.name}`);
      console.log(`   Query: "${detail.query}"`);
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
      if (detail.issues) {
        detail.issues.forEach(issue => console.log(`   - ${issue}`));
      }
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed with error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
