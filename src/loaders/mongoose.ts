import mongoose, { Mongoose } from "mongoose";

import { Config } from "configs";

async function loadMongoose(config: Config): Promise<Mongoose> {
  await mongoose.connect(config.mongoDB.url, { useNewUrlParser: true, useUnifiedTopology: true, keepAlive: true, useFindAndModify: false, useCreateIndex: true });

  return mongoose;
}

export { loadMongoose };
