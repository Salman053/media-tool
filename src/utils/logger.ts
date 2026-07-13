const PREFIX = '[media-tool]'

export function info(message: string): void {
  console.log(`${PREFIX} ${message}`)
}

export function error(message: string): void {
  console.error(`${PREFIX} error: ${message}`)
}
