import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const execSync = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({ execSync }))

const { parseArgs, parseChangesetFilename, writeChangeset } = await import('../create-changeset.mjs')

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHANGESET_DIR = resolve(__dirname, '../../.changeset')
const input = { bumpLevel: 'patch', scope: 'core', summary: 'test' }

describe('parseArgs', () => {
  it('splits on the first "=" only', () => {
    expect(parseArgs(['--summary=fix a=b', '--bump', 'patch'])).toEqual({ summary: 'fix a=b', bump: 'patch' })
  })
})

describe('parseChangesetFilename', () => {
  it('reads the filename from colored CLI output', () => {
    expect(
      parseChangesetFilename('🦋  success Empty Changeset added\n\x1b[34m.changeset\\brave-cats-run.md\x1b[39m\n'),
    ).toBe('brave-cats-run.md')
    expect(parseChangesetFilename('.changeset/brave-cats-run.md')).toBe('brave-cats-run.md')
  })

  it.each(['', 'garbled', '.changeset/', '.changeset/../config.md'])('throws on %j', stdout => {
    expect(() => parseChangesetFilename(stdout)).toThrow()
  })
})

describe('writeChangeset', () => {
  beforeEach(() => execSync.mockReset())

  it.each(['', 'something changed'])('leaves .changeset/ intact when CLI output is %j', async stdout => {
    const before = readdirSync(CHANGESET_DIR)
    execSync.mockReturnValue(stdout)
    await expect(writeChangeset(input)).rejects.toThrow('Could not read changeset filename')
    expect(existsSync(resolve(CHANGESET_DIR, 'config.json'))).toBe(true)
    expect(readdirSync(CHANGESET_DIR)).toEqual(before)
  })
})
