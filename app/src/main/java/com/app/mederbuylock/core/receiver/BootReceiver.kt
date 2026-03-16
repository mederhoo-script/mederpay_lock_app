package com.app.mederbuylock.core.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.app.mederbuylock.MainActivity
import com.app.mederbuylock.data.local.SecurePreferences
import timber.log.Timber

/**
 * Re-launches the app after device reboot so the lock screen is shown immediately
 * if the device was locked when the user powered off.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val isBootAction = intent.action == Intent.ACTION_BOOT_COMPLETED ||
                intent.action == "android.intent.action.QUICKBOOT_POWERON"

        if (!isBootAction) return

        Timber.d("Boot completed — checking lock state")

        // Read isDeviceLocked from plain SharedPreferences using the same prefs name
        // (EncryptedSharedPreferences is not available in BroadcastReceiver without Hilt)
        val prefs = context.getSharedPreferences(
            SecurePreferences.PREFS_NAME,
            Context.MODE_PRIVATE,
        )
        val isLocked = prefs.getBoolean("is_locked", false)

        if (isLocked) {
            Timber.d("Device is locked — launching MainActivity")
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                putExtra(MainActivity.EXTRA_FROM_BOOT, true)
            }
            context.startActivity(launchIntent)
        }
    }
}
