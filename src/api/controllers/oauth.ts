/* eslint-disable no-case-declarations */
import { Request, Response } from "express";

async function newToken(req: Request, res: Response): Promise<void> {
  let responseToken;

  if (req.body.grant_type === "client_credentials") {
    if (!req.headers.authorization || req.headers.authorization.split(" ").length !== 2) {
      res.sendStatus(401);
      return;
    }

    const method = req.headers.authorization.split(" ")[0];
    const authValue = req.headers.authorization.split(" ")[1];

    switch (method) {
      case "Email":
        const [email, code] = Buffer.from(authValue, "base64").toString("ascii").split(":");

        responseToken = await req.services.User.loginWithEmailCode(email, code);
        break;

      default:
        res.sendStatus(401);
        return;
    }
  } else if (req.body.grant_type === "refresh_token") {
    const refreshToken = req.body.refresh_token;

    if (typeof refreshToken === "string") {
      responseToken = await req.services.Authentication.refreshToken(refreshToken);
    }
  }

  if (!responseToken) {
    res.sendStatus(401);
    return;
  }

  res.status(200).json(responseToken);
}

async function revokeToken(req: Request, res: Response): Promise<void> {
  const token = req.body.token;

  await req.services.Authentication.deleteRefreshToken(token);
  res.sendStatus(204);
}

export default { newToken, revokeToken };
