# Architecture Standard

## Project Structure

```text
src/
├── index.ts
├── app.ts
├── configs/
├── routes/
├── controllers/
├── services/
├── repositories/
├── schemas/
├── middlewares/
├── utils/
├── database/
├── queues/
├── jobs/
└── workers/
```

## Layer Dependencies

```text
Routes -> Controllers -> Services -> Repositories -> Database
```

Rules:

- Routes register endpoints and attach validation or middleware.
- Controllers handle HTTP input/output only.
- Services contain business logic.
- Repositories contain database access.
- Database layer contains connection factories, registries, and helpers.

## Named Connection Standard

The skeleton supports explicit named connections across all primary engines:

- SQLite: `sqlite1`
- MySQL: `mysql1`, `mysql2`
- MongoDB: `mongo1`, `mongo2`
- Redis: `redis1`, `redis2`
- PostgreSQL: `pg1`, `pg2`

Repositories, migrations, seeders, queue wiring, and cache usage should choose the connection consciously when the target matters.

Examples:

```ts
const sqliteDb = getSqliteDb('sqlite1');
const mysqlPool = getMysqlPool('mysql1');
const mongoDb = getMongoDb('mongo1');
const pgSql = getPgSql('pg1');
const redis = getRedis('redis1');
```

Compatibility defaults still exist for some helpers, but new code should prefer explicit targeting.
