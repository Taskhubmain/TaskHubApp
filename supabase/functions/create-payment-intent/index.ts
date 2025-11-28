import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  idempotency_key?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[create-payment-intent] Function called');

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePublishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");

    if (!stripeSecretKey) {
      console.error('[create-payment-intent] STRIPE_SECRET_KEY is not configured');
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!stripePublishableKey) {
      console.error('[create-payment-intent] STRIPE_PUBLISHABLE_KEY is not configured');
      throw new Error("STRIPE_PUBLISHABLE_KEY is not configured");
    }

    console.log('[create-payment-intent] Stripe keys configured');

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('[create-payment-intent] Missing authorization header');
      throw new Error("Missing authorization header");
    }

    console.log('[create-payment-intent] Auth header present');

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('[create-payment-intent] User auth error:', userError);
      throw new Error("Unauthorized: " + (userError?.message || "No user found"));
    }

    console.log('[create-payment-intent] User authenticated:', user.id);

    const { amount, currency = "USD", idempotency_key }: PaymentIntentRequest = await req.json();

    console.log('[create-payment-intent] Request params:', { amount, currency, idempotency_key });

    if (!amount || amount <= 0) {
      console.error('[create-payment-intent] Invalid amount:', amount);
      throw new Error("Invalid amount");
    }

    if (!idempotency_key) {
      console.error('[create-payment-intent] Missing idempotency_key');
      throw new Error("Missing idempotency_key");
    }

    let { data: wallet, error: walletError } = await supabaseClient
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      throw new Error("Failed to fetch wallet: " + walletError.message);
    }

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabaseClient
        .from("wallets")
        .insert({
          user_id: user.id,
          balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          currency: currency,
        })
        .select()
        .single();

      if (createError) {
        throw new Error("Failed to create wallet: " + createError.message);
      }
      wallet = newWallet;
    }

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    const { data: existingTransaction } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();

    let transaction;

    if (existingTransaction) {
      transaction = existingTransaction;

      if (existingTransaction.provider_payment_id) {
        const existingPaymentIntent = await stripe.paymentIntents.retrieve(
          existingTransaction.provider_payment_id
        );

        return new Response(
          JSON.stringify({
            client_secret: existingPaymentIntent.client_secret,
            payment_intent_id: existingPaymentIntent.id,
            publishable_key: Deno.env.get("STRIPE_PUBLISHABLE_KEY"),
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } else {
      const { data: newTransaction, error: transactionError } = await supabaseClient
        .from("transactions")
        .insert({
          wallet_id: wallet.id,
          type: "deposit",
          status: "pending",
          amount: amount,
          description: `Stripe пополнение кошелька $${amount.toFixed(2)}`,
          reference_type: "deposit",
          provider: "stripe",
          expires_at: expiresAt,
          idempotency_key: idempotency_key,
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error("Failed to create transaction: " + transactionError.message);
      }

      transaction = newTransaction;
    }

    console.log('[create-payment-intent] Creating payment intent');

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: {
          user_id: user.id,
          wallet_id: wallet.id,
          transaction_id: transaction.id,
          currency: currency,
        },
      },
      {
        idempotencyKey: idempotency_key,
      }
    );

    console.log('[create-payment-intent] Payment intent created:', paymentIntent.id);

    await supabaseClient
      .from("transactions")
      .update({
        provider_payment_id: paymentIntent.id,
        provider_status: paymentIntent.status,
      })
      .eq("id", transaction.id);

    console.log('[create-payment-intent] Transaction updated');

    const response = {
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      publishable_key: stripePublishableKey,
    };

    console.log('[create-payment-intent] Returning response with publishable_key:', stripePublishableKey?.substring(0, 20) + '...');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
