import { registerPlugin } from '@capacitor/core';

export interface StripePaymentPlugin {
  initializePaymentSheet(options: {
    publishableKey: string;
    clientSecret: string;
  }): Promise<{ status: string; message: string }>;
}

const StripePayment = registerPlugin<StripePaymentPlugin>('StripePayment', {
  web: () => import('./stripe-plugin-web').then(m => new m.StripePaymentWeb()),
});

export default StripePayment;
