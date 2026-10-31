import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './lib/db.js';

const server = app.listen(env.PORT,env.BIND_HOST, () => console.info(`Solar API listening on ${env.BIND_HOST}:${env.PORT}`));
function shutdown() {
  server.close(() => { void db.$disconnect().finally(() => process.exit(0)); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
