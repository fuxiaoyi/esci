import type { NextApiRequest, NextApiResponse } from "next";
import { v4 } from "uuid";

import { supabaseDb } from "../../../lib/supabase-db";
import R from "../../../utils/r";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const codes = Array(5).fill("").map(() => v4());

  for (const code of codes) {
    await supabaseDb.createInvitation(code);
  }

  return res.json(R.success());
}
