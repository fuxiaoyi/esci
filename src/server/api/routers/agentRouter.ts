import OpenAI from "openai";
import { z } from "zod";

import { env } from "../../../env/server.mjs";
import { messageSchema } from "../../../types/message";
import { MESSAGE_TYPE_TASK } from "../../../types/task";
import { supabaseDb } from "../../../lib/supabase-db";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const createAgentParser = z.object({
  goal: z.string(),
});

export type CreateAgentProps = z.infer<typeof createAgentParser>;

const saveAgentParser = z.object({
  id: z.string(),
  tasks: z.array(messageSchema),
});
export type SaveAgentProps = z.infer<typeof saveAgentParser>;

async function generateAgentName(goal: string) {
  if (!env.OPENAI_API_KEY) return undefined;

  try {
    const openAI = new OpenAI({
      apiKey: env.OPENAI_API_KEY ,
    });

    const chatCompletion = await openAI.chat.completions.create({
      messages: [
        {
          role: "user",
          content: goal,
        },
        {
          role: "system",
          content: `Summarize this into one or two words followed by "GPT" and a single emoji.
           Examples:
           - 'I want to buy a house' becomes HouseGPT 🏠
           - 'Analyze top stock prices and generate a report' becomes AnalyzeStockGPT 📈
           `,
        },
      ],
      model: "deepseek-chat",//"gpt-3.5-turbo",
    });

    // @ts-ignore
    return chatCompletion.choices[0].message.content as string;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

export const agentRouter = createTRPCRouter({
  create: protectedProcedure.input(createAgentParser).mutation(async ({ input, ctx }) => {
    console.log("Creating agent with input:", input);
    console.log("User ID:", ctx.session?.user?.id);
    
    const name = (await generateAgentName(input.goal)) || input.goal;
    console.log("Generated agent name:", name);

    if (!ctx.session?.user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const agent = await supabaseDb.createAgent({
        name: name.trim(),
        goal: input.goal,
        userId: ctx.session.user.id,
      });
      console.log("Successfully created agent:", agent);
      return agent;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  }),
  save: protectedProcedure.input(saveAgentParser).mutation(async ({ input, ctx }) => {
    console.log("Saving agent with input:", input);
    console.log("User ID:", ctx.session?.user?.id);
    
    if (!ctx.session?.user?.id) {
      throw new Error("User not authenticated");
    }

    console.log("Looking for agent with ID:", input.id);
    const agent = await supabaseDb.getAgentById(input.id);
    console.log("Found agent:", agent);
    
    if (!agent || agent.userId !== ctx.session.user.id) {
      console.log("Agent not found or user mismatch. Agent:", agent, "Expected user:", ctx.session.user.id);
      throw new Error("Agent not found");
    }

    const tasks = input.tasks.map((e) => ({
      agentId: agent.id,
      type: e.type,
      ...(e.type === MESSAGE_TYPE_TASK && { status: e.status }),
      info: e.info,
      value: e.value,
      sort: 0, // TODO: Remove sort
    }));

    await supabaseDb.createAgentTasks(tasks);
    return agent;
  }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new Error("User not authenticated");
    }

    return await supabaseDb.getAgentsByUserId(ctx.session.user.id, 20);
  }),
  findById: publicProcedure.input(z.string()).query(async ({ input }) => {
    try {
      const agent = await supabaseDb.getAgentById(input);
      if (!agent) {
        throw new Error(`Agent with ID "${input}" not found`);
      }
      return agent;
    } catch (error) {
      console.error("Error finding agent:", error);
      throw new Error(`Failed to find agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),
  deleteById: protectedProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const agent = await supabaseDb.getAgentById(input);
    if (!agent || agent.userId !== ctx.session.user.id) {
      throw new Error("Agent not found");
    }

    await supabaseDb.updateAgent(input, { deleteDate: new Date() });
  }),
  debug: publicProcedure.query(async () => {
    const totalAgents = await supabaseDb.getAllAgentsCount();
    return {
      totalAgents,
      message: `Database has ${totalAgents} agents total`
    };
  }),
});
