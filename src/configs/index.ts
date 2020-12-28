import { config as dotenvConfig } from "dotenv";

const envFound = dotenvConfig({ path: `${process.env.PWD}/.env` });
if (!envFound) {
  throw new Error("Could not find .env file");
}

interface Config {
  isDevelopment: boolean;

  environment: {
    production: boolean;
    development: boolean;
    staging: boolean;
    test: boolean;
  };

  server: {
    port: number;
  };

  secret: string;

  logs: {
    level: string;
  };

  mongoDB: {
    url: string;
  };

  sendGrid: {
    apiKey: string;
    email: string;
    emailTemplates: { login: string };
  };

  storageDir: string;
}

const config: Config = {
  isDevelopment: process.env.NODE_ENV === "development",
  environment: {
    production: process.env.ENVIRONMENT === "production",
    development: process.env.ENVIRONMENT === "development",
    test: process.env.ENVIRONMENT === "test",
    staging: process.env.ENVIRONMENT === "staging",
  },

  server: {
    port: parseInt(process.env.PORT || "8080", 10),
  },

  secret: process.env.SECRET!,

  logs: {
    level: process.env.LOG_LEVEL || "silly",
  },

  mongoDB: {
    url: process.env.MONGODB_URL!,
  },

  sendGrid: {
    apiKey: process.env.SEND_GRID_API_KEY!,
    email: process.env.SEND_GRID_EMAIL!,
    emailTemplates: {
      login: "d-aa545cbb855242a09f6fc7333861fc7b",
    },
  },

  storageDir: process.env.DATA_STORE_DIR!,
};

export { config, Config };
