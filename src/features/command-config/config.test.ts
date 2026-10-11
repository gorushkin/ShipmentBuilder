import { afterEach, describe, expect, it, vi } from 'vitest'

import { shipmentShortcuts } from '@/pages/shipment/shared/shortcuts'

import { commands, loadCommands, parseCommands } from './index'

describe('external command configuration', () => {
  it('reads comments, labels and remapped shortcuts with defaults for omitted fields', () => {
    const result = parseCommands(`commands:
  printReports:
    # Open the report picker
    label: Отчёты
    shortcut: ctrl+shift+p
`)

    expect(result.printReports.label).toBe('Отчёты')
    expect(result.printReports.shortcut).toBe('ctrl+shift+p')
    expect(result.createTransportPlace.shortcut).toBe('n')
    expect(result.printReports.description).toBe('Открыть выбор отчета для печати')
  })

  it('disables a shortcut with null', () => {
    expect(
      parseCommands('commands:\n  printReports:\n    shortcut: null').printReports.shortcut,
    ).toBe('')
  })

  it.each([
    'commands:\n  unknown: {}',
    'commands:\n  printReports:\n    shortcut: shift+',
    'commands:\n  printReports:\n    shortcut: N',
    'commands:\n  printReports:\n    label: 42',
    'commands:\n  printReports:\n    shortcuts: p',
  ])('rejects invalid configuration atomically: %s', (source) => {
    expect(() => parseCommands(source)).toThrow()
  })
})

describe('command loading', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('updates the mapping used by handlers and retains it after a failed reload', async () => {
    const fetchConfig = vi.fn().mockResolvedValue(
      new Response(`commands:
  printReports:
    label: Отчёты
    shortcut: ctrl+shift+p
`),
    )
    vi.stubGlobal('fetch', fetchConfig)

    await loadCommands()

    expect(commands.printReports.label).toBe('Отчёты')
    expect(shipmentShortcuts.printReports).toBe('ctrl+shift+p')
    expect(fetchConfig).toHaveBeenCalledWith(
      expect.stringContaining('commands.yaml'),
      expect.objectContaining({ cache: 'no-store' }),
    )

    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchConfig.mockResolvedValue(new Response('commands:\n  printReports:\n    shortcut: n'))

    await loadCommands()

    expect(shipmentShortcuts.printReports).toBe('ctrl+shift+p')
    expect(log).toHaveBeenCalledOnce()
    log.mockRestore()
    fetchConfig.mockResolvedValue(new Response('commands: {}'))

    await loadCommands()
  })
})
