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
        Log.d(TAG, "initializePaymentSheet called");

        String publishableKey = call.getString("publishableKey");
        String clientSecret = call.getString("clientSecret");

        Log.d(TAG, "publishableKey: " + (publishableKey != null ? publishableKey.substring(0, Math.min(20, publishableKey.length())) + "..." : "null"));
        Log.d(TAG, "clientSecret present: " + (clientSecret != null && !clientSecret.isEmpty()));

        if (publishableKey == null || publishableKey.isEmpty()) {
            Log.e(TAG, "Missing publishableKey");
            call.reject("Missing publishableKey");
            return;
        }

        if (clientSecret == null || clientSecret.isEmpty()) {
            Log.e(TAG, "Missing clientSecret");
            call.reject("Missing clientSecret");
            return;
        }

        try {
            Log.d(TAG, "Initializing PaymentConfiguration");
            PaymentConfiguration.init(getContext(), publishableKey);

            Log.d(TAG, "Running on UI thread");
            getActivity().runOnUiThread(() -> {
                try {
                    Log.d(TAG, "Creating PaymentSheet");
                    paymentSheet = new PaymentSheet(
                        (AppCompatActivity) getActivity(),
                        this::onPaymentSheetResult
                    );

                    Log.d(TAG, "Creating PaymentSheet configuration");
                    PaymentSheet.Configuration configuration = new PaymentSheet.Configuration.Builder("TaskHub")
                        .build();

                    Log.d(TAG, "Setting pending call and presenting payment sheet");
                    pendingCall = call;
                    paymentSheet.presentWithPaymentIntent(clientSecret, configuration);
                    Log.d(TAG, "Payment sheet presented successfully");
                } catch (Exception e) {
                    Log.e(TAG, "Error in UI thread", e);
                    call.reject("UI thread error: " + e.getMessage());
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Error initializing payment sheet", e);
            call.reject("Failed to initialize payment sheet: " + e.getMessage());
        }
    }

    private void onPaymentSheetResult(PaymentSheetResult result) {
        Log.d(TAG, "onPaymentSheetResult called with result type: " + result.getClass().getSimpleName());

        if (pendingCall == null) {
            Log.e(TAG, "No pending call for payment result");
            return;
        }

        JSObject ret = new JSObject();

        if (result instanceof PaymentSheetResult.Completed) {
            Log.d(TAG, "Payment completed successfully");
            ret.put("status", "success");
            ret.put("message", "Payment completed successfully");
            pendingCall.resolve(ret);
        } else if (result instanceof PaymentSheetResult.Canceled) {
            Log.d(TAG, "Payment was cancelled by user");
            ret.put("status", "cancelled");
            ret.put("message", "Payment was cancelled by user");
            pendingCall.resolve(ret);
        } else if (result instanceof PaymentSheetResult.Failed) {
            PaymentSheetResult.Failed failedResult = (PaymentSheetResult.Failed) result;
            Throwable error = failedResult.getError();
            String errorMessage = error != null ? error.getMessage() : "Payment failed";
            Log.e(TAG, "Payment failed: " + errorMessage, error);
            ret.put("status", "failed");
            ret.put("message", errorMessage);
            pendingCall.reject(errorMessage, ret);
        }

        pendingCall = null;
        Log.d(TAG, "Payment sheet result processed");
    }
}
