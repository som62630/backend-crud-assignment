import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';
try {
  const app = createApp({ mongoUri: process.env.MONGODB_URI, sessionSecret: process.env.SESSION_SECRET, production: process.env.NODE_ENV === 'production' });
  await connectDatabase(process.env.MONGODB_URI);
  const server = app.listen(process.env.PORT || 3000, () => console.log(`API running on port ${process.env.PORT || 3000}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(async () => { await mongoose.disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
} catch (err) {
  console.error('Startup failed. Check your MongoDB URI, network access and SESSION_SECRET.');
  process.exit(1);
}
