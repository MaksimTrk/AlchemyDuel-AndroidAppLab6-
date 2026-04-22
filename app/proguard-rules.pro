# Add project specific ProGuard rules here.

# Зберігаємо всі @JavascriptInterface методи — без цього WebView-міст не працює!
-keepclassmembers class com.example.alchemybattle.AlchemyJsBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# Зберігаємо всі публічні методи AlchemyJsBridge
-keep class com.example.alchemybattle.AlchemyJsBridge { *; }
