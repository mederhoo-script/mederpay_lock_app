package com.app.mederbuylock.core.receiver

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import timber.log.Timber

class DeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Timber.i("Device admin ENABLED")
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        Timber.w("Device admin disable requested")
        return "Disabling device admin will prevent MederPay from managing payments on this device."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Timber.w("Device admin DISABLED")
    }

    override fun onPasswordChanged(context: Context, intent: Intent) {
        super.onPasswordChanged(context, intent)
        Timber.d("Device password changed")
    }

    override fun onPasswordFailed(context: Context, intent: Intent) {
        super.onPasswordFailed(context, intent)
        Timber.w("Password attempt failed")
    }

    override fun onPasswordSucceeded(context: Context, intent: Intent) {
        super.onPasswordSucceeded(context, intent)
        Timber.d("Password attempt succeeded")
    }
}
