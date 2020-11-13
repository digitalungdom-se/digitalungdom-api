/* eslint-disable */
import { IServices } from "interfaces";
import { ObjectID } from "mongodb";
import { Logger } from "winston";
/* eslint-enable */

declare global {
  export namespace Express {
    export interface RequestError extends Error {
      message: string;
      customMessage?: string;
      statusCode?: number;
      status?: number;
      info?: string;
      errors?: Array<{ msg?: any; param?: string; value?: any }>;
    }

    export interface Request {
      services: IServices;

      logger: Logger;

      user?: {
        _id: ObjectID;
      };
    }
  }
}
