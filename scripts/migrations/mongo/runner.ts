import { Db } from "mongodb";
import { getMongoDb } from "../../../src/database/mongo.connection.ts";
import {
  getMongoConnectionNames,
  type MongoConnectionName,
} from "../../../src/configs/index.ts";

export interface MongoMigration {
  name: string;
  target: MongoConnectionName;
  up: (db: Db) => Promise<void>;
  down: (db: Db) => Promise<void>;
}

export const assertMongoMigrationTarget = (
  target: string,
): asserts target is MongoConnectionName => {
  if (!getMongoConnectionNames().includes(target as MongoConnectionName)) {
    throw new Error(
      `MongoDB migration target "${target}" is invalid. Expected one of: ${getMongoConnectionNames().join(", ")}`,
    );
  }
};

export const getExecutedMigrations = async (
  connectionName: MongoConnectionName,
): Promise<string[]> => {
  const db = getMongoDb(connectionName);
  const collection = db.collection("migrations");
  const migrations = await collection.find({}).sort({ name: 1 }).toArray();
  return migrations.map((migration) => migration.name as string);
};

export const markMigrationAsExecuted = async (
  connectionName: MongoConnectionName,
  name: string,
): Promise<void> => {
  const db = getMongoDb(connectionName);
  const collection = db.collection("migrations");
  await collection.insertOne({ name, executed_at: new Date() });
};

export const unmarkMigrationAsExecuted = async (
  connectionName: MongoConnectionName,
  name: string,
): Promise<void> => {
  const db = getMongoDb(connectionName);
  const collection = db.collection("migrations");
  await collection.deleteOne({ name });
};
