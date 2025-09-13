import type { NextApiRequest, NextApiResponse } from "next";


import { sendVerifyEmail } from "../../../utils/email";
import pattern from "../../../utils/pattern";
import R from "../../../utils/r";
import { redisClient } from "../../../utils/redis";



interface EmailRequestBody {
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body as EmailRequestBody;

  if (!email) {
    return res.json(
      R.fail('请输入邮箱')
    );
  }

  if (!pattern.email.test(email)) {
    return res.json(
      R.fail('请输入正确的邮箱')
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 将验证码存入 Redis，设置过期时间为 5 分钟（300 秒）
  await redisClient.setEx(email, 300, code);
  await sendVerifyEmail(email, code)

  return res.json(R.success());
}
