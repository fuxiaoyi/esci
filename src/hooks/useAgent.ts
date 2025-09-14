import { useAuth } from "./useAuth";
import type { CreateAgentProps, SaveAgentProps } from "../server/api/routers/agentRouter";
import { api } from "../utils/api";

type Agent = {
  id: string;
  userId: string;
  name: string;
  goal: string;
  deleteDate?: Date;
  createDate: Date;
};

export type AgentUtils = {
  createAgent: (data: CreateAgentProps) => Promise<Agent | undefined>;
  saveAgent: (data: SaveAgentProps) => void;
};

export function useAgent(): AgentUtils {
  const { status } = useAuth();
  const utils = api.useContext();

  const createMutation = api.agent.create.useMutation({
    onSuccess: (data: Agent) => {
      utils.agent.getAll.setData(void 0, (oldData) => [data, ...(oldData ?? [])]);
      return data;
    },
  });
  const createAgent = async (data: CreateAgentProps): Promise<Agent | undefined> => {
    if (status === "authenticated") {
      return await createMutation.mutateAsync(data);
    } else {
      return undefined;
    }
  };

  const saveMutation = api.agent.save.useMutation();
  const saveAgent = (data: SaveAgentProps) => {
    if (status === "authenticated") saveMutation.mutate(data);
  };

  return {
    createAgent,
    saveAgent,
  };
}
