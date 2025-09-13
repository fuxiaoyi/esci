import { type Language } from "../utils/languages";

export const [GPT_35_TURBO, GPT_35_TURBO_16K, GPT_4, KFM_alpha, DP_R1_1B] = [
  "gpt-3.5-turbo" as const,
  "gpt-3.5-turbo-16k" as const,
  "gpt-4" as const,
  "KFM-alpha" as const,
  "deepseek-chat" as const,
];
export const GPT_MODEL_NAMES = [GPT_35_TURBO, GPT_35_TURBO_16K, GPT_4, KFM_alpha, DP_R1_1B];
export type GPTModelNames = "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gpt-4" | "KFM-alpha" | "deepseek-chat";

export const MAX_TOKENS: Record<GPTModelNames, number> = {
  "gpt-3.5-turbo": 4000,
  "gpt-3.5-turbo-16k": 16000,
  "gpt-4": 4000,
  "KFM-alpha": 4000,
  "deepseek-chat": 128000,
};

// export const [KFM_alpha] = [
//   "KFM-alpha" as const,
// ];
// export const GPT_MODEL_NAMES = [KFM_alpha];
// export type GPTModelNames = "KFM-alpha";

// export const MAX_TOKENS: Record<GPTModelNames, number> = {
//   "KFM-alpha": 4000,
// };

export interface ModelSettings {
  language: Language;
  customApiKey: string;
  customModelName: GPTModelNames;
  customTemperature: number;
  customThermostability: number;
  customActivity: number;
  customPh: number;
  targetProtein: string;
  targetSubstrate: string;
  customMaxLoops: number;
  maxTokens: number;
}
