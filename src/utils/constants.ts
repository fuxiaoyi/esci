import { ENGLISH } from "./languages";
import type { ModelSettings } from "../types";

export const GPT_35_TURBO = "gpt-3.5-turbo" as const;
export const GPT_4 = "gpt-4" as const;
export const KFM_alpha = "KFM-alpha" as const;
export const DP_R1_1B = "deepseek-chat" as const;
export const GPT_MODEL_NAMES = [GPT_35_TURBO, GPT_4, KFM_alpha, DP_R1_1B];

export const DEFAULT_MAX_LOOPS_FREE = 25 as const;
export const DEFAULT_MAX_LOOPS_CUSTOM_API_KEY = 10 as const;

export const getDefaultModelSettings = (): ModelSettings => {
  return {
    customApiKey: "sk-aaf88d1c24574bbeac1921b720ab8839",
    language: ENGLISH,
    customModelName: GPT_4,
    customTemperature: 0.1,
    customMaxLoops: DEFAULT_MAX_LOOPS_FREE,
    maxTokens: 8096,
    customThermostability: 0,
    customActivity: 0,
    customPh: 0,
    targetProtein: "",
    targetSubstrate: "",
  };
};
