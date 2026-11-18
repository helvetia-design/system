import { beforeEach, describe, expect, it, vi } from 'vitest'
import { execSync } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import { parseArgs, parseChangesetFilename, writeChangeset } from '../create-changeset.mjs'

vi.mock('node:child_process', () => ({ execSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn(), rm: vi.fn(), writeFile: vi.fn() }))

describe('parseArgs', () => {
  it('keeps "=" inside the summary value', () => {
    const args = parseArgs(['--bump=patch', '--scope=core', '--summary=fix a=b'])
    expect(args.summary).toBe('fix a=b')
  })

  it('supports "--key value" form', () => {
    expect(parseArgs(['--bump', 'minor'])).toEqual({ bump: 'minor' })
  })
})

describe('parseChangesetFilename', () => {
  it('extracts the filename from changeset CLI output', () => {
    const stdout = '🦋  Empty Changeset added! - you can now commit it\n\n.changeset/calm-modals-bind.md\n'
    expect(parseChangesetFilename(stdout)).toBe('calm-modals-bind.md')
  })

  it('accepts forward and back slashes', () => {
    expect(parseChangesetFilename('.changeset/busy-paws-poke.md')).toBe('busy-paws-poke.md')
    expect(parseChangesetFilename('.changeset\\busy-paws-poke.md')).toBe('busy-paws-poke.md')
  })

  it('throws on empty or garbled output', () => {
    expect(() => parseChangesetFilename('')).toThrow('Could not find changeset filename')
    expect(() => parseChangesetFilename('.changeset/')).toThrow('Could not find changeset filename')
    expect(() => parseChangesetFilename('.changeset/../config.json')).toThrow('Could not find changeset filename')
  })
})

describe('writeChangeset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('leaves .changeset untouched when CLI output is empty', async () => {
    vi.mocked(execSync).mockReturnValue('')

    await expect(writeChangeset({ bumpLevel: 'patch', scope: 'core', summary: 'fix' })).rejects.toThrow(
      'Could not find changeset filename',
    )
    expect(rm).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('writes the summary unchanged when it contains "="', async () => {
    vi.mocked(execSync).mockReturnValue('.changeset/calm-modals-bind.md\n')

    await writeChangeset({ bumpLevel: 'patch', scope: 'core', summary: 'fix a=b' })

    expect(rm).not.toHaveBeenCalled()
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/[\\/]\.changeset[\\/]calm-modals-bind\.md$/),
      expect.stringContaining('**core**: fix a=b'),
      { encoding: 'utf-8' },
    )
  })
})
