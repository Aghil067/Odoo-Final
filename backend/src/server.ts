import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './lib/db.js';

const server = app.listen(env.PORT, () => console.info(`M01 API listening on port ${env.PORT}`));
function shutdown() {
  server.close(() => { void db.$disconnect().finally(() => process.exit(0)); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
