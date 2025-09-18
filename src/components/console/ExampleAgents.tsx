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
          <ExampleAgentButton name="Business Analysis Agent" setAgentRun={setAgentRun}>
          Derive the ROI of a ursolic acid based on the experimental data. 
          </ExampleAgentButton>

          <ExampleAgentButton name="Enzyme Design Agent" setAgentRun={setAgentRun}>
          Generate 10 novel LDH (Lactate Dehydrogenase) enzyme with high catalytic efficiency.
          </ExampleAgentButton>

          <ExampleAgentButton name="Teaching Assistant Agent" setAgentRun={setAgentRun}>
          Comment my experiment protocol for this part characterization.
          </ExampleAgentButton>
        </div>
      </FadeIn>
    </>
  );
};

export default ExampleAgents;
