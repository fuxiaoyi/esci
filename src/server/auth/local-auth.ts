import type { IncomingMessage, ServerResponse } from "http";

import { getCookie, setCookie } from "cookies-next";
import type { NextApiRequest, NextApiResponse } from "next";
import type { AuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { v4 } from "uuid";

import { supabaseAuth } from "../../lib/supabase-auth";
import { logger } from "../../utils/logger";
import { prisma } from "../db";

// req.body 的类型
type ReqBody = {
  email: string;
  password: string;
  inviteCode: string;
  name: string;
};
const monthFromNow = () => {
  const now = new Date(Date.now());
  return new Date(now.setMonth(now.getMonth() + 1));
};

function cookieToString(cookie: string | undefined | null | boolean) {
  switch (typeof cookie) {
    case "boolean":
      return cookie.toString();
    case "string":
      return cookie;
    default:
      return "";
  }
}

export const options = (
  adapter: Adapter,
  req: NextApiRequest | IncomingMessage,
  res: NextApiResponse | ServerResponse
): AuthOptions => {
  return {
    adapter,
    providers: [
      Credentials({
        name: "Username, Development Only (Insecure)",
        credentials: {
          name: { label: "Username", type: "text" },
          superAdmin: { label: "SuperAdmin", type: "text" },
        },
        async authorize(credentials, req) {
          // 从请求体获取 邮箱、密码、邀请码 用户名
          const { email, password, inviteCode, name } = req.body as ReqBody;

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
              const { data, error } = await supabaseAuth.signInWithEmail(email, password);
              
              if (error) {
                throw new Error(error.message);
              }

              // 根据邮箱查询用户
              const user = await adapter.getUserByEmail(email);
              if (!user) {
                throw new Error("用户不存在");
              }

              logger.info("用户登录", user);
              return user;
            } catch (error) {
              throw new Error("登录失败: " + (error instanceof Error ? error.message : String(error)));
            }
          }

          // 有邀请码，走注册流程
          const invitation = await prisma.invitation.findFirst({
            where: {
              code: inviteCode
            }
          })
          // 邀请码在库里不存在
          if (!invitation) {
            throw new Error("邀请码不存在");
          }
          // 邀请码已使用
          if (invitation.status === "used") {
            throw new Error("邀请码已被使用");
          }
          // 判断邮箱是否已经注册过
          let user = await prisma.user.findFirst({
            where: {
              email: email
            }
          })
          if (user) {
            throw new Error("邮箱已注册");
          }

          // 判断用户名是否已存在
          user = await prisma.user.findFirst({
            where: {
              name: name
            }
          })
          if (user) {
            throw new Error("用户名已存在");
          }

          try {
            // 使用 Supabase 进行邮箱注册
            const { data, error } = await supabaseAuth.signUpWithEmail(email, password, { name });
            
            if (error) {
              throw new Error(error.message);
            }

            // 先往数据库添加用户
            await prisma.user.create({
              data: {
                name,
                email,
                inviteCode
              }
            })

            // 更新库里邀请码状态
            await prisma.invitation.update({
              where: {
                id: invitation.id
              },
              data: {
                status: "used"
              }
            })

            // 根据邮箱查询用户
            const newUser = await adapter.getUserByEmail(email)

            logger.info("用户注册并登录", newUser);
            return newUser;
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
      // Fallback to base url if provided url is not a subdirectory
      redirect: (params: { url: string; baseUrl: string }) =>
        params.url.startsWith(params.baseUrl) ? params.url : params.baseUrl,

      async signIn({ user }) {
        if (user) {
          const session = await adapter.createSession({
            sessionToken: v4(),
            userId: user.id,
            expires: monthFromNow(),
          });

          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          setCookie("next-auth.session-token", session.sessionToken, {
            expires: session.expires,
            req: req,
            res: res,
          });
        }

        return true;
      },
    },
    jwt: {
      encode: () => {
        const cookie = getCookie("next-auth.session-token", {
          req: req,
          res: res,
        });

        return cookieToString(cookie);
      },
      decode: () => {
        return null;
      },
    },
  };
};
