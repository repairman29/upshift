#!/usr/bin/env node
/**
 * Create Stripe products and prices for UpshiftAI (Pro $19/mo, Team $99/mo).
 * Run once with: STRIPE_SECRET_KEY=sk_test_... npm run stripe:create
 * Then add the printed vars to .env
 */

const Stripe = require('stripe');

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY (e.g. sk_test_...)');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2024-09-30.acacia' });

async function main() {
  // Pro: $19/mo
  const proProduct = await stripe.products.create({
    name: 'UpshiftAI Pro',
    description: 'Centralized reports, higher AI quotas, and priority support.',
  });
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 1900, // $19.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Pro product:', proProduct.id);
  console.log('Pro price:  ', proPrice.id);

  // Team: $99/mo
  const teamProduct = await stripe.products.create({
    name: 'UpshiftAI Team',
    description: 'Everything in Pro + SSO, org policies, SLA.',
  });
  const teamPrice = await stripe.prices.create({
    product: teamProduct.id,
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Team product:', teamProduct.id);
  console.log('Team price:  ', teamPrice.id);

  console.log('\nAdd to .env:');
  console.log('STRIPE_PRO_PRICE_ID=' + proPrice.id);
  console.log('STRIPE_TEAM_PRICE_ID=' + teamPrice.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
