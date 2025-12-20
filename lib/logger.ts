// Централизованное логирование

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      : error

    const fullContext = {
      ...context,
      error: errorDetails
    }

    console.error(this.formatMessage('error', message, fullContext))

    // В продакшене можно отправлять в Sentry, LogRocket и т.д.
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Пример интеграции с Sentry (раскомментировать при необходимости)
      // if (window.Sentry) {
      //   window.Sentry.captureException(error || new Error(message), {
      //     extra: context
      //   })
      // }
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context))
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }
}

export const logger = new Logger()

// Расширение Window для TypeScript (если нужно)
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: any) => void
    }
  }
}


