package com.taskhub.app;

import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d("MainActivity", "onCreate called");

        registerPlugin(StripePaymentPlugin.class);
        Log.d("MainActivity", "StripePaymentPlugin registered");

        super.onCreate(savedInstanceState);

        Window window = getWindow();

        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        WindowCompat.setDecorFitsSystemWindows(window, true);

        window.setStatusBarColor(Color.TRANSPARENT);

        window.setNavigationBarColor(Color.TRANSPARENT);

        WindowInsetsControllerCompat insetsController =
                new WindowInsetsControllerCompat(window, window.getDecorView());

        insetsController.setAppearanceLightStatusBars(true);

        insetsController.setAppearanceLightNavigationBars(true);
    }
}
