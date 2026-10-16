import mongoose from "mongoose";

const PLACEHOLDER = /your_mongodb|your-mongodb|mongodb_uri_here/i;

async function resolveMongoUri() {
  const configured = process.env.MONGO_URI?.trim();
  if (configured && !PLACEHOLDER.test(configured)) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGO_URI is required in production");
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const memoryServer = await MongoMemoryServer.create();
  console.log("Using in-memory MongoDB. Set MONGO_URI to use your own database.");
  return memoryServer.getUri();
}

export const connectDB = async () => {
  try {
    const uri = await resolveMongoUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Error in connecting to MongoDB", error);
    process.exit(1);
  }
};
