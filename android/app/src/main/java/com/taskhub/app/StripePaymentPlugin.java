package com.taskhub.app;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.stripe.android.PaymentConfiguration;
import com.stripe.android.paymentsheet.PaymentSheet;
import com.stripe.android.paymentsheet.PaymentSheetResult;

import androidx.appcompat.app.AppCompatActivity;

@CapacitorPlugin(name = "StripePayment")
public class StripePaymentPlugin extends Plugin {

    private static final String TAG = "StripePaymentPlugin";
    private PaymentSheet paymentSheet;
    private PluginCall pendingCall;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "StripePaymentPlugin loaded");
    }

    @PluginMethod
    public void initializePaymentSheet(PluginCall call) {
        String publishableKey = call.getString("publishableKey");
        String clientSecret = call.getString("clientSecret");

        if (publishableKey == null || publishableKey.isEmpty()) {
            call.reject("Missing publishableKey");
            return;
        }

        if (clientSecret == null || clientSecret.isEmpty()) {
            call.reject("Missing clientSecret");
            return;
        }

        try {
            PaymentConfiguration.init(getContext(), publishableKey);

            getActivity().runOnUiThread(() -> {
                paymentSheet = new PaymentSheet(
                    (AppCompatActivity) getActivity(),
                    this::onPaymentSheetResult
                );

                PaymentSheet.Configuration configuration = new PaymentSheet.Configuration.Builder("TaskHub")
                    .build();

                pendingCall = call;
                paymentSheet.presentWithPaymentIntent(clientSecret, configuration);
            });

        } catch (Exception e) {
            Log.e(TAG, "Error initializing payment sheet", e);
            call.reject("Failed to initialize payment sheet: " + e.getMessage());
        }
    }

    private void onPaymentSheetResult(PaymentSheetResult result) {
        if (pendingCall == null) {
            Log.e(TAG, "No pending call for payment result");
            return;
        }

        JSObject ret = new JSObject();

        if (result instanceof PaymentSheetResult.Completed) {
            ret.put("status", "success");
            ret.put("message", "Payment completed successfully");
            pendingCall.resolve(ret);
        } else if (result instanceof PaymentSheetResult.Canceled) {
            ret.put("status", "cancelled");
            ret.put("message", "Payment was cancelled by user");
            pendingCall.resolve(ret);
        } else if (result instanceof PaymentSheetResult.Failed) {
            PaymentSheetResult.Failed failedResult = (PaymentSheetResult.Failed) result;
            Throwable error = failedResult.getError();
            ret.put("status", "failed");
            ret.put("message", error != null ? error.getMessage() : "Payment failed");
            pendingCall.reject(error != null ? error.getMessage() : "Payment failed", ret);
        }

        pendingCall = null;
    }
}
