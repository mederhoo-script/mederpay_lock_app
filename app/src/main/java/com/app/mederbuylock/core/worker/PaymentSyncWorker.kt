package com.app.mederbuylock.core.worker

import android.content.Context
import android.content.Intent
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.app.mederbuylock.MainActivity
import com.app.mederbuylock.core.utils.Result as AppResult
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
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        Timber.d("PaymentSyncWorker: starting")

        val prefs = applicationContext.getSharedPreferences(
            "mederpay_secure_prefs", Context.MODE_PRIVATE,
        )
        val imei = prefs.getString("imei_cache", null)

        if (imei.isNullOrBlank()) {
            Timber.w("PaymentSyncWorker: no IMEI cached — retrying later")
            return Result.retry()
        }

        return when (val result = checkPaymentStatusUseCase(imei)) {
            is AppResult.Success -> {
                handleStatus(result.data)
                Result.success()
            }
            is AppResult.Error -> {
                Timber.e("PaymentSyncWorker error: ${result.message}")
                Result.retry()
            }
            is AppResult.Loading -> Result.retry()
        }
    }

    private suspend fun handleStatus(status: PaymentStatus) {
        when (status) {
            is PaymentStatus.Locked, is PaymentStatus.Overdue -> {
                Timber.w("PaymentSyncWorker: device should be locked ($status)")
                lockDeviceUseCase()
                launchLockScreen()
            }
            is PaymentStatus.Active, is PaymentStatus.GracePeriod -> {
                Timber.d("PaymentSyncWorker: payment OK ($status)")
                unlockDeviceUseCase()
            }
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
