import { Request, Response, NextFunction, RequestHandler } from "express";
import { ValidationChain, validationResult } from "express-validator";

const customValidationResult = validationResult.withDefaults({
  formatter: error => {
    return { param: error.param, value: error.value, msg: error.msg };
  },
});

function validatorWrapper(validations: Array<ValidationChain>): RequestHandler {
  return async function (req: Request, _, next: NextFunction): Promise<void> {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = customValidationResult(req);

    if (!errors || errors.isEmpty()) {
      return next();
    }

    const err: Express.RequestError = new Error("VALIDATION");
    err.customMessage = "VALIDATION_ERROR";
    err.statusCode = 422;
    err.errors = errors.array();

    if (process.env.NODE_ENV === "development" || process.env.LOG_LEVEL === "silly") {
      const errors = validationResult(req);
      err.errors = errors.array();
      console.error(err);
    }

    next(err);
  };
}

function controllerWrapper(controller: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    await controller(req, res);
    next();
  };
}

export { validatorWrapper, controllerWrapper };
