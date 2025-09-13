import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useAgentStore } from "../stores";

const Tool = z.object({
  name: z.string(),
  description: z.string(),
  color: z.string(),
  image_url: z.string().optional(),
});

const ToolsResponseSchema = z.object({
  tools: z.array(Tool),
});

const ActiveToolSchema = Tool.extend({
  active: z.boolean(),
});

export type ActiveTool = z.infer<typeof ActiveToolSchema>;

const loadTools = (key: string) => {
  // Hardcoded tools instead of remote API call
  const hardcodedTools = [
    {
      name: "alignment",
      description: "Sequence alignment tool",
      color: "blue",
      image_url: undefined
    },
    {
      name: "structure cleaning", 
      description: "Protein structure cleaning and preparation",
      color: "green",
      image_url: undefined
    },
    {
      name: "folding",
      description: "Protein folding prediction",
      color: "purple", 
      image_url: undefined
    },
    {
      name: "docking",
      description: "Molecular docking simulations",
      color: "orange",
      image_url: undefined
    },
    {
      name: "storytelling",
      description: "Scientific storytelling and explanation",
      color: "pink",
      image_url: undefined
    }
  ];

  const allTools = ToolsResponseSchema.parse({ tools: hardcodedTools });

  const data = localStorage.getItem(key);
  let activeTools: ActiveTool[] = [];

  try {
    const obj = z.array(ActiveToolSchema).parse(JSON.parse(data ?? ""));
    activeTools = allTools.tools.map((db_tool) => {
      const tool = obj.find((t) => t.name === db_tool.name);
      return tool ?? { ...db_tool, active: false };
    });
  } catch (error) {
    activeTools = allTools.tools.map((toolModel) => ({ ...toolModel, active: false }));
  }

  return activeTools;
};

const save = (key: string, data: object) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export function useTools() {
  const setTools = useAgentStore.use.setTools();

  const queryClient = useQueryClient();
  const query = useQuery(["tools"], () => loadTools("tools"), {
    onSuccess: (data) => {
      updateActiveTools(data);
    },
  });

  function updateActiveTools(data: ActiveTool[]) {
    save("tools", data);
    setTools(data.filter((tool) => tool.active));
  }

  const setToolActive = (toolName: string, active: boolean) => {
    queryClient.setQueriesData(["tools"], (old) => {
      const data = (old as ActiveTool[]).map((tool) =>
        tool.name === toolName ? { ...tool, active } : tool
      );

      updateActiveTools(data);
      return data;
    });
  };

  return {
    activeTools: query.data ?? [],
    setToolActive,
    isSuccess: query.isSuccess,
  };
}
