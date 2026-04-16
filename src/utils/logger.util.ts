import * as fs from 'fs';
import * as path from 'path';
import { LOG_LEVELS, type LogLevel } from '../configs/constants.ts';
import { configApp } from '../configs/index.ts';
import { getContext } from './context.util.ts';

const LOGS_BASE_PATH = './storages/logs';
const SERVICE_NAME = process.env.SERVICE_NAME || 'app';

const ensureLogDirectory = (date: string): string => {
  const serviceDir = path.join(LOGS_BASE_PATH, SERVICE_NAME);
  const dateDir = path.join(serviceDir, date);

  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
    cleanupOldLogs(serviceDir);
  }

  return dateDir;
};

const cleanupOldLogs = (serviceDir: string): void => {
  try {
    if (!fs.existsSync(serviceDir)) return;

    const directories = fs.readdirSync(serviceDir)
      .filter(file => fs.statSync(path.join(serviceDir, file)).isDirectory())
      .sort()
      .reverse();

    const retentionDays = configApp.logRetentionDays;
    if (directories.length > retentionDays) {
      const toDelete = directories.slice(retentionDays);
      for (const dir of toDelete) {
        const fullPath = path.join(serviceDir, dir);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
  } catch (error) {
    // Fail silently in logger to avoid crashing the app
    console.error('[LoggerCleanup] Failed to cleanup old logs:', error);
  }
};

const getLogFileName = (level: LogLevel): string => {
  const fileNames: Record<LogLevel, string> = {
    [LOG_LEVELS.DEBUG]: 'debug.txt',
    [LOG_LEVELS.INFO]: 'info.txt',
    [LOG_LEVELS.WARN]: 'warning.txt',
    [LOG_LEVELS.ERROR]: 'errors.txt',
  };
  return fileNames[level];
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]!;
};

const formatTimestamp = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

const formatError = (data: unknown): string => {
  if (data === undefined || data === null) {
    return '';
  }

  if (data instanceof Error) {
    let errorStr = `\n  Error: ${data.message}`;
    if (data.stack) {
      errorStr += `\n  Stack: ${data.stack}`;
    }
    return errorStr;
  }

  if (typeof data === 'object') {
    try {
      return `\n  Data: ${JSON.stringify(data, null, 2)}`;
    } catch {
      return `\n  Data: [Unable to stringify]`;
    }
  }

  return `\n  ${String(data)}`;
};

const writeToFile = (level: LogLevel, message: string, data?: unknown): void => {
  try {
    const now = new Date();
    const dateStr = formatDate(now);
    const timestamp = formatTimestamp(now);

    const logDir = ensureLogDirectory(dateStr);
    const fileName = getLogFileName(level);
    const filePath = path.join(logDir, fileName);

    const context = getContext();
    const reqIdPart = context ? ` [ID: ${context.requestId}]` : '';
    const clientIdPart = context?.clientId ? ` [Client: ${context.clientId}]` : '';

    let logEntry = `[${timestamp}] [${level.toUpperCase()}]${reqIdPart}${clientIdPart} ${message}`;

    if (data !== undefined) {
      logEntry += formatError(data);
    }

    logEntry += '\n';

    fs.appendFileSync(filePath, logEntry, 'utf8');
  } catch (error) {
    // Logging failures must never break request handling paths.
    console.error('[LoggerWrite] Failed to write log file:', error);
  }
};

const logToConsole = (level: LogLevel, message: string, data?: unknown): void => {
  const timestamp = formatTimestamp(new Date());
  const levelUpper = level.toUpperCase();

  const consoleMethods: Record<LogLevel, (msg: string, ...args: unknown[]) => void> = {
    [LOG_LEVELS.DEBUG]: console.log,
    [LOG_LEVELS.INFO]: console.info,
    [LOG_LEVELS.WARN]: console.warn,
    [LOG_LEVELS.ERROR]: console.error,
  };

  const consoleMethod = consoleMethods[level];

  const context = getContext();
  const reqIdPart = context ? ` [ID: ${context.requestId}]` : '';
  const clientIdPart = context?.clientId ? ` [Client: ${context.clientId}]` : '';

  if (data !== undefined) {
    consoleMethod(`[${timestamp}] [${levelUpper}]${reqIdPart}${clientIdPart} ${message}`, data);
  } else {
    consoleMethod(`[${timestamp}] [${levelUpper}]${reqIdPart}${clientIdPart} ${message}`);
  }
};

export const logger = {
  debug(message: string, data?: unknown): void {
    writeToFile(LOG_LEVELS.DEBUG, message, data);
    logToConsole(LOG_LEVELS.DEBUG, message, data);
  },

  info(message: string, data?: unknown): void {
    writeToFile(LOG_LEVELS.INFO, message, data);
    logToConsole(LOG_LEVELS.INFO, message, data);
  },

  warn(message: string, data?: unknown): void {
    writeToFile(LOG_LEVELS.WARN, message, data);
    logToConsole(LOG_LEVELS.WARN, message, data);
  },

  error(message: string, data?: unknown): void {
    writeToFile(LOG_LEVELS.ERROR, message, data);
    logToConsole(LOG_LEVELS.ERROR, message, data);
  },
};

export type Logger = typeof logger;
