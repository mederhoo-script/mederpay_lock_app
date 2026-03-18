package com.app.mederbuylock.core.worker

import android.content.Context
import android.content.Intent
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.app.mederbuylock.BuildConfig
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
                Timber.w("PaymentSyncWorker: device should be locked ($status)")
                lockDeviceUseCase()
                postEvent(imei, "LOCK_ENFORCED", "Automatic lock by PaymentSyncWorker: $status")
                launchLockScreen()
            }
            is PaymentStatus.Active, is PaymentStatus.GracePeriod -> {
                Timber.d("PaymentSyncWorker: payment OK ($status)")
                unlockDeviceUseCase()
            }
        }
    }

    private suspend fun postEvent(imei: String, eventType: String, details: String?) {
        try {
            apiService.postDeviceEvent(
                imei,
                BuildConfig.DEVICE_API_SECRET,
                DeviceEventRequest(eventType = eventType, details = details),
            )
        } catch (e: Exception) {
            Timber.w(e, "Failed to post $eventType event (non-fatal)")
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
