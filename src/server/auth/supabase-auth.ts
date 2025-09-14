import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { serverEnv } from "../../env/schema.mjs";
import { supabaseAuth } from "../../lib/supabase-auth";
import { supabaseDb } from "../../lib/supabase-db";
import { logger } from "../../utils/logger";

export const authOptions: NextAuthOptions = {
  secret: serverEnv.NEXTAUTH_SECRET,
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
        inviteCode: { label: "Invite Code", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials, req) {
        const { email, password, inviteCode, name } = credentials || {};

        if (!email) {
          throw new Error("邮箱不能为空");
        }
        if (!password) {
          throw new Error("密码不能为空");
        }

          // 没有邀请码，走登录流程
          if (!inviteCode) {
            try {
              // 使用 Supabase 进行邮箱密码登录
              const { user: supabaseUser, session } = await supabaseAuth.signInWithEmail(email, password);
              
              if (!supabaseUser) {
                throw new Error("登录失败");
              }

              // 用户通过 Supabase Auth 登录成功，直接返回用户信息
              logger.info("用户登录", supabaseUser);
              return {
                id: supabaseUser.id,
                email: supabaseUser.email || email,
                name: supabaseUser.user_metadata?.name || email,
                image: supabaseUser.user_metadata?.avatar_url,
              };
            } catch (error) {
              throw new Error("登录失败: " + (error instanceof Error ? error.message : String(error)));
            }
          }

        // 有邀请码，走注册流程
        const invitation = await supabaseDb.getInvitationByCode(inviteCode);
        // 邀请码在库里不存在
        if (!invitation) {
          throw new Error("邀请码不存在");
        }
        // 邀请码已使用
        if (invitation.status === "used") {
          throw new Error("邀请码已被使用");
        }
        // 判断邮箱是否已经注册过
        let user = await supabaseDb.getUserByEmail(email);
        if (user) {
          throw new Error("邮箱已注册");
        }

        // 判断用户名是否已存在
        if (name) {
          const existingUser = await supabaseDb.getUserByEmail(name);
          if (existingUser) {
            throw new Error("用户名已存在");
          }
        }

        try {
          // 使用 Supabase 进行邮箱注册
          const { user: supabaseUser, session } = await supabaseAuth.signUpWithEmail(email, password, { 
            name: name || email,
            invite_code: inviteCode 
          });
          
          if (!supabaseUser) {
            throw new Error("注册失败");
          }

          // 更新库里邀请码状态
          await supabaseDb.updateInvitationStatus(invitation.id, "used");

          logger.info("用户注册并登录", supabaseUser);
          return {
            id: supabaseUser.id,
            email: supabaseUser.email || email,
            name: supabaseUser.user_metadata?.name || name || email,
            image: supabaseUser.user_metadata?.avatar_url,
          };
        } catch (error) {
          throw new Error("注册失败: " + (error instanceof Error ? error.message : String(error)));
        }
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
      if (token.id) {
        session.user.id = token.id as string;
        
        // Initialize default values
        session.user.superAdmin = false;
        session.user.organizations = [];
        
        // Get user details from Supabase
        try {
          const user = await supabaseDb.getUserById(token.id as string);
          if (user) {
            session.user.superAdmin = user.superAdmin;
            
            // Get user organizations
            const organizations = await supabaseDb.getUserOrganizations(user.id);
            session.user.organizations = organizations.map(org => ({
              id: org.organizationId,
              name: org.organizationId, // You might want to fetch organization name separately
              role: org.role,
            }));
          }
        } catch (error) {
          console.error("Session callback error:", error);
          // Keep the default values set above
        }
      }
      return session;
    },
  },
};
