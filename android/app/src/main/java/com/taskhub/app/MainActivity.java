package com.taskhub.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {

    @Override
    protected ArrayList<Class<? extends Plugin>> getInitialPlugins() {
        ArrayList<Class<? extends Plugin>> plugins = new ArrayList<>(super.getInitialPlugins());
        plugins.add(StripePaymentPlugin.class);
        return plugins;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
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
