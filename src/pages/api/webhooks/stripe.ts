import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

import { env } from "../../../env/server.mjs";
import { supabaseDb } from "../../../lib/supabase-db";

// Initialize Stripe with your secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

// This is your Stripe webhook secret for testing your endpoint locally
const endpointSecret = env.STRIPE_WEBHOOK_SECRET || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    const body = await buffer(req);
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook Error: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object ;

    // Retrieve the invitation code from the metadata
    const inviteCode = session.metadata?.inviteCode;
    const email = session.metadata?.email;

    if (inviteCode && email) {
      try {
        // Get the invitation by code
        const invitation = await supabaseDb.getInvitationByCode(inviteCode);
        if (invitation) {
          // Update the invitation status to ready
          await supabaseDb.updateInvitationStatus(invitation.id, "ready");
          console.log(`Payment successful for invitation: ${inviteCode}`);
        }
      } catch (error) {
        console.error("Error updating invitation status:", error);
      }
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}

// Helper function to parse the request body as a buffer
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(req: NextApiRequest) {
  const chunks: Buffer[] = [];
  
  return new Promise<Buffer>((resolve, reject) => {
    let body = Buffer.alloc(0);
    
    req.on("data", (chunk) => {
      body = Buffer.concat([body, chunk]);
    });
    
    req.on("end", () => {
      resolve(body);
    });
    
    req.on("error", (err) => {
      reject(err);
    });
  });
} 