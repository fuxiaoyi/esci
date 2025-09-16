import { message } from "antd";
import type { GetStaticProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import type { BuiltInProviderType } from "next-auth/providers";
import type { ClientSafeProvider } from "next-auth/react";
import { getProviders, signIn, useSession, getSession } from "next-auth/react";
import type { LiteralUnion } from "next-auth/react/types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React, { useState } from "react";
import { FaDiscord, FaGithub, FaGoogle } from "react-icons/fa";

import nextI18NextConfig from "../../next-i18next.config.js";
import GridLayout from "../layout/grid";
import Input from "../ui/input";
import { languages } from "../utils/languages";


const SignIn = ({ providers }: { providers: Provider }) => {
  const { data: session } = useSession();
  const { push } = useRouter();

  if (session) {
    void push("/").catch(console.error);
  }

  const details = Object.values(providers)
    .map((provider) => providerButtonDetails[provider.id])
    .filter((detail): detail is ButtonDetail => detail !== undefined);

  return (
    <GridLayout title="Sign in - Edge Science">
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-6 inline-flex items-center space-x-2">
              <Image src="/logos/E. Copi.png" width="40" height="40" alt="E. Copi Logo" />
              <span className="text-2xl font-bold tracking-tight relative inline-flex items-center">
                ELN Copilot
                <span className="text-darkGreen-600">.</span>
              </span>
            </div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-gray-600">
                Sign in to continue your enzyme design journey
              </p>
            </div>
          </div>

          <SupabaseSignin />
          
          {details.length > 0 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {details.map((detail) => (
                  <ProviderSignInButton key={detail.id} detail={detail} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GridLayout>
  );
};

const SupabaseSignin = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      } else if (result?.ok) {
        void message.success("Login successful");
        // Refresh the session to ensure NextAuth picks up the new authentication
        await getSession();
        // Use router.replace to avoid adding to history stack
        void router.replace("/");
      } else {
        throw new Error("Login failed. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again.";
      void message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Email address</label>
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 px-4 border-gray-300 focus:border-darkGreen-500 focus:ring-darkGreen-500"
          required
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Password</label>
        <Input
          name="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 px-4 border-gray-300 focus:border-darkGreen-500 focus:ring-darkGreen-500"
          required
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full h-11 bg-darkGreen-600 hover:bg-darkGreen-700 text-white font-medium text-base shadow-sm hover:shadow-md transition-all duration-200 rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : null}
        Sign in
      </button>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">
          Don&apos;t have an account? Please email{" "}
          <a 
            href="mailto:dev@kongfoo.cn" 
            className="font-medium text-darkGreen-600 hover:text-darkGreen-700 transition-colors"
          >
            dev@kongfoo.cn
          </a>
        </p>
      </div>
    </form>
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
      className="w-full h-11 flex items-center justify-center gap-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium transition-colors duration-200"
    >
      {detail.icon}
      Continue with {detail.id}
    </button>
  );
};

export default SignIn;

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  const supportedLocales = languages.map((language) => language.code);
  const chosenLocale = supportedLocales.includes(locale) ? locale : "en";

  return {
    props: {
      providers: (await getProviders()) ?? {},
      ...(await serverSideTranslations(chosenLocale, nextI18NextConfig.ns)),
    },
  };
};
