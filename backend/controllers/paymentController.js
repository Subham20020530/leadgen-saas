import Stripe from 'stripe';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map plan names to Stripe Price IDs (You would typically put these in env or constants)
// For this demo, we'll create dynamic sessions or assume Price IDs are passed or hardcoded
const PLANS = {
    'starter': {
        priceId: 'price_HINT_YOU_NEED_TO_CREATE_THIS_IN_STRIPE_DASHBOARD',
        credits: 100,
        amount: 2900, // $29.00
        name: 'Starter Plan'
    },
    'pro': {
        priceId: 'price_HINT_YOU_NEED_TO_CREATE_THIS_IN_STRIPE_DASHBOARD_PRO',
        credits: 500,
        amount: 7900, // $79.00
        name: 'Pro Plan'
    },
    'enterprise': {
        priceId: 'price_HINT_YOU_NEED_TO_CREATE_THIS_IN_STRIPE_DASHBOARD_ENT',
        credits: 5000,
        amount: 19900, // $199.00
        name: 'Enterprise Plan'
    }
};

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/create-checkout-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
    try {
        const { planId } = req.body;
        const { userId } = req.auth;
        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const plan = PLANS[planId];
        if (!plan) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: plan.name,
                            description: `${plan.credits} Leads/month`,
                        },
                        unit_amount: plan.amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // Or 'subscription' if you want recurring
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?success=true`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?canceled=true`,
            client_reference_id: userId, // Pass Clerk ID to webhook
            metadata: {
                userId: userId,
                planId: planId,
                credits: plan.credits
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Stripe Webhook Listener
// @route   POST /api/webhook
// @access  Public (Stripe)
export const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // req.rawBody must be available (we need to configure express for this)
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const userId = session.metadata.userId;
        const credits = parseInt(session.metadata.credits);
        const planId = session.metadata.planId;

        console.log(`💰 Payment successful for user ${userId}. Adding ${credits} credits.`);

        // Fulfill the purchase
        await User.findOneAndUpdate(
            { clerkId: userId },
            {
                $inc: { scansRemaining: credits },
                $set: { plan: planId }
            }
        );
    }

    res.json({ received: true });
};
