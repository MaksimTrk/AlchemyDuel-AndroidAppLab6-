package com.example.alchemybattle

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.webkit.JavascriptInterface
import androidx.core.content.edit

/**
 * JavaScript-міст між WebView (грою) і Android-платформою.
 *
 * З JavaScript доступний як об'єкт `Android`:
 *   Android.playSound("goblin_atack")  — відтворення звукового ефекту
 *   Android.startMusic()               — запуск фонової музики (looped)
 *   Android.stopMusic()                — зупинка фонової музики
 *   Android.saveName("Wizard")         — збереження імені гравця
 *   Android.loadName()                 — повертає збережене ім'я
 */
class AlchemyJsBridge(private val context: Context) {

    // SharedPreferences для збереження імені гравця
    private val prefs = context.getSharedPreferences("alchemy_prefs", Context.MODE_PRIVATE)

    // Плеєр для фонової музики
    private var musicPlayer: MediaPlayer? = null

    // ── Ім'я гравця ──────────────────────────────────────────────────

    @JavascriptInterface
    fun saveName(name: String) {
        prefs.edit { putString("player_name", name.trim()) }
    }

    @JavascriptInterface
    fun loadName(): String {
        return prefs.getString("player_name", "") ?: ""
    }

    // ── Звукові ефекти ────────────────────────────────────────────────

    /**
     * Відтворює звуковий ефект з папки assets/sounds/<name>.mp3
     * Кожен звук — окремий MediaPlayer, звільняється після програвання.
     */
    @JavascriptInterface
    fun playSound(name: String) {
        try {
            val path = "assets/sounds/$name.mp3"
            val afd = context.assets.openFd(path)

            val mp = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                setVolume(0.6f, 0.6f)
                // Автоматично звільняємо ресурси після відтворення
                setOnCompletionListener { it.release() }
                setOnPreparedListener { it.start() }
                prepareAsync()
            }
            afd.close()
        } catch (e: Exception) {
            // Якщо файл не знайдено — просто ігноруємо (гра продовжується)
            e.printStackTrace()
        }
    }

    // ── Фонова музика ─────────────────────────────────────────────────

    /**
     * Запускає фонову музику (loop). Викликається з JS при першому кліку.
     * Якщо музика вже грає — нічого не робить.
     */
    @JavascriptInterface
    fun startMusic() {
        if (musicPlayer != null) return
        try {
            val afd = context.assets.openFd("assets/sounds/background.mp3")
            musicPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                setVolume(0.2f, 0.2f)
                isLooping = true
                prepare()   // синхронно — файл локальний, це безпечно
                start()
            }
            afd.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /** Зупиняє і повністю вивільняє фонову музику. */
    @JavascriptInterface
    fun stopMusic() {
        musicPlayer?.stop()
        musicPlayer?.release()
        musicPlayer = null
    }

    // ── Методи для Activity (не @JavascriptInterface) ─────────────────

    /** Пауза музики при згортанні додатку. */
    fun pauseMusic() {
        try {
            if (musicPlayer?.isPlaying == true) musicPlayer?.pause()
        } catch (_: Exception) {}
    }

    /** Відновлення музики при поверненні до додатку. */
    fun resumeMusic() {
        try {
            if (musicPlayer != null && musicPlayer?.isPlaying == false) musicPlayer?.start()
        } catch (_: Exception) {}
    }

    /** Звільняємо всі ресурси при закритті Activity. */
    fun release() {
        musicPlayer?.release()
        musicPlayer = null
    }
}
