import { Request, Response, NextFunction } from "express";
import { ObjectID } from "mongodb";

async function injectUser(req: Request, _: Response, next: NextFunction): Promise<void> {
  const authorisationHeader = req.header("authorization");

  if (authorisationHeader && authorisationHeader.split(" ").length === 2) {
    const authorisation = {
      method: authorisationHeader.split(" ")[0],
      accessToken: authorisationHeader.split(" ")[1],
    };

    let userID;

    if (authorisation.method === "Bearer") {
      userID = req.services.Authentication.parseToken(authorisation.accessToken);
    }

    if (userID) {
      req.user = {
        _id: new ObjectID(userID),
      };
    }
  }

  next();
}

async function ensureUserAuthenticated(req: Request, _: Response, next: NextFunction): Promise<void> {
  if (!req.user?._id) {
    // if any thing fails (no header, invalid header, no consumer, etc) fail the request
    const err: Express.RequestError = new Error("UNAUTHORISED");
    err.statusCode = 401;
    err.customMessage = "UNAUTHORISED";
    next(err);
    return;
  }

  next();
}

export { injectUser, ensureUserAuthenticated };
