import { v1 } from "uuid";


import type AgentWork from "./agent-work";
import type { Message } from "../../../types/message";
import { getCozeAnswerContent } from "../../../utils/coze-api";
import { toApiModelSettings } from "../../../utils/interfaces";
import { streamText } from "../../stream-utils";
import type AutonomousAgent from "../autonomous-agent";

export default class SummarizeWork implements AgentWork {
  constructor(private parent: AutonomousAgent) {}

  run = async () => {
    if (!this.parent.model || !this.parent.api.runId) return;
    
    const executionMessage: Message = {
      type: "task",
      status: "completed",
      value: `Converting "${this.parent.model.getGoal()}" into a podcast.`,
      id: v1(),
      info: "播客制作中...",
    };
    this.parent.messageService.sendMessage({ ...executionMessage });

    const results = this.parent.model
      .getCompletedTasks()
      .filter((task) => task.result && task.result !== "")
      .map((task) => task.result || "")
      .join("\n\n");

    const input = `Please summarize the following results for the goal "${this.parent.model.getGoal()}":\n\n${results}`;

    try {
      const summary = await getCozeAnswerContent(
        input,
        this.parent.api.runId,
        undefined,
        undefined
      );

      console.log('Final summary content:', summary ? 
        (summary.substring(0, 50) + (summary.length > 50 ? '...' : '')) : 'null');

      if (summary === null) {
        throw new Error('Failed to get summary (null response)');
      }

      if (summary && summary.trim()) {
        executionMessage.info = summary;
        console.log('Summary content:', summary);
        this.parent.messageService.updateMessage(executionMessage);
      } else {
        console.error('Empty summary content received from Coze API');
        executionMessage.info = 'Sorry, I couldn\'t generate a proper summary. Please try again.';
        this.parent.messageService.updateMessage(executionMessage);
      }
    } catch (error) {
      this.onError(error);
    }

    this.parent.api.saveMessages([executionMessage]);
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  conclude = async () => void 0;

  next = () => undefined;

  onError = (e: unknown): boolean => {
    this.parent.messageService.sendErrorMessage(e);
    return true;
  };
}
