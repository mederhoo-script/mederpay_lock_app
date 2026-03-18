package com.app.mederbuylock.domain.usecase

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import com.app.mederbuylock.core.receiver.DeviceAdminReceiver
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject

class LockDeviceUseCase @Inject constructor(
    @ApplicationContext private val context: Context,
    private val devicePolicyManager: DevicePolicyManager,
) {
    operator fun invoke() {
        val componentName = ComponentName(context, DeviceAdminReceiver::class.java)
        if (devicePolicyManager.isAdminActive(componentName)) {
            try {
                devicePolicyManager.lockNow()
                Timber.d("Device locked via DevicePolicyManager")
            } catch (e: SecurityException) {
                Timber.e(e, "SecurityException while locking device")
            }
        } else {
            Timber.w("Device admin not active — cannot lock device")
        }
    }
}
