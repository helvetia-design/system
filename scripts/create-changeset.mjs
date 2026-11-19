/**
 * Create changeset — interactive prompt to generate changeset entries
 *
 * Interactive:     node scripts/create-changeset.mjs
 * Non-interactive: node scripts/create-changeset.mjs --bump=minor --scope=core,slider --summary="..."
 */
import prompts from 'prompts'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(__dirname, '..')
const BUMP_LEVELS = ['patch', 'minor', 'major']

/**
 * All `@helvetia-design/*` packages are a fixed changeset group (see .changeset/config.json)
 * and release together under one version with one changelog. Every changeset's frontmatter
 * therefore always targets `@helvetia-design/core` — the scope choice only affects the bold
 * label on the changelog line, never which package gets bumped.
 */
const CHANGESET_PACKAGE = '@helvetia-design/core'

let cleanUp = () => Promise.resolve()

/**
 * Execute a command and return stdout
 */
function exec(cmd) {
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8' })
    return stdout
  } catch (err) {
    throw new Error(`Command failed: ${cmd}\n${err.message}`)
  }
}

/**
 * Parse `--key=value` / `--key value` CLI flags into an object
 */
export function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const eq = arg.indexOf('=')
    const key = eq === -1 ? arg.slice(2) : arg.slice(2, eq)
    const inlineValue = eq === -1 ? undefined : arg.slice(eq + 1)
    if (inlineValue !== undefined) {
      args[key] = inlineValue
    } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[key] = argv[++i]
    } else {
      args[key] = true
    }
  }
  return args
}

/**
 * Extract the generated changeset filename from `changeset add --empty` stdout.
 * Throws unless it is a plain `*.md` name, so the caller can never touch anything but that file.
 */
export function parseChangesetFilename(stdout) {
  const matches = [...String(stdout).matchAll(/\.changeset[\\/]([\w-]+\.md)/g)]
  const filename = matches.at(-1)?.[1]
  if (!filename) {
    throw new Error(`Could not read changeset filename from CLI output:\n${stdout}`)
  }
  return filename
}

/**
 * Write a changeset file for the given bump level, scope(s), and summary.
 * Shared by both the interactive prompt flow and non-interactive CLI usage.
 */
export async function writeChangeset({ bumpLevel, scope, summary }) {
  if (!BUMP_LEVELS.includes(bumpLevel)) {
    throw new Error(`Invalid bump level "${bumpLevel}". Expected one of: ${BUMP_LEVELS.join(', ')}`)
  }

  const scopes = Array.isArray(scope) ? scope : String(scope).split(',')
  const cleanScopes = scopes.map(s => s.trim()).filter(Boolean)
  if (cleanScopes.length === 0) {
    throw new Error('No scope provided')
  }

  if (!summary || !summary.trim()) {
    throw new Error('No summary provided')
  }

  const label = cleanScopes.join('/')
  const frontmatter = `'${CHANGESET_PACKAGE}': ${bumpLevel}`
  const content = `---
${frontmatter}
---

**${label}**: ${summary.trim()}
`

  // Generate filename using changeset CLI
  const filename = parseChangesetFilename(exec('pnpm exec changeset add --empty'))
  const filepath = join(workspaceRoot, '.changeset', filename)

  // Setup cleanup on error
  cleanUp = async () => rm(filepath, { force: true })

  // Overwrite the empty changeset the CLI created
  await writeFile(filepath, content, { encoding: 'utf-8' })

  console.log('')
  console.log(`\x1b[32m✔\x1b[0m Changeset created: ${filepath}`)
  console.log('')

  return filepath
}

/**
 * Non-interactive flow — used when --bump, --scope, and --summary are all passed as CLI flags
 */
async function runNonInteractive(args) {
  await writeChangeset({
    bumpLevel: args.bump,
    scope: args.scope,
    summary: args.summary,
  })
}

/**
 * Interactive flow — prompts the user for bump level, scope(s), and summary
 */
async function runInteractive() {
  try {
    // Read tags from core dist
    const tagsPath = join(workspaceRoot, 'packages/core/docs/tags.json')
    const tagsContent = await readFile(tagsPath, 'utf-8')
    const tags = JSON.parse(tagsContent)

    // Prompt for changeset details
    const response = await prompts([
      {
        type: 'select',
        name: 'bumpLevel',
        message: 'What type of change is it?',
        choices: [
          {
            title: '\x1B[34mpatch \x1b[90m(bugs, dep-updates)',
            value: 'patch',
            selected: true,
          },
          {
            title: '\x1b[32mminor \x1b[90m(features)',
            value: 'minor',
          },
          {
            title: '\x1B[31mmajor \x1b[90m(breaking changes)',
            value: 'major',
          },
        ],
        instructions: false,
      },
      {
        type: 'autocompleteMultiselect',
        name: 'scope',
        message: 'Pick the scope(s) for this change.',
        min: 1,
        instructions: '\x1b[90m(type to filter, space to select, enter to confirm)\x1b[0m',
        choices: [
          { title: 'core', value: 'core' },
          { title: 'angular', value: 'angular' },
          { title: 'styles', value: 'styles' },
          { title: 'devkit', value: 'devkit' },
          { title: 'testing', value: 'testing' },
          { title: 'tokens', value: 'tokens' },
          { title: 'react', value: 'react' },
          { title: 'table', value: 'table' },
          { title: 'assets', value: 'assets' },
          { title: 'skills', value: 'skills' },
          { title: 'deps', value: 'deps' },
          { title: 'a11y', value: 'a11y' },
          ...tags.map(tag => ({
            title: tag.replace('ds-', ''),
            value: tag.replace('ds-', ''),
          })),
        ],
      },
      {
        type: 'text',
        name: 'summary',
        message: 'Please enter a summary for this change.',
      },
    ])

    // Validate responses
    if (!response.bumpLevel) {
      console.error('✗ No bump level selected')
      process.exit(1)
    }

    if (!response.scope || response.scope.length === 0) {
      console.error('✗ No scope selected')
      process.exit(1)
    }

    if (!response.summary) {
      console.error('✗ No summary provided')
      process.exit(1)
    }

    await writeChangeset({
      bumpLevel: response.bumpLevel,
      scope: response.scope,
      summary: response.summary,
    })
  } catch (error) {
    console.error('✗ Error creating changeset:', error.message)
    await cleanUp()
    process.exit(1)
  }
}

/**
 * Main
 */
async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.bump && args.scope && args.summary) {
    try {
      await runNonInteractive(args)
    } catch (error) {
      console.error('✗ Error creating changeset:', error.message)
      await cleanUp()
      process.exit(1)
    }
    return
  }

  await runInteractive()
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
