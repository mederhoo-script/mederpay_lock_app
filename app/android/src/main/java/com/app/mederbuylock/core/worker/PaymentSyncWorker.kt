package com.app.mederbuylock.core.worker

import android.content.Context
import android.content.Intent
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.app.mederbuylock.MainActivity
import com.app.mederbuylock.core.utils.Result as AppResult
import com.app.mederbuylock.data.local.SecurePreferences
import com.app.mederbuylock.data.remote.ApiService
import com.app.mederbuylock.data.remote.dto.DeviceEventRequest
import com.app.mederbuylock.domain.model.PaymentStatus
import com.app.mederbuylock.domain.usecase.CheckPaymentStatusUseCase
import com.app.mederbuylock.domain.usecase.LockDeviceUseCase
import com.app.mederbuylock.domain.usecase.UnlockDeviceUseCase
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import timber.log.Timber

@HiltWorker
class PaymentSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val checkPaymentStatusUseCase: CheckPaymentStatusUseCase,
    private val lockDeviceUseCase: LockDeviceUseCase,
    private val unlockDeviceUseCase: UnlockDeviceUseCase,
    private val securePreferences: SecurePreferences,
    private val apiService: ApiService,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        Timber.d("PaymentSyncWorker: starting")

        val imei = securePreferences.cachedImei

        if (imei.isNullOrBlank()) {
            Timber.w("PaymentSyncWorker: no IMEI cached — retrying later")
            return Result.retry()
        }

        return when (val result = checkPaymentStatusUseCase(imei)) {
            is AppResult.Success -> {
                handleStatus(imei, result.data)
                Result.success()
            }
            is AppResult.Error -> {
                Timber.e("PaymentSyncWorker error: ${result.message}")
                postEvent(imei, "SYNC_FAIL", result.message)
                Result.retry()
            }
            is AppResult.Loading -> Result.retry()
        }
    }

    private suspend fun handleStatus(imei: String, status: PaymentStatus) {
        when (status) {
            is PaymentStatus.Locked, is PaymentStatus.Overdue -> {
                val oldStatusStr = securePreferences.cachedPaymentStatus ?: "ACTIVE"
                val newStatusStr = if (status is PaymentStatus.Locked) "LOCKED" else "OVERDUE"
                Timber.w("PaymentSyncWorker: device should be locked ($status)")
                lockDeviceUseCase()
                // Persist the new status so the next sync cycle has the correct oldStatus.
                securePreferences.cachedPaymentStatus = newStatusStr
                postEvent(
                    imei,
                    DeviceEventRequest(
                        eventType = "LOCK_ENFORCED",
                        details = "Automatic lock by PaymentSyncWorker: $status",
                        oldStatus = oldStatusStr,
                        newStatus = newStatusStr,
                    ),
                )
                launchLockScreen()
            }
            is PaymentStatus.Active, is PaymentStatus.GracePeriod -> {
                val wasLocked = securePreferences.isDeviceLocked
                val oldStatusStr = securePreferences.cachedPaymentStatus ?: "LOCKED"
                val newStatusStr = if (status is PaymentStatus.GracePeriod) "GRACE_PERIOD" else "ACTIVE"
                Timber.d("PaymentSyncWorker: payment OK ($status)")
                unlockDeviceUseCase()
                // Persist the new status so the next sync cycle has the correct oldStatus.
                securePreferences.cachedPaymentStatus = newStatusStr
                if (wasLocked) {
                    postEvent(
                        imei,
                        DeviceEventRequest(
                            eventType = "STATUS_CHANGE",
                            details = "Auto-unlocked by PaymentSyncWorker: $status",
                            oldStatus = oldStatusStr,
                            newStatus = newStatusStr,
                        ),
                    )
                }
            }
        }
    }

    private suspend fun postEvent(imei: String, eventType: String, details: String?) {
        postEvent(imei, DeviceEventRequest(eventType = eventType, details = details))
    }

    private suspend fun postEvent(imei: String, request: DeviceEventRequest) {
        try {
            apiService.postDeviceEvent(imei, request)
        } catch (e: Exception) {
            Timber.w(e, "Failed to post ${request.eventType} event (non-fatal)")
        }
    }

    private fun launchLockScreen() {
        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            putExtra(MainActivity.EXTRA_FORCE_LOCK, true)
        }
        applicationContext.startActivity(intent)
    }

    companion object {
        const val WORK_NAME = "payment_sync_worker"
    }
}
