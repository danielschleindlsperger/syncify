import winston from 'winston'

export function createLogger(meta: Record<string, any> = {}) {
  return winston.createLogger({
    defaultMeta: { app: 'syncify', ...meta },
    format:
      process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    transports: [new winston.transports.Console()],
  })
}
