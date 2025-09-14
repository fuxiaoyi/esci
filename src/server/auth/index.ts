import type { IncomingMessage, ServerResponse } from "http";

import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";

import { authOptions as supabaseAuthOptions } from "./supabase-auth";

export const authOptions = (
  req: NextApiRequest | IncomingMessage,
  res: NextApiResponse | ServerResponse
): AuthOptions => {
  return supabaseAuthOptions;
};

/**
 * Wrapper for getServerSession so that you don't need
 * to import the authOptions in every file.
 * @see https://next-auth.js.org/configuration/nextjs
 **/
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions(ctx.req, ctx.res));
};
