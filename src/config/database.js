import mongoose from 'mongoose';
export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is required. Copy .env.example to .env and configure Atlas.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}
