import * as fs from 'fs';
import * as path from 'path';
import { LOG_LEVELS, type LogLevel } from '../configs/constants.ts';
import { configApp } from '../configs/index.ts';
import { getContext } from './context.util.ts';

const LOGS_BASE_PATH = './storages/logs';
const SERVICE_NAME = process.env.SERVICE_NAME || 'app';

const logStreams = new Map<string, fs.WriteStream>();
let currentLogDate = '';

const closeAllStreams = (): void => {
  for (const stream of logStreams.values()) {
    stream.end();
  }
  logStreams.clear();
};

process.on('exit', closeAllStreams);

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
        fs.rmSync(path.join(serviceDir, dir), { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error('[LoggerCleanup] Failed to cleanup old logs:', error);
  }
};

const ensureLogDirectory = (date: string): string => {
  const serviceDir = path.join(LOGS_BASE_PATH, SERVICE_NAME);
  const dateDir = path.join(serviceDir, date);

  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
    cleanupOldLogs(serviceDir);
  }

  return dateDir;
};

const getLogFileName = (level: LogLevel): string => {
  const fileNames: Record<LogLevel, string> = {
    [LOG_LEVELS.DEBUG]: 'debug.jsonl',
    [LOG_LEVELS.INFO]: 'info.jsonl',
    [LOG_LEVELS.WARN]: 'warning.jsonl',
    [LOG_LEVELS.ERROR]: 'errors.jsonl',
  };
  return fileNames[level];
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]!;
};

const formatTimestamp = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

const getOrCreateStream = (dateStr: string, level: LogLevel): fs.WriteStream | null => {
  try {
    const key = `${dateStr}:${level}`;

    if (dateStr !== currentLogDate) {
      closeAllStreams();
      currentLogDate = dateStr;
    }

    let stream = logStreams.get(key);
    if (!stream) {
      const logDir = ensureLogDirectory(dateStr);
      const filePath = path.join(logDir, getLogFileName(level));
      stream = fs.createWriteStream(filePath, { flags: 'a' });
      stream.on('error', (err) => {
        console.error(`[LoggerStream] Write error [${filePath}]:`, err);
      });
      logStreams.set(key, stream);
    }

    return stream;
  } catch (error) {
    console.error('[LoggerStream] Failed to get/create stream:', error);
    return null;
  }
};

const extractModule = (message: string): { module: string | null; msg: string } => {
  const match = message.match(/^\[([^\]]+)\]\s*(.*)/);
  if (match) return { module: match[1]!, msg: match[2] || match[1]! };
  return { module: null, msg: message };
};

const formatDataForJson = (data: unknown): Record<string, unknown> | string | null => {
  if (data === undefined || data === null) return null;

  if (data instanceof Error) {
    const obj: Record<string, unknown> = { message: data.message, name: data.name };
    if (data.stack) obj.stack = data.stack;
    return obj;
  }

  if (typeof data === 'object') {
    try {
      return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
    } catch {
      return String(data);
    }
  }

  return String(data);
};

const writeToFile = (level: LogLevel, message: string, data?: unknown): void => {
  const now = new Date();
  const dateStr = formatDate(now);

  const context = getContext();
  const { module, msg } = extractModule(message);
  const formattedData = formatDataForJson(data);

  const entry: Record<string, unknown> = {
    time: now.toISOString(),
    level: level.toUpperCase(),
    service: SERVICE_NAME,
  };

  if (context?.requestId) entry.reqId = context.requestId;
  if (module) entry.module = module;
  entry.msg = msg;
  if (formattedData) entry.data = formattedData;

  const line = JSON.stringify(entry) + '\n';

  const stream = getOrCreateStream(dateStr, level);
  if (stream) {
    stream.write(line);
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

  if (data !== undefined) {
    consoleMethod(`[${timestamp}] [${levelUpper}]${reqIdPart} ${message}`, data);
  } else {
    consoleMethod(`[${timestamp}] [${levelUpper}]${reqIdPart} ${message}`);
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
