package com.app.mederbuylock.data.local

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SecurePreferences @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val prefs: SharedPreferences by lazy { createPrefs() }

    private fun createPrefs(): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        } catch (e: Exception) {
            // Fallback to plain prefs; log so we can investigate in production
            Timber.e(e, "EncryptedSharedPreferences unavailable, falling back to plain prefs")
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
    }

    var deviceToken: String?
        get() = prefs.getString(KEY_DEVICE_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var cachedImei: String?
        get() = prefs.getString(KEY_IMEI_CACHE, null)
        set(value) = prefs.edit().putString(KEY_IMEI_CACHE, value).apply()

    var isDeviceLocked: Boolean
        get() = prefs.getBoolean(KEY_IS_LOCKED, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_LOCKED, value).apply()

    companion object {
        const val PREFS_NAME = "mederpay_secure_prefs"
        const val KEY_DEVICE_TOKEN = "device_token"
        const val KEY_IMEI_CACHE = "imei_cache"
        const val KEY_IS_LOCKED = "is_locked"
    }
}
