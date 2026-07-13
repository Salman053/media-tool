import type { Command } from '../types'

class CommandRegistry {
  private commands = new Map<string, Command>()

  register(command: Command): void {
    this.commands.set(command.name, command)
  }

  get(name: string): Command | undefined {
    return this.commands.get(name)
  }

  getAll(): Command[] {
    return Array.from(this.commands.values())
  }
}

export const commandRegistry = new CommandRegistry()
