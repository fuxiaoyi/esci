import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { serverEnv } from "../../env/schema.mjs";
import { supabaseAuth } from "../../lib/supabase-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: serverEnv.GOOGLE_CLIENT_ID ?? "",
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: serverEnv.GITHUB_CLIENT_ID ?? "",
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    DiscordProvider({
      clientId: serverEnv.DISCORD_CLIENT_ID ?? "",
      clientSecret: serverEnv.DISCORD_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { user } = await supabaseAuth.signInWithEmail(
            credentials.email,
            credentials.password
          );

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email,
              image: user.user_metadata?.avatar_url,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
