import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { setSubscription, setSubscriptionStatusBySubscriptionId } from '@/lib/store';

// Initialize Stripe only when needed (not during build)
let stripe = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
  }
  return stripe;
}

export async function POST(req) {
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 });
  }
  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const sub = session.subscription;
    const subscriptionId = typeof sub === 'string' ? sub : sub?.id;
    const customerId = session.customer;
    if (userId && (subscriptionId || customerId)) {
      await setSubscription(userId, {
        customerId: customerId || '',
        subscriptionId: subscriptionId || '',
        status: 'active',
      });
    }
  }
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const status = sub.status === 'active' ? 'active' : sub.status;
    await setSubscriptionStatusBySubscriptionId(sub.id, status);
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await setSubscriptionStatusBySubscriptionId(sub.id, 'cancelled');
  }
  return NextResponse.json({ received: true });
}
