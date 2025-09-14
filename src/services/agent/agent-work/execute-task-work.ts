import { v1 } from "uuid";

import type AgentWork from "./agent-work";
import type { Message } from "../../../types/message";
import type { Task } from "../../../types/task";
import { toApiModelSettings } from "../../../utils/interfaces";
import type { Analysis } from "../analysis";
import type AutonomousAgent from "../autonomous-agent";

export default class ExecuteTaskWork implements AgentWork {
  result = "";

  constructor(private parent: AutonomousAgent, private task: Task, private analysis: Analysis) {}

  run = () => {
    const executionMessage: Message = {
      ...this.task,
      id: v1(),
      status: "completed",
      info: "Loading...",
    };
    this.parent.messageService.sendMessage({ ...executionMessage, status: "completed" });

    // Echo what would be sent to /agent/execute instead of making the actual call
    const executeData = {
      run_id: this.parent?.api?.runId,
      goal: this.parent?.model?.getGoal(),
      task: this.task.value,
      analysis: this.analysis,
      model_settings: toApiModelSettings(this.parent.modelSettings, this.parent.session),
    };

    // Simulate the streaming response by echoing the data
    executionMessage.info = "";
    
    // Echo the request data as the response
    const echoText = `Echoing request to /agent/execute:\n${JSON.stringify(executeData, null, 2)}`;
    
    // Simulate streaming by updating the message with the echo text
    executionMessage.info = echoText;
    const updatedTask = this.parent?.model?.updateTaskResult(this.task, executionMessage.info || "");
    this.task = updatedTask ?? this.task;
    this.parent?.messageService?.updateMessage(executionMessage);

    this.result = executionMessage.info || "";
    console.log('ExecuteTaskWork result (echo):', this.result);
    this.parent.api.saveMessages([executionMessage]);
    if (this.parent.model) {
      this.task = this.parent.model.updateTaskStatus(this.task, "completed");
    }
    
    return Promise.resolve();
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  conclude = async () => void 0;

  next = () => undefined;

  onError = (e: unknown): boolean => {
    this.parent.messageService.sendErrorMessage(e);
    return true;
  };
}
