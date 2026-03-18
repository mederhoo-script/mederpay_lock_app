package com.app.mederbuylock.domain.usecase

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import com.app.mederbuylock.core.receiver.DeviceAdminReceiver
import com.app.mederbuylock.domain.repository.DeviceRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject

class UnlockDeviceUseCase @Inject constructor(
    @ApplicationContext private val context: Context,
    private val devicePolicyManager: DevicePolicyManager,
    private val deviceRepository: DeviceRepository,
) {
    suspend operator fun invoke() {
        val componentName = ComponentName(context, DeviceAdminReceiver::class.java)
        if (!devicePolicyManager.isAdminActive(componentName)) {
            Timber.w("Device admin not active — cannot update lock state")
            return
        }
        try {
            val cached = deviceRepository.getCachedDeviceInfo()
            if (cached != null) {
                deviceRepository.saveDeviceInfo(cached.copy(isLocked = false))
                Timber.d("Device unlock state persisted")
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to persist unlock state")
        }
    }
}
