import { Config } from "configs";

import { App } from "./App";
import { loadServices } from "./services";
import { loadMongoose } from "./mongoose";
import { loadLogger } from "./logger";
import { loadMailService } from "./sendGrid";

async function load(config: Config): Promise<App> {
  const logger = loadLogger(config);

  const mongoose = await loadMongoose(config);
  const mailService = loadMailService(config);
  const services = loadServices(mailService, config);

  const app = new App(config, logger, mongoose, services);

  return app;
}

export { load };
