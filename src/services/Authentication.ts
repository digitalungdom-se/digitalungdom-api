import jwt from "jsonwebtoken";
import { ObjectID } from "mongodb";

import { Config } from "configs";
import { IReturnToken } from "interfaces";
import { TokenModel, TokenType } from "models";

export class AuthenticationService {
  constructor(private readonly Token: typeof TokenModel, private readonly config: Config) {}

  public createToken(id: string): string {
    return jwt.sign({ id }, this.config.secret, { expiresIn: 60 * 15, issuer: "clmte.com", audience: "clmte.com" });
  }

  public validateToken(token: string): boolean {
    try {
      jwt.verify(token, this.config.secret);
      return true;
    } catch (e) {
      return false;
    }
  }

  public parseToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, this.config.secret) as any;
      return decoded.id;
    } catch (e) {
      return null;
    }
  }

  public async refreshToken(refreshToken: string): Promise<IReturnToken | null> {
    const token = await this.Token.findOne({ value: refreshToken, type: TokenType.Refresh });

    if (!token) {
      return null;
    }

    const accessToken = this.createToken((token.user as ObjectID).toHexString());

    return { access_token: accessToken, refresh_token: refreshToken, expires: 60 * 15, token_type: "bearer" };
  }

  public async deleteRefreshToken(token: string): Promise<void> {
    await this.Token.deleteOne({ value: token, type: TokenType.Refresh });
  }
}
