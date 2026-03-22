package com.app.mederbuylock.domain.usecase

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import com.app.mederbuylock.core.receiver.DeviceAdminReceiver
import com.app.mederbuylock.data.local.SecurePreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject

class LockDeviceUseCase @Inject constructor(
    @ApplicationContext private val context: Context,
    private val devicePolicyManager: DevicePolicyManager,
    private val securePreferences: SecurePreferences,
) {
    operator fun invoke() {
        val componentName = ComponentName(context, DeviceAdminReceiver::class.java)
        if (devicePolicyManager.isAdminActive(componentName)) {
            try {
                devicePolicyManager.lockNow()
                // Persist lock state so BootReceiver can re-apply the lock after a reboot.
                securePreferences.isDeviceLocked = true
                Timber.d("Device locked via DevicePolicyManager")
            } catch (e: SecurityException) {
                Timber.e(e, "SecurityException while locking device")
            }
        } else {
            Timber.w("Device admin not active — cannot lock device")
        }
    }
}
