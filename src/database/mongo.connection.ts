import { MongoClient, Db } from "mongodb";
import {
  configMongo,
  configApp,
  getMongoConnectionNames,
  type MongoConnectionName,
} from "../configs/index.ts";
import { logger } from "../utils/logger.util.ts";

const DEFAULT_MONGO_CONNECTION: MongoConnectionName = "mongo1";
const mongoClients = new Map<MongoConnectionName, MongoClient>();
const mongoDatabases = new Map<MongoConnectionName, Db>();

const getMongoConfig = (name: MongoConnectionName) => {
  return configMongo()[name];
};

export const connectMongo = async (
  name: MongoConnectionName = DEFAULT_MONGO_CONNECTION,
): Promise<Db> => {
  if (!configApp.db.mongo) {
    throw new Error(
      "MongoDB is disabled in configuration. Enable DB_MONGO_ENABLED=true in your .env file.",
    );
  }

  const existingDb = mongoDatabases.get(name);
  if (existingDb) {
    return existingDb;
  }

  try {
    const mongoConfig = getMongoConfig(name);
    const client = new MongoClient(mongoConfig.getUri(), {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    const db = client.db(mongoConfig.dbName);

    mongoClients.set(name, client);
    mongoDatabases.set(name, db);

    logger.info(`MongoDB connection "${name}" connected to ${mongoConfig.dbName}`);
    return db;
  } catch (error) {
    logger.error(`MongoDB connection "${name}" failed`, error);
    throw error;
  }
};

export const connectAllMongoConnections = async (): Promise<
  Record<MongoConnectionName, Db>
> => {
  const connectionNames = getMongoConnectionNames();
  const entries = await Promise.all(
    connectionNames.map(async (name) => [name, await connectMongo(name)] as const),
  );

  return Object.fromEntries(entries) as Record<MongoConnectionName, Db>;
};

export const disconnectMongo = async (
  name: MongoConnectionName = DEFAULT_MONGO_CONNECTION,
): Promise<void> => {
  const client = mongoClients.get(name);
  if (client) {
    await client.close();
    mongoClients.delete(name);
    mongoDatabases.delete(name);
    logger.info(`MongoDB connection "${name}" disconnected`);
  }
};

export const disconnectAllMongoConnections = async (): Promise<void> => {
  for (const name of getMongoConnectionNames()) {
    await disconnectMongo(name);
  }
};

export const testMongoConnection = async (
  name: MongoConnectionName = DEFAULT_MONGO_CONNECTION,
): Promise<boolean> => {
  try {
    const database = await connectMongo(name);
    await database.command({ ping: 1 });
    logger.info(`MongoDB connection "${name}" test successful`);
    return true;
  } catch (error) {
    logger.error(`MongoDB connection "${name}" test failed`, error);
    return false;
  }
};

export const testAllMongoConnections = async (): Promise<boolean> => {
  for (const name of getMongoConnectionNames()) {
    const isOk = await testMongoConnection(name);
    if (!isOk) {
      return false;
    }
  }

  return true;
};

export const getMongoDb = (
  name: MongoConnectionName = DEFAULT_MONGO_CONNECTION,
): Db => {
  const db = mongoDatabases.get(name);
  if (!db) {
    throw new Error(
      `MongoDB connection "${name}" not connected. Call connectMongo('${name}') first.`,
    );
  }

  return db;
};

export const getMongoClient = (
  name: MongoConnectionName = DEFAULT_MONGO_CONNECTION,
): MongoClient => {
  const client = mongoClients.get(name);
  if (!client) {
    throw new Error(
      `MongoDB client "${name}" not connected. Call connectMongo('${name}') first.`,
    );
  }

  return client;
};
