package com.reefdeck.app.data.store

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SessionStore(context: Context) {
    private val prefs: SharedPreferences = openPrefs(context)

    fun token(): String = prefs.getString(KEY_TOKEN, "") ?: ""

    fun email(): String = prefs.getString(KEY_EMAIL, "") ?: ""

    fun hubUrl(): String = prefs.getString(KEY_HUB_URL, DEFAULT_HUB_URL) ?: DEFAULT_HUB_URL

    fun setSession(token: String, email: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_EMAIL, email)
            .apply()
    }

    fun setHubUrl(url: String) {
        prefs.edit().putString(KEY_HUB_URL, normalizeHubUrl(url)).apply()
    }

    fun clearToken() {
        prefs.edit()
            .remove(KEY_TOKEN)
            .remove(KEY_EMAIL)
            .apply()
    }

    companion object {
        const val DEFAULT_HUB_URL = "http://10.0.2.2:43180"
        private const val TAG = "ReefDeckSession"
        private const val FILE_SECURE = "reefdeck_secure"
        private const val FILE_FALLBACK = "reefdeck_fallback"
        private const val KEY_TOKEN = "token"
        private const val KEY_EMAIL = "email"
        private const val KEY_HUB_URL = "hub_url"

        fun normalizeHubUrl(raw: String): String {
            var url = raw.trim()
            if (url.isEmpty()) return DEFAULT_HUB_URL
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "http://$url"
            }
            return url.trimEnd('/')
        }

        private fun openPrefs(context: Context): SharedPreferences {
            return try {
                val masterKey = MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build()
                EncryptedSharedPreferences.create(
                    context,
                    FILE_SECURE,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
                )
            } catch (err: Exception) {
                Log.w(TAG, "Encrypted prefs unavailable, using private fallback", err)
                context.getSharedPreferences(FILE_FALLBACK, Context.MODE_PRIVATE)
            }
        }
    }
}
