# VigorUp release shrinking (R8). The app logic lives in the web bundle; what R8 must not
# break is the native glue that is found by name or reflection at runtime.

# Readable crash reports in Play Console (the mapping file travels inside the .aab).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Capacitor: plugins and the bridge are looked up by class and method name.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Cordova layer and cordova-plugin-purchase (cc.fovea.PurchasePlugin is created from config.xml by name).
-keep class org.apache.cordova.** { *; }
-keep class cc.fovea.** { *; }

# Google Play Billing (ships its own rules; kept explicitly because purchases are critical).
-keep class com.android.billingclient.** { *; }
-keep class com.android.vending.billing.** { *; }

# Methods exposed to the WebView's JavaScript.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
