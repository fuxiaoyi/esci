import React from "react";

import { ExampleAgentButton } from "./ExampleAgentButton";
import FadeIn from "../motions/FadeIn";

type ExampleAgentsProps = {
  setAgentRun?: (name: string, goal: string) => void;
  setShowSignIn: (show: boolean) => void;
};

const ExampleAgents = ({ setAgentRun }: ExampleAgentsProps) => {

  return (
    <>
      <FadeIn delay={0.9} duration={0.5}>
        <div className="my-2 grid grid-cols-1 items-stretch gap-2 sm:my-4 sm:grid-cols-3">
          <ExampleAgentButton name="商业分析代理" setAgentRun={setAgentRun}>
          计算生物合成熊果酸的PMI
          </ExampleAgentButton>

          <ExampleAgentButton name="科普故事代理" setAgentRun={setAgentRun}>
          以“折叠未来：人工智能如何重塑蛋白质工程”为题，写一篇公众号
          </ExampleAgentButton>

          <ExampleAgentButton name="定向改造代理" setAgentRun={setAgentRun}>
          使用MPNN改造EstCE1，给出10个热稳定性更好的变体及可信性
          </ExampleAgentButton>
        </div>
      </FadeIn>
    </>
  );
};

export default ExampleAgents;
