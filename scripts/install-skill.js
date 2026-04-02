#!/usr/bin/env node

/**
 * Installation script for agent skills
 * Cross-platform installer using Node.js
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKILL_NAME = 'grok-search';
const PROJECT_DIR = path.resolve(__dirname, '..');

function isPathInside(parentPath, targetPath) {
  const relative = path.relative(parentPath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function parseSkillsDir(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--skills-dir') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --skills-dir');
      }
      return path.resolve(value);
    }

    if (arg.startsWith('--skills-dir=')) {
      const value = arg.slice('--skills-dir='.length);
      if (!value) {
        throw new Error('Missing value for --skills-dir');
      }
      return path.resolve(value);
    }
  }

  throw new Error('Missing required argument: --skills-dir');
}

let SKILLS_DIR;
let SKILL_INSTALL_DIR;

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  // Development environment
  'node_modules',
  '.git',
  '.idea',
  '.DS_Store',
  '.claude',
  '.env',
  // Configuration files
  '.gitignore',
  'package-lock.json',
  // Documentation (project-specific, not needed in installed skill)
  'README.md',
  // Test and installation scripts
  'scripts/test.js',
  'scripts/install-skill.js',
];

try {
  SKILLS_DIR = parseSkillsDir(process.argv.slice(2));
  SKILL_INSTALL_DIR = path.join(SKILLS_DIR, SKILL_NAME);

  if (isPathInside(PROJECT_DIR, SKILL_INSTALL_DIR)) {
    throw new Error(
      `Invalid --skills-dir: ${SKILLS_DIR}. Install path must not be inside the project directory.`,
    );
  }
} catch (error) {
  console.error(`❌ ${error.message}`);
  console.error('Usage: node scripts/install-skill.js --skills-dir <skills-directory>');
  process.exit(1);
}

console.log('🚀 Installing Grok Search Skill\n');

// Check if npm is available
try {
  execSync('npm --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: npm is not installed');
  console.error('Please install Node.js and npm first');
  process.exit(1);
}

// Check if XAI_API_KEY is set
if (!process.env.XAI_API_KEY) {
  console.log('⚠️  Warning: XAI_API_KEY environment variable is not set');
  console.log('You\'ll need to set it before using the Skill:');
  console.log('  export XAI_API_KEY="your-api-key"  # macOS/Linux');
  console.log('  $env:XAI_API_KEY="your-api-key"    # Windows PowerShell');
  console.log('');
}

/**
 * Check if a file/directory should be excluded
 */
function shouldExclude(relativePath) {
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.includes('*')) {
      // Simple glob matching
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(relativePath)) return true;
    } else {
      // Exact match or starts with (for directories)
      if (relativePath === pattern || relativePath.startsWith(pattern + path.sep)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Recursively copy directory with exclusions
 */
async function copyDir(src, dest, baseDir = src) {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relativePath = path.relative(baseDir, srcPath);

    if (shouldExclude(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, baseDir);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Remove all files in install dir except root .env
 */
async function cleanInstallDirPreserveEnv(installDir) {
  const entries = await fs.readdir(installDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.env') {
      continue;
    }

    const entryPath = path.join(installDir, entry.name);
    await fs.rm(entryPath, { recursive: true, force: true });
  }
}

/**
 * Main installation process
 */
async function install() {
  try {
    // Step 1: Create Skills directory
    console.log('📁 Step 1/3: Preparing installation directory...');
    await fs.mkdir(SKILLS_DIR, { recursive: true });
    console.log(`✅ Skills directory ready: ${SKILLS_DIR}\n`);

    // Step 2: Clean old version (preserve .env)
    try {
      await fs.access(SKILL_INSTALL_DIR);
      console.log('🧹 Step 2/3: Cleaning old version (preserving .env)...');
      await cleanInstallDirPreserveEnv(SKILL_INSTALL_DIR);
      console.log('✅ Old version cleaned\n');
    } catch (error) {
      console.log('⏭️  Step 2/3: No old version found, skipping...\n');
    }

    // Step 3: Copy files
    console.log('📦 Step 3/3: Copying Skill files...');
    await copyDir(PROJECT_DIR, SKILL_INSTALL_DIR, PROJECT_DIR);
    console.log('✅ Files copied\n');

    // Install production dependencies
    console.log('Installing production dependencies...');
    execSync('npm install --silent --production', {
      cwd: SKILL_INSTALL_DIR,
      stdio: 'inherit'
    });

    console.log('\n✅ Installation complete!\n');
    console.log('📍 Skill installed at:');
    console.log(`   ${SKILL_INSTALL_DIR}\n`);
    console.log('🔧 Next steps:\n');

    if (!process.env.XAI_API_KEY) {
      console.log('1. Set your xAI API key:');
      if (process.platform === 'win32') {
        console.log('   $env:XAI_API_KEY="your-api-key"  # PowerShell');
        console.log('   set XAI_API_KEY=your-api-key     # CMD');
      } else {
        console.log('   export XAI_API_KEY="your-api-key"');
        console.log('   # Add to ~/.bashrc or ~/.zshrc for persistence');
      }
      console.log('');
    }

    console.log('2. Verify installation:');
    console.log(`   cd ${SKILL_INSTALL_DIR}`);
    console.log('   npm run search "test query"\n');
    console.log('3. Restart your agent client to load the Skill\n');
    console.log('4. Use in conversations:');
    console.log('   \'Search for the latest AI news\'');
    console.log('   \'/grok-search "your query"\'\n');
    console.log('📖 For more information, see https://github.com/Lanfei/grok-search-skill');

  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    process.exit(1);
  }
}

// Run installation
install();
