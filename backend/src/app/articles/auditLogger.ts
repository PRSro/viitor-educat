import { FastifyRequest, FastifyReply } from 'fastify';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  requestId?: string;
  userId?: string;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
}

class AuditLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private requestIdCounter = 0;

  generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(fullEntry);
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Also output to console for production visibility
    const levelColors = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[35m'
    };
    const reset = '\x1b[0m';
    const color = levelColors[fullEntry.level] || '';
    
    console.log(
      `${color}[${fullEntry.timestamp}] ${fullEntry.level.toUpperCase()}${reset} ` +
      `[${fullEntry.action}] ${fullEntry.message}` +
      (fullEntry.requestId ? ` [${fullEntry.requestId}]` : '') +
      (fullEntry.userId ? ` [user:${fullEntry.userId}]` : '')
    );
  }

  info(action: string, message: string, metadata?: Record<string, any>): void {
    this.log({ level: 'info', message, action, metadata });
  }

  warn(action: string, message: string, metadata?: Record<string, any>): void {
    this.log({ level: 'warn', message, action, metadata });
  }

  error(action: string, message: string, metadata?: Record<string, any>): void {
    this.log({ level: 'error', message, action, metadata });
  }

  debug(action: string, message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log({ level: 'debug', message, action, metadata });
    }
  }

  getLogs(filters?: { action?: string; userId?: string; level?: string }): LogEntry[] {
    let filtered = this.logs;
    
    if (filters?.action) {
      filtered = filtered.filter(l => l.action === filters.action);
    }
    if (filters?.userId) {
      filtered = filtered.filter(l => l.userId === filters.userId);
    }
    if (filters?.level) {
      filtered = filtered.filter(l => l.level === filters.level);
    }
    
    return filtered;
  }

  clear(): void {
    this.logs = [];
  }
}

export const auditLogger = new AuditLogger();

// Request logging middleware
export function createRequestLogger(request: FastifyRequest, reply: FastifyReply, done: () => void): void {
  const requestId = auditLogger.generateRequestId();
  (request as any).requestId = requestId;
  
  const start = Date.now();
  
  reply.raw.on('finish', () => {
    const duration = Date.now() - start;
    const level = reply.statusCode >= 400 ? 'warn' : 'info';
    
    auditLogger.log({
      level: level as any,
      message: `${request.method} ${request.url} - ${reply.statusCode} (${duration}ms)`,
      requestId,
      userId: (request as any).user?.id,
      action: 'REQUEST',
      metadata: {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration
      }
    });
  });
  
  done();
}

// Action-specific logging helpers
export function logArticleAction(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'VALIDATION_ERROR' | 'PERMISSION_DENIED',
  userId: string,
  slug: string,
  metadata?: Record<string, any>
): void {
  const messages: Record<string, string> = {
    CREATE: `Article created: ${slug}`,
    UPDATE: `Article updated: ${slug}`,
    DELETE: `Article deleted: ${slug}`,
    RESTORE: `Article restored: ${slug}`,
    VALIDATION_ERROR: `Validation failed for: ${slug}`,
    PERMISSION_DENIED: `Permission denied for: ${slug}`
  };
  
  auditLogger.log({
    level: action.includes('ERROR') || action.includes('DENIED') ? 'warn' : 'info',
    message: messages[action],
    userId,
    action,
    resource: slug,
    metadata
  });
}
