package com.app.mederbuylock.core.utils

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import timber.log.Timber
import java.util.UUID

object DeviceUtils {

    /**
     * Best-effort IMEI retrieval.
     * On Android 10+ the IMEI is restricted to privileged apps; falls back to Android ID.
     */
    @SuppressLint("HardwareIds", "MissingPermission")
    fun getImei(context: Context): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // IMEI not accessible to non-privileged apps on Android 10+
                getAndroidId(context)
            } else {
                val hasPermission = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.READ_PHONE_STATE,
                ) == PackageManager.PERMISSION_GRANTED

                if (hasPermission) {
                    val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                    @Suppress("DEPRECATION")
                    tm.imei ?: getAndroidId(context)
                } else {
                    getAndroidId(context)
                }
            }
        } catch (e: Exception) {
            Timber.w(e, "IMEI unavailable — using Android ID")
            getAndroidId(context)
        }
    }

    @SuppressLint("HardwareIds")
    fun getAndroidId(context: Context): String =
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            ?: UUID.randomUUID().toString()

    fun generateDeviceToken(): String = UUID.randomUUID().toString()

    fun getDeviceModel(): String = "${Build.MANUFACTURER} ${Build.MODEL}"

    fun getAndroidVersion(): String = Build.VERSION.RELEASE
}
