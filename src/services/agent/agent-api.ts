import type { Session } from "next-auth";

import type { Analysis } from "./analysis";
import type { AgentUtils } from "../../hooks/useAgent";
import { useAgentStore } from "../../stores";
import type { Message } from "../../types/message";
import type { RequestBody } from "../../utils/interfaces";
import * as apiUtils from "../api-utils";

type Agent = {
  id: string;
  userId: string;
  name: string;
  goal: string;
  deleteDate?: Date;
  createDate: Date;
};

type ApiProps = Pick<RequestBody, "model_settings" | "goal"> & {
  session?: Session;
  agentUtils: AgentUtils;
};

export class AgentApi {
  readonly props: ApiProps;
  agentId: string | undefined;
  runId: string | undefined;
  agent: Agent | undefined;

  constructor(apiProps: ApiProps) {
    this.props = apiProps;
  }

  async createAgent(): Promise<void> {
    if (this.agentId) return;
    const agent = await this.props.agentUtils.createAgent({
      goal: this.props.goal,
    });
    this.agent = agent
    this.agentId = agent?.id;
  }

  updateAgentGoal(goal) {
    if(this.agent) {
      this.agent.goal = goal
    }
  }

  saveMessages(messages: Message[]): void {
    if (!this.agentId) return;

    this.props.agentUtils.saveAgent({
      id: this.agentId,
      tasks: messages,
    });
  }

  async getInitialTasks(): Promise<string[]> {
    const { model_settings, goal } = this.props;
    
    if (!model_settings.custom_api_key || !model_settings.custom_api_key.trim()) {
      throw new Error("DeepSeek API key is required. Please provide a valid API key in the settings.");
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${model_settings.custom_api_key}`,
      },
      body: JSON.stringify({
        model: model_settings.model,
        messages: [
          {
            role: "system",
            content: `You are an AI task planning assistant. Given a goal, generate a list of specific, actionable tasks. Return ONLY a JSON array of task strings like: ["task 1", "task 2", "task 3"]`
          },
          {
            role: "user", 
            content: `Goal: ${goal}. Generate initial tasks as a JSON array.`
          }
        ],
        temperature: model_settings.temperature,
        max_tokens: model_settings.max_tokens,
      }),
    });

    if (!response.ok) {
      let errorMessage = `DeepSeek API error: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = `DeepSeek API error: ${errorData.error.message}`;
        } else if (errorData.error?.type) {
          errorMessage = `DeepSeek API error: ${errorData.error.type}`;
        }
      } catch {
        // If we can't parse the error response, use the status text
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in DeepSeek response");
    }

    try {
      const tasks = JSON.parse(content);
      if (Array.isArray(tasks) && tasks.every(task => typeof task === 'string')) {
        return tasks;
      }
      throw new Error("Invalid task format from DeepSeek");
    } catch {
      throw new Error("Failed to parse tasks from DeepSeek response");
    }
  }

  async getAdditionalTasks(
    tasks: {
      current: string;
      completed: string[];
      remaining: string[];
    },
    result: string
  ): Promise<string[]> {
    return (
      await this.post<{ newTasks: string[] }>("/agent/create", {
        result: result,
        last_task: tasks.current,
        tasks: tasks.remaining,
        completed_tasks: tasks.completed,
      })
    ).newTasks;
  }

  async analyzeTask(task: string): Promise<Analysis> {
    const { model_settings, goal } = this.props;
    
    if (!model_settings.custom_api_key || !model_settings.custom_api_key.trim()) {
      throw new Error("DeepSeek API key is required. Please provide a valid API key in the settings.");
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${model_settings.custom_api_key}`,
      },
      body: JSON.stringify({
        model: model_settings.model,
        messages: [
          {
            role: "system",
            content: `You are an AI task analysis assistant. Given a goal and a task, analyze what action to take next. Return ONLY a JSON object with: {"reasoning": "your reasoning", "action": "action_type", "arg": "argument"}. 
            
            Available actions: 
            - "alignment": Align the AA structure to sequence
            - "structure cleaning": Remove non-cofactors from structure
            - "folding": Predict structure
            - "docking": Compute molecular docking score
            - "storytelling": Storytelling
            
            Example response: {"reasoning": "I need to research this topic first", "action": "docking", "arg": "NTDFEQSD"}`
          },
          {
            role: "user", 
            content: `Goal: ${goal}. Task: ${task}. Analyze what action to take next.`
          }
        ],
        temperature: model_settings.temperature,
        max_tokens: model_settings.max_tokens,
      }),
    });

    if (!response.ok) {
      let errorMessage = `DeepSeek API error: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = `DeepSeek API error: ${errorData.error.message}`;
        } else if (errorData.error?.type) {
          errorMessage = `DeepSeek API error: ${errorData.error.type}`;
        }
      } catch {
        // If we can't parse the error response, use the status text
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in DeepSeek response");
    }

    try {
      const analysis = JSON.parse(content);
      // Validate the analysis structure
      console.log('Analysis:', analysis);
      if (analysis.reasoning && analysis.action && analysis.arg) {
        return analysis as Analysis;
      }
      throw new Error("Invalid analysis format from DeepSeek");
    } catch {
      throw new Error("Failed to parse analysis from DeepSeek response");
    }
  }

  private async post<T>(
    url: string,
    data: Omit<RequestBody, "goal" | "model_settings" | "run_id">
  ) {
    const requestBody: RequestBody = {
      model_settings: this.props.model_settings,
      goal: this.props.goal,
      run_id: this.runId,
      ...data,
    };

    try {
      useAgentStore.getState().setIsAgentThinking(true);
      const { run_id, ...data } = await apiUtils.post<T & { run_id: string }>(
        url,
        requestBody,
        this.props.session
      );

      if (this.runId === undefined) this.runId = run_id;
      return data;
    } finally {
      useAgentStore.getState().setIsAgentThinking(false);
    }
  }
}
