export type Analysis = {
  reasoning: string;
  action: "alignment" | "structure cleaning" | "folding" | "docking" | "storytelling" | "conclude";
  arg: string;
};
