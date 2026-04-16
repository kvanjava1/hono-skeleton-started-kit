# Seeders

This project supports seeders for:

- MySQL
- MongoDB
- PostgreSQL
- SQLite

## Commands

Run all enabled seeders:

```bash
bun run seed:dev
bun run seed:prod
```

Run a specific target:

```bash
bun run seed:dev mysql
bun run seed:dev mongo
bun run seed:dev pg
bun run seed:dev sqlite
```

Run a specific seeder file:

```bash
bun run seed:dev mysql ProductSeeder
```

Create a seeder:

```bash
bun run make seeder mysql ProductSeeder
```

## Examples

### MySQL

```ts
import { getMysqlPool } from '../../../src/database/mysql.connection.ts';
import { logger } from '../../../src/utils/logger.util.ts';

export const seed = async (): Promise<void> => {
  logger.info('Running MySQL seeder: UserSeeder');
  const pool = getMysqlPool('mysql1');

  await pool.execute(`
    INSERT INTO users (email)
    VALUES ('admin@example.com')
  `);
};
```

### MongoDB

```ts
import { getMongoDb } from '../../../src/database/mongo.connection.ts';
import { logger } from '../../../src/utils/logger.util.ts';

export const seed = async (): Promise<void> => {
  logger.info('Running MongoDB seeder: UserSeeder');
  const db = getMongoDb('mongo1');

  await db.collection('users').insertOne({
    email: 'admin@example.com',
  });
};
```

### PostgreSQL

```ts
import { getPgSql } from '../../../src/database/pg.connection.ts';
import { logger } from '../../../src/utils/logger.util.ts';

export const seed = async (): Promise<void> => {
  logger.info('Running PostgreSQL seeder: UserSeeder');
  const sql = getPgSql('pg1');

  await sql`INSERT INTO users (email) VALUES ('admin@example.com')`;
};
```

## Notes

- seeders remain separated by engine
- new code should choose the connection explicitly when the target matters
- Redis does not have a built-in seeder system in this skeleton

[Back to Docs](../README.md)
