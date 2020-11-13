/* eslint-disable no-process-exit */
import { config } from "configs";

import { load } from "loaders";

async function start(): Promise<void> {
  const app = await load(config);

  app.start();

  app.logger.info(`Starting DIGITALUNGDOM-API in ${process.env.ENVIRONMENT} (NODE_ENV: ${process.env.NODE_ENV}). Listening on port ${app.getPort()}. Log level is ${config.logs.level}.`);

  process.on("SIGINT", async function () {
    await app.close();
    process.exit();
  });

  process.on("unhandledRejection", async function (reason) {
    if (typeof reason === "object") {
      reason = JSON.stringify(reason);
    }

    app.logger.error("UNHANDLED_REJECTION", { error: reason });
  });

  process.on("uncaughtException", async function (reason) {
    app.logger.error("UNHANDLED_EXCEPTION", { error: reason });
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start().catch(e => {
  console.error(`❌ | ${new Date().toISOString()} |`, e);
  process.exit(1);
});
