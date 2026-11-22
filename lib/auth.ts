import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import type { JWT } from "next-auth/jwt";
import { API_BASE_URL } from "./api";

// Backend access tokens are short-lived (15 min by default); refresh them
// shortly before they expire so client requests never carry an expired token.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

const accessTokenExpiry = (accessToken?: string): number | undefined => {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken?.split(".")[1] ?? "", "base64url").toString("utf8")
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
};

// The backend rotates refresh tokens on every use, so concurrent session
// requests carrying the same refresh token must share one refresh call.
const refreshes = new Map<string, { result: Promise<JWT>; expiresAt: number }>();

const refreshAccessToken = (token: JWT): Promise<JWT> => {
  const refreshToken = token.refreshToken;
  if (!refreshToken) {
    return Promise.resolve({ ...token, error: "RefreshAccessTokenError" });
  }
  const now = Date.now();
  for (const [key, entry] of refreshes) {
    if (entry.expiresAt <= now) refreshes.delete(key);
  }
  const pending = refreshes.get(refreshToken);
  if (pending) return pending.result;

  const result = axios
    .post(`${API_BASE_URL}/v1/auth/refresh-token`, { refreshToken })
    .then((response): JWT => {
      const data = response.data?.data ?? {};
      const accessToken: string | undefined = data.accessToken ?? data.token;
      if (!accessToken) throw new Error("Refresh response without access token");
      return {
        ...token,
        accessToken,
        refreshToken: data.refreshToken ?? refreshToken,
        accessTokenExpires: accessTokenExpiry(accessToken),
        error: undefined,
      };
    })
    .catch((error: unknown): JWT => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      // Only a rejected refresh token ends the session; transient network or
      // server errors keep the current token so the next request can retry.
      if (status === 400 || status === 401 || status === 403) {
        return { ...token, error: "RefreshAccessTokenError" };
      }
      refreshes.delete(refreshToken);
      return token;
    });
  refreshes.set(refreshToken, { result, expiresAt: now + 60 * 1000 });
  return result;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Zugangsdaten",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Bitte geben Sie E-Mail und Passwort ein.");
        }

        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          if (!response.data?.success || !response.data?.token) {
            throw new Error(response.data?.message ?? "Anmeldung fehlgeschlagen.");
          }

          const user = response.data.data;
          if (user.role !== "admin" && user.role !== "restaurant_owner") {
            throw new Error(
              "Dieses Verwaltungsportal ist nur für Administratoren und Restaurantbesitzer verfügbar."
            );
          }
          return {
            id: user._id ?? user.id,
            _id: user._id ?? user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            image: user.avatar,
            phoneNumber: user.phoneNumber,
            country: user.country,
            cityState: user.cityState,
            token: response.data.token,
            accessToken: response.data.token,
            refreshToken: response.data.refreshToken,
          };
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            throw new Error(
              error.response?.data?.message ?? "E-Mail oder Passwort ist inkorrekt."
            );
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.token ?? user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = accessTokenExpiry(token.accessToken);
        token.error = undefined;
        token.role = user.role;
        token._id = user._id ?? user.id;
        token.user = {
          _id: user._id ?? user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          image: user.avatar,
          phoneNumber: user.phoneNumber,
          country: user.country,
          cityState: user.cityState,
        };
      }

      if (trigger === "update" && session?.user) {
        const updatedUser = { ...(token.user ?? {}), ...session.user };
        if (session.user.avatar) {
          updatedUser.avatar = session.user.avatar;
          updatedUser.image = session.user.avatar;
        }
        token.user = updatedUser;
      }

      if (
        !user &&
        !token.error &&
        (!token.accessTokenExpires ||
          Date.now() >= token.accessTokenExpires - REFRESH_MARGIN_MS)
      ) {
        return refreshAccessToken(token);
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.error ? undefined : token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error;
      session.role = token.role;
      session._id = token._id;
      const storedUser = token.user ?? {};
      const avatar =
        storedUser.avatar ?? storedUser.image ?? session.user?.image ?? undefined;
      session.user = {
        ...session.user,
        ...storedUser,
        _id: token._id,
        role: token.role,
        image: avatar,
        avatar,
      };
      return session;
    },
  },
  pages: { signIn: "/signin", error: "/signin" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
