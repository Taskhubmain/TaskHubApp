import { WebPlugin } from '@capacitor/core';
import type { StripePaymentPlugin } from './stripe-plugin';

export class StripePaymentWeb extends WebPlugin implements StripePaymentPlugin {
  async initializePaymentSheet(_options: {
    publishableKey: string;
    clientSecret: string;
  }): Promise<{ status: string; message: string }> {
    throw new Error('Stripe Payment Sheet is only available on native platforms');
  }
}
