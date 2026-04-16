import { getRedis } from '../database/redis.connection.ts';
import { configApp } from '../configs/index.ts';
import { logger } from './logger.util.ts';

const DEFAULT_CACHE_CONNECTION = 'redis1' as const;

export const cacheSet = async (key: string, value: any, ttlSeconds: number = 3600): Promise<void> => {
    if (!configApp.db.redis) return;

    try {
        const redis = getRedis(DEFAULT_CACHE_CONNECTION);
        const stringValue = JSON.stringify(value);
        await redis.set(key, stringValue, 'EX', ttlSeconds);
    } catch (error) {
        logger.error(`Cache set failed for key: ${key}`, error);
    }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    if (!configApp.db.redis) return null;

    try {
        const redis = getRedis(DEFAULT_CACHE_CONNECTION);
        const value = await redis.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
    } catch (error) {
        logger.error(`Cache get failed for key: ${key}`, error);
        return null;
    }
};

export const cacheDelete = async (key: string): Promise<void> => {
    if (!configApp.db.redis) return;

    try {
        const redis = getRedis(DEFAULT_CACHE_CONNECTION);
        await redis.del(key);
    } catch (error) {
        logger.error(`Cache delete failed for key: ${key}`, error);
    }
};

export const cacheDeleteByPattern = async (pattern: string): Promise<void> => {
    if (!configApp.db.redis) return;

    try {
        const redis = getRedis(DEFAULT_CACHE_CONNECTION);
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        logger.error(`Cache delete pattern failed: ${pattern}`, error);
    }
};

/**
 * Batch retrieve multiple keys
 */
export const cacheMGet = async <T>(keys: string[]): Promise<(T | null)[]> => {
    if (!configApp.db.redis || keys.length === 0) return keys.map(() => null);

    try {
        const redis = getRedis(DEFAULT_CACHE_CONNECTION);
        const values = await redis.mget(...keys);

        return values.map(val => {
            if (!val) return null;
            try {
                return JSON.parse(val) as T;
            } catch (e) {
                return null;
            }
        });
    } catch (error) {
        logger.error('Cache MGet failed', error);
        return keys.map(() => null);
    }
};

/**
 * Batch set multiple keys with individual TTL
 * Uses pipeline for atomicity and individual TTL support
 */
export const cacheMSet = async (items: { key: string; value: any; ttlSeconds?: number }[]): Promise<void> => {
    if (!configApp.db.redis || items.length === 0) return;

    try {
        const redis = getRedis(DEFAULT_CACHE_CONNECTION);
        const pipeline = redis.pipeline();

        for (const item of items) {
            const stringValue = JSON.stringify(item.value);
            if (item.ttlSeconds) {
                pipeline.set(item.key, stringValue, 'EX', item.ttlSeconds);
            } else {
                pipeline.set(item.key, stringValue);
            }
        }

        await pipeline.exec();
    } catch (error) {
        logger.error('Cache MSet failed', error);
    }
};
