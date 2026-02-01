import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Stripe from 'stripe';

// Initialize Stripe only when needed (not during build)
let stripe = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' });
  }
  return stripe;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3001';
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?success=1`,
    cancel_url: `${origin}/dashboard`,
    client_reference_id: session.user.id,
    customer_email: session.user.email ?? undefined,
  });
  return Response.json({ url: checkout.url });
}
