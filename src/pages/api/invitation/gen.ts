import type { NextApiRequest, NextApiResponse } from "next";
import { v4 } from "uuid";

import { prisma } from "../../../server/db";
import R from "../../../utils/r";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const list = Array(5).fill("").map(item => ({
    code: v4(),
    status: 'unUse',
  }));

  await prisma.invitation.createMany({
    data: list
  });

  return res.json(R.success());
}
