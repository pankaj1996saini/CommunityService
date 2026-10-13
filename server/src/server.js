const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');

async function start() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected (${mongoose.connection.name})`);
  } catch (err) {
    console.error(`\nCould not reach MongoDB at ${config.mongoUri}`);
    console.error('Is it running? Try "npm run db" from the project root (needs Docker) or start mongod yourself.\n');
    console.error(err.message);
    process.exit(1);
  }

  // 0.0.0.0 so a phone on the same wifi can reach it, not just localhost
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

start();
