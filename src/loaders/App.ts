import bodyParser from "body-parser";
import express from "express";
import helmet from "helmet";
import expressWinston from "express-winston";
import winston from "winston";
import { Mongoose } from "mongoose";
import { Server } from "http";
import cors from "cors";

import router from "api/routes";
import { Config } from "configs";
import { IServices } from "interfaces";
import { injectUser } from "api/middlewares";

class App {
  public app: express.Application;
  private server: Server | undefined;

  constructor(private readonly config: Config, public readonly logger: winston.Logger, private readonly mongoose: Mongoose, services: IServices) {
    this.app = express();

    this.init();
    this.initServices(services);
    this.initMiddlewares();
    this.initRoutes();
    this.initErrorHandler();
  }

  public start(): void {
    this.server = this.app.listen(this.app.get("port"));
  }

  public async close(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.mongoose.disconnect();
    this.logger.close();
    this.server?.close();
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }

  public getPort(): number {
    return this.app.get("port");
  }

  public getApp(): express.Application {
    return this.app;
  }

  private init(): void {
    if (process.env.BEHIND_REVERSE_PROXY) {
      this.app.enable("trust proxy");
    }

    this.app.disable("x-powered-by");

    this.app.set("port", this.config.server.port);
  }

  private initServices(services: IServices): void {
    const logger = this.logger;
    this.app
      .use(function (req, _, next) {
        req.logger = logger;
        req.services = services;
        next();
      })
      .bind(this);
  }

  private initMiddlewares(): void {
    this.app.use(
      expressWinston.logger({
        winstonInstance: this.logger,
        msg: "{{res.statusCode}} {{req.method}} {{req.url}} {{res.responseTime}}ms ",
        statusLevels: true as any,
        requestField: null as any,
        responseField: null as any,
        dynamicMeta: (req, res) => {
          const meta: any = {};

          meta.req = {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userID: req.user?._id,
            // body: req.body,
            // query: req.query,
            // params: req.params,
            headers: req.headers,
          };

          meta.res = {
            statusCode: res.statusCode,
          };

          return meta;
        },
        skip: function (_, res) {
          if (res.statusCode === 500) {
            return true;
          }

          return false;
        },
      }),
    );

    if (this.config.environment.production) {
      this.app.use(cors({ origin: "https://www.clmte.com" }));
    } else {
      this.app.use(cors());
    }

    this.app.use(helmet());
    this.app.use(helmet.permittedCrossDomainPolicies());
    this.app.use(helmet.referrerPolicy({ policy: "same-origin" }));
    this.app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));

    this.app.use(bodyParser.json({ limit: "100kb" }));
    this.app.use(bodyParser.urlencoded({ limit: "100kb", extended: false }));
    this.app.use(bodyParser.raw({ limit: "100kb" }));
    this.app.use(bodyParser.text({ limit: "100kb" }));

    this.app.use(injectUser);
  }

  private initRoutes(): void {
    this.app.use(router);

    this.app.use(function (_, __, next) {
      const err: Express.RequestError = new Error("NOT_FOUND");
      err.statusCode = 404;

      next(err);
    });
  }

  private initErrorHandler(): void {
    // respond to the client
    this.app.use(function (err: Express.RequestError, _: express.Request, res: express.Response, next: express.NextFunction) {
      const statusCode = err.statusCode || 500;

      res.sendStatus(statusCode);
      next(err);
    });

    // log the request
    this.app.use(
      expressWinston.errorLogger({
        winstonInstance: this.logger,
        msg: "{{res.statusCode}} {{req.method}} {{req.url}} {{res.responseTime}}ms ",
        requestField: null as any,
        responseField: null as any,
        dynamicMeta: (req, res) => {
          const meta: any = {};

          meta.req = {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userID: req.user?._id,
            // body: req.body,
            // query: req.query,
            // params: req.params,
            headers: req.headers,
          };

          meta.res = {
            statusCode: res.statusCode,
          };

          return meta;
        },
        skip: function (_, res) {
          if (res.statusCode && res.statusCode !== 500) {
            return true;
          }

          return false;
        },
      }),
    );

    // clear the error so that express does not log it
    this.app.use(function (err: Express.RequestError, _: express.Request, res: express.Response, next: express.NextFunction) {
      next();
    });
  }
}

export { App };
