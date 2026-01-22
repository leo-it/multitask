type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  error?: Error
  metadata?: Record<string, unknown>
}

function formatLog(entry: LogEntry): string {
  const { level, message, timestamp, error, metadata } = entry
  const parts = [`[${timestamp}] [${level.toUpperCase()}] ${message}`]
  
  if (error) {
    parts.push(`Error: ${error.message}`)
    if (error.stack && process.env.NODE_ENV === 'development') {
      parts.push(`Stack: ${error.stack}`)
    }
  }
  
  if (metadata && Object.keys(metadata).length > 0) {
    parts.push(`Metadata: ${JSON.stringify(metadata)}`)
  }
  
  return parts.join(' | ')
}

export const logger = {
  info: (message: string, metadata?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      metadata,
    }
    console.log(formatLog(entry))
  },
  
  warn: (message: string, metadata?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      metadata,
    }
    console.warn(formatLog(entry))
  },
  
  error: (message: string, error?: Error, metadata?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error,
      metadata,
    }
    console.error(formatLog(entry))
  },
  
  debug: (message: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        metadata,
      }
      console.log(formatLog(entry))
    }
  },
}
