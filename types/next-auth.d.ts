import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError";
    role?: string;
    _id?: string;
    user: {
      _id?: string;
      id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phoneNumber?: string;
      country?: string;
      cityState?: string;
      avatar?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    _id?: string;
    role?: string;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    phoneNumber?: string;
    country?: string;
    cityState?: string;
    avatar?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError";
    role?: string;
    _id?: string;
    user?: {
      _id?: string;
      id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatar?: string;
      phoneNumber?: string;
      country?: string;
      cityState?: string;
    };
  }
}
