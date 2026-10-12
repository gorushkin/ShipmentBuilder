import { parse } from 'yaml'

import { normalizeShortcut } from '@/features/keyboard-input/keyboard-manager'

import { defaultCommands } from './defaults'

type Command = { description: string; label: string; shortcut: string }
export type CommandId = keyof typeof defaultCommands
export type Commands = Record<CommandId, Command>

export let commands: Commands = structuredClone(defaultCommands)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseCommands(source: string): Commands {
  const document: unknown = parse(source)

  if (!isRecord(document) || !isRecord(document.commands)) {
    throw new Error('Ожидается объект commands')
  }

  const result: Commands = structuredClone(defaultCommands)

  for (const [id, value] of Object.entries(document.commands)) {
    if (!Object.hasOwn(result, id)) throw new Error(`Неизвестная команда: ${id}`)
    if (!isRecord(value)) throw new Error(`Некорректная команда: ${id}`)

    const command = result[id as CommandId]

    for (const field of Object.keys(value)) {
      if (!['label', 'description', 'shortcut'].includes(field)) {
        throw new Error(`Неизвестное поле ${id}.${field}`)
      }
    }

    for (const field of ['label', 'description'] as const) {
      if (value[field] === undefined) continue
      if (typeof value[field] !== 'string' || !value[field].trim()) {
        throw new Error(`Ожидается непустая строка ${id}.${field}`)
      }

      command[field] = value[field]
    }

    if (value.shortcut !== undefined) {
      if (value.shortcut === null) command.shortcut = ''
      else if (typeof value.shortcut === 'string' && value.shortcut.trim()) {
        command.shortcut = normalizeShortcut(value.shortcut)
      } else throw new Error(`Некорректное сочетание ${id}.shortcut`)
    }
  }

  const assigned = new Map<string, string>()

  for (const [id, command] of Object.entries(result)) {
    if (!command.shortcut) continue

    const shortcut = normalizeShortcut(command.shortcut)
    const other = assigned.get(shortcut)

    if (other) throw new Error(`Конфликт сочетания ${shortcut}: ${other}, ${id}`)

    assigned.set(shortcut, id)
  }

  return result
}

export async function loadCommands(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}commands.yaml`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    commands = parseCommands(await response.text())
  } catch (error) {
    console.error('Не удалось загрузить commands.yaml; используются встроенные настройки.', error)
  }
}
