import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db";

// Initialize Stripe with your secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Generate a unique invite code for this registration
    const inviteCode = uuidv4();

    // Create an invitation record in the database
    await prisma.invitation.create({
      data: {
        code: inviteCode,
        status: "pending",
      },
    });

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Edge Science Account Registration",
              description: "One-time payment for Edge Science account registration",
            },
            unit_amount: 1000, // $10.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${env.NEXTAUTH_URL}/signin?inviteCode=${inviteCode}&email=${email}&payment=success`,
      cancel_url: `${env.NEXTAUTH_URL}/signin?payment=cancelled`,
      customer_email: email,
      metadata: {
        inviteCode,
        email,
      },
    });

    // Redirect to the Stripe checkout page
    res.redirect(303, session.url || "/signin");
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
} 