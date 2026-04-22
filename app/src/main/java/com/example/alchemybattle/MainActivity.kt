package com.example.alchemybattle

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var bridge: AlchemyJsBridge

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Повноекранний режим
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        bridge  = AlchemyJsBridge(this)

        // Апаратне прискорення — обов'язково для важкого WebView-контенту
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // ── Налаштування WebView ──────────────────────────────────
        webView.settings.apply {
            javaScriptEnabled                 = true
            mediaPlaybackRequiresUserGesture  = false
            allowFileAccess                   = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs  = true
            cacheMode                         = WebSettings.LOAD_NO_CACHE
            domStorageEnabled                 = true
        }

        // ── JS-міст ───────────────────────────────────────────────
        webView.addJavascriptInterface(bridge, "Android")

        // ── WebViewClient ─────────────────────────────────────────
        webView.webViewClient = object : WebViewClient() {

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                // Вантажимо збережене ім'я ПІСЛЯ повного завантаження сторінки
                // (не в JS-ініціалізації — щоб не блокувати потік)
                val saved = bridge.loadName()
                if (saved.isNotEmpty()) {
                    val safe = saved.replace("\\", "\\\\").replace("'", "\\'")
                    view?.evaluateJavascript(
                        "if(typeof state!=='undefined'){ state.playerName='$safe'; updateUI(); }",
                        null
                    )
                }
            }

            override fun onReceivedError(
                view: WebView?, request: WebResourceRequest?, error: WebResourceError?
            ) {
                // Тихо ігноруємо помилки відсутніх ресурсів (зображення/звуки)
                // щоб вони не гальмували рендеринг
            }
        }

        webView.webChromeClient = WebChromeClient()

        // ── Завантажуємо гру з невеликою затримкою ───────────────
        // postDelayed дає системі час завершити layout до важкого завантаження
        webView.postDelayed({
            webView.loadUrl("file:///android_asset/index.html")
        }, 150)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    override fun onPause() {
        super.onPause()
        bridge.pauseMusic()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        bridge.resumeMusic()
        webView.onResume()
    }

    override fun onDestroy() {
        bridge.release()
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }
}
