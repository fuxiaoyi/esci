import { message } from "antd";
import clsx from "clsx";
import type { GetServerSidePropsContext } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import type { BuiltInProviderType } from "next-auth/providers";
import type { ClientSafeProvider } from "next-auth/react";
import { getProviders, signIn, useSession } from "next-auth/react";
import type { LiteralUnion } from "next-auth/react/types";
import React, { useState } from "react";
import { FaDiscord, FaGithub, FaGoogle } from "react-icons/fa";

import FadeIn from "../components/motions/FadeIn";
import GridLayout from "../layout/grid";
import { authOptions } from "../server/auth/auth";
import type { Recordable } from "../types/global";
import Input from "../ui/input";

const SignIn = ({ providers }: { providers: Provider }) => {
  const { data: session } = useSession();
  const { push } = useRouter();

  if (session) push("/").catch(console.error);

  const details = Object.values(providers)
    .map((provider) => providerButtonDetails[provider.id])
    .filter((detail): detail is ButtonDetail => detail !== undefined);

  return (
    <GridLayout title="Sign in - Edge Science">
      <div className="grid h-screen w-screen place-items-center bg-gradient-radial from-slate-1 via-20% to-transparent">
        <div className="flex h-full w-full max-w-screen-lg flex-col items-center justify-center gap-10">
          <FadeIn
            duration={1.5}
            initialY={-50}
            className="flex flex-col items-center justify-center gap-6 text-white"
          >
            <div className="flex flex-col items-center justify-center gap-16">
              <Image src="/logos/E. Copi.png" width="150" height="150" alt="Kongfoo AI" />
              <h1 className="bg-gradient-to-t from-white via-neutral-300 to-neutral-500 bg-clip-text text-center text-3xl font-bold leading-[1.1em] tracking-[-0.64px] text-transparent invert md:text-5xl">
                ELN Copilot
              </h1>
            </div>
          </FadeIn>
          <FadeIn duration={1.5} delay={0.4} initialY={50}>
            {providers.credentials && <InsecureSignin />}
            {details.map((detail) => (
              <ProviderSignInButton key={detail.id} detail={detail} />
            ))}
          </FadeIn>
        </div>
      </div>
    </GridLayout>
  );
};

const InsecureSignin = () => {
  const router = useRouter();
  const inviteCode = router.query.inviteCode
  const [name, setName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userNotExists, setUserNotExists] = useState(false);
  
  const labelWidth = "60px"
  let loginIng = false
  
  const redirectToStripePayment = () => {
    const stripePaymentUrl = `/api/payments/create-checkout?email=${encodeURIComponent(email)}`;
    window.location.href = stripePaymentUrl;
  };

  const login = () => {
    if (!email || !password) return
    if (inviteCode && !name) return
    if (loginIng) return

    const params = {
      callbackUrl: "/",
      email: email,
      password: password,
      redirect: false
    } as Recordable<any>

    if (inviteCode) {
      params.inviteCode = inviteCode
    }

    if (name) {
      params.name = name
    }

    loginIng = true
    setUserNotExists(false);
    
    signIn("credentials", params)
      .then(res => {
        loginIng = false

        if (res?.ok) {
          void message.success("登录成功")
        } else {
          if (res?.error === "用户不存在") {
            setUserNotExists(true);
            void message.error("用户不存在，请注册");
          } else {
            void message.error(res?.error)
          }
        }
      })
      .catch(error => {
        loginIng = false
      });
  }

  return (
    <div className="flex flex-col" style={{ width: "350px" }}>
      {inviteCode && (
        <div className="mb-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入您的用户名"
            type="text"
            name="Name Field"
            label="用户名"
            labelWidth={labelWidth}
            inline
          />
        </div>
      )}
      <Input
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setUserNotExists(false);
        }}
        placeholder="请输入您的用户邮箱"
        type="text"
        name="Email Field"
        label="邮箱"
        labelWidth={labelWidth}
        inline
      />
      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="请输入密码"
        type="password"
        name="Password Field"
        label="密码"
        labelWidth={labelWidth}
        inline
      />
      <button
        disabled={loginIng}
        onClick={login}
        className={clsx(
          "mb-4 mt-4 rounded-md bg-slate-12 px-10 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-slate-10 sm:text-base",
          ((!email || !password) || (inviteCode && !name)) && "cursor-not-allowed"
        )}
      >
        登录
      </button>
      
      {userNotExists && (
        <button
          onClick={redirectToStripePayment}
          className="mb-4 rounded-md bg-green-600 px-10 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-green-700 sm:text-base"
        >
          注册付费账户
        </button>
      )}
    </div>
  );
};

type Provider = Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider>;

interface ButtonDetail {
  id: string;
  icon: JSX.Element;
  color: string;
}

const providerButtonDetails: { [key: string]: ButtonDetail } = {
  google: {
    id: "google",
    icon: <FaGoogle className="mr-2" />,
    color: "bg-white hover:bg-gray-200 text-black",
  },
  discord: {
    id: "discord",
    icon: <FaDiscord className="mr-2" />,
    color: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  github: {
    id: "github",
    icon: <FaGithub className="mr-2" />,
    color: "bg-gray-800 hover:bg-gray-900 text-white",
  },
};

const ProviderSignInButton = ({ detail }: { detail: ButtonDetail }) => {
  return (
    <button
      onClick={() => {
        signIn(detail.id, { callbackUrl: "/" }).catch(console.error);
      }}
      className={clsx(
        detail.color,
        "mb-4 flex w-full items-center rounded-md px-10 py-3 text-base font-semibold shadow-md transition-colors duration-300 sm:px-16 sm:py-5 sm:text-xl"
      )}
    >
      {detail.icon}
      Sign in with {detail.id}
    </button>
  );
};

export default SignIn;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  return {
    props: { providers: (await getProviders()) ?? {} },
  };
}