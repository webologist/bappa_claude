// Local-only helper: runs a real MongoDB process on 127.0.0.1:27017 without
// requiring a system install, so MONGODB_URI in .env works as-is during dev.
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'ganesh-utsav',
      ip: '127.0.0.1'
    }
  });
  console.log('✓ Dev MongoDB running at', mongod.getUri());

  const shutdown = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('✗ Failed to start dev MongoDB:', err);
  process.exit(1);
});
