import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";
import { API_BASE_URL } from "./api";

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
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
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
