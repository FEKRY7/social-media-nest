export type JWTPayloadType = {
  _id: string;
  role: string;
  name: string;
  email: string;
};

export type AccessTokenType = {
  accessToken: string;
};
