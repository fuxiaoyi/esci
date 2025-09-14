import { type GetStaticProps, type NextPage } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React, { useEffect, useRef } from "react";

import nextI18NextConfig from "../../next-i18next.config.js";
import HelpDialog from "../components/dialog/HelpDialog.tsx";
import { SignInDialog } from "../components/dialog/SignInDialog.tsx";
import Chat from "../components/index/chat.tsx";
import Landing from "../components/index/landing.tsx";
import MarketingLanding from "../components/MarketingLanding.tsx";
import { useAgent } from "../hooks/useAgent.ts";
import { useAuth } from "../hooks/useAuth.ts";
import { useSettings } from "../hooks/useSettings.ts";
import DashboardLayout from "../layout/dashboard.tsx";
import { AgentApi } from "../services/agent/agent-api.ts";
import { DefaultAgentRunModel } from "../services/agent/agent-run-model.tsx";
import AutonomousAgent from "../services/agent/autonomous-agent.ts";
import { MessageService } from "../services/agent/message-service.ts";
import { useAgentInputStore } from "../stores/agentInputStore.ts";
import {
  resetAllAgentSlices,
  resetAllMessageSlices,
  useAgentStore,
  useMessageStore,
} from "../stores/index.ts";
import { resetAllTaskSlices, useTaskStore } from "../stores/taskStore.ts";
import { toApiModelSettings } from "../utils/interfaces.ts";
import { languages } from "../utils/languages.ts";
import { isEmptyOrBlank } from "../utils/whitespace.ts";

// Import the marketing landing page component

const Home: NextPage = () => {
  const { t } = useTranslation("indexPage");
  const addMessage = useMessageStore.use.addMessage();
  const messages = useMessageStore.use.messages();
  const tasks = useTaskStore.use.tasks();

  const setAgent = useAgentStore.use.setAgent();
  const agentLifecycle = useAgentStore.use.lifecycle();

  const agent = useAgentStore.use.agent();

  const { session, status } = useAuth();
  const nameInput = useAgentInputStore.use.nameInput();
  const setNameInput = useAgentInputStore.use.setNameInput();
  const goalInput = useAgentInputStore.use.goalInput();
  const setGoalInput = useAgentInputStore.use.setGoalInput();
  const { settings } = useSettings();

  const [showSignInDialog, setShowSignInDialog] = React.useState(false);
  const agentUtils = useAgent();

  // Move all hooks to the top before any conditional returns
  const goalInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    goalInputRef?.current?.focus();
  }, []);

  const getAgentDataFromLocalStorage = () => {
    const agentData = localStorage.getItem("agentData");
    return agentData ? (JSON.parse(agentData) as { name: string; goal: string }) : null;
  };

  useEffect(() => {
    if (session !== null) {
      const agentData = getAgentDataFromLocalStorage();

      if (agentData) {
        setNameInput(agentData.name);
        setGoalInput(agentData.goal);
        localStorage.removeItem("agentData");
      }
    }
  }, [session, setGoalInput, setNameInput]);

  // Show marketing page if user is not authenticated
  if (status === "unauthenticated") {
    return <MarketingLanding />;
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const setAgentRun = (newName: string, newGoal: string) => {
    setNameInput(newName);
    setGoalInput(newGoal);
    handlePlay(newGoal);
  };

  const disableStartAgent =
    (agent !== null && !["paused", "stopped"].includes(agentLifecycle)) ||
    isEmptyOrBlank(goalInput);

  const handlePlay = (goal: string) => {
    if (agentLifecycle === "stopped") handleRestart();
    else handleNewAgent(goal.trim());
  };

  const handleNewAgent = (goal: string) => {
    if (session === null) {
      storeAgentDataInLocalStorage("", goal);
      setShowSignInDialog(true);
      return;
    }

    if (agent && agentLifecycle == "paused") {
      agent?.run().catch(console.error);
      return;
    }

    const model = new DefaultAgentRunModel(goal.trim());
    const messageService = new MessageService(addMessage);
    const agentApi = new AgentApi({
      model_settings: toApiModelSettings(settings, session),
      goal: goal,
      session: session,
      agentUtils: agentUtils,
    });
    const newAgent = new AutonomousAgent(
      model,
      messageService,
      settings,
      agentApi,
      session ?? undefined
    );
    setAgent(newAgent);
    newAgent?.run().then(console.log).catch(console.error);
  };

  const storeAgentDataInLocalStorage = (name: string, goal: string) => {
    const agentData = { name, goal };
    localStorage.setItem("agentData", JSON.stringify(agentData));
  };

  const handleRestart = () => {
    resetAllMessageSlices();
    resetAllTaskSlices();
    resetAllAgentSlices();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Only Enter is pressed, execute the function
    if (e.key === "Enter" && !disableStartAgent && !e.shiftKey) {
      handlePlay(goalInput);
    }
  };

  return (
    <DashboardLayout
      onReload={() => {
        agent?.stopAgent();
        handleRestart();
      }}
    >
      <HelpDialog />

      <SignInDialog show={showSignInDialog} setOpen={setShowSignInDialog} />
      <div id="content" className="flex min-h-screen w-full items-center justify-center">
        <div
          id="layout"
          className="relative flex h-screen w-full max-w-screen-md flex-col items-center justify-center gap-5 overflow-hidden p-2 py-10 sm:gap-3 sm:p-4"
        >
          {agent !== null ? (
            <Chat
              messages={messages}
              disableStartAgent={disableStartAgent}
              handlePlay={handlePlay}
              nameInput={nameInput}
              goalInput={goalInput}
              setShowSignInDialog={setShowSignInDialog}
              setAgentRun={setAgentRun}
            />
          ) : (
            <Landing
              messages={messages}
              disableStartAgent={disableStartAgent}
              handlePlay={() => handlePlay(goalInput)}
              handleKeyPress={handleKeyPress}
              goalInputRef={goalInputRef}
              goalInput={goalInput}
              setGoalInput={setGoalInput}
              setShowSignInDialog={setShowSignInDialog}
              setAgentRun={setAgentRun}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  const supportedLocales = languages.map((language) => language.code);
  const chosenLocale = supportedLocales.includes(locale) ? locale : "en";

  return {
    props: {
      ...(await serverSideTranslations(chosenLocale, nextI18NextConfig.ns)),
    },
  };
};
