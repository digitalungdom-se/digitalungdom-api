import winston from "winston";
import { Config } from "configs";

function loadLogger(config: Config): winston.Logger {
  const transports = [];

  if (process.env.NODE_ENV !== "development") {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.cli(), winston.format.splat(), winston.format.timestamp()),
      }),
    );
  } else {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.splat(), winston.format.timestamp()),
      }),
    );
  }

  const logger = winston.createLogger({
    level: config.logs.level,
    levels: winston.config.npm.levels,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json(), winston.format.prettyPrint()),
    transports,
  });

  return logger;
}

export { loadLogger };
