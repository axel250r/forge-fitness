package com.loadoutfit.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

import java.util.Locale;

/**
 * Edge-to-edge on every Android version (Play asks for it; Android 15+ already enforces it).
 *
 * The web layout pads itself with --sat / --sab (top / bottom system bars). Those default to
 * env(safe-area-inset-*), which older Android WebViews leave at 0 for the status and navigation
 * bars, so the real bar sizes are measured here and handed to the page as --nsat / --nsab, which
 * the stylesheet prefers when present. Re-sent on every page load, since a reload clears them.
 */
public class MainActivity extends BridgeActivity {
    private String insetsJs = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // After super.onCreate: BridgeActivity swaps the splash (launch) theme for the app theme
        // there; enabling edge-to-edge before it inflated the window with the launch theme and
        // put a splash-painted action bar over the page.
        // Dark style = light status/navigation icons over the app's dark background, as before.
        EdgeToEdge.enable(this,
            SystemBarStyle.dark(Color.TRANSPARENT),
            SystemBarStyle.dark(Color.TRANSPARENT));

        WebView webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float density = getResources().getDisplayMetrics().density;
            insetsJs = String.format(Locale.US,
                "(function(s){s.setProperty('--nsat','%.1fpx');s.setProperty('--nsab','%.1fpx');})(document.documentElement.style);",
                bars.top / density, bars.bottom / density);
            webView.evaluateJavascript(insetsJs, null);
            return windowInsets;
        });

        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView view) {
                if (insetsJs != null) view.evaluateJavascript(insetsJs, null);
                else ViewCompat.requestApplyInsets(view);
            }
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
