export interface IReturnToken {
  access_token: string;
  refresh_token: string;
  expires: number;
  token_type: "bearer";
}
