package com.app.mederbuylock.core.worker

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.app.mederbuylock.MainActivity
import com.app.mederbuylock.R
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
                // lockDeviceUseCase() persists isDeviceLocked=true only when lockNow() succeeds.
                lockDeviceUseCase()
                // cachedPaymentStatus reflects the server's authoritative determination, so it
                // is always persisted regardless of whether local lock enforcement succeeded.
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
                // unlockDeviceUseCase() persists isDeviceLocked=false in the Room cache.
                unlockDeviceUseCase()
                // cachedPaymentStatus reflects the server's authoritative determination, so it
                // is always persisted regardless of whether local unlock state update succeeded.
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

    /**
     * Brings the lock screen to the foreground.
     *
     * On Android 9 and below, a direct `startActivity()` from a background service is allowed.
     * On Android 10+ (API 29+), background activity starts are blocked by the OS and the call
     * silently fails. The correct approach is to post a high-priority full-screen notification
     * whose full-screen intent delivers the same launch intent — the OS will then surface the
     * activity on lock-screen and on an active screen via notification heads-up.
     */
    private fun launchLockScreen() {
        val launchIntent = Intent(applicationContext, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            putExtra(MainActivity.EXTRA_FORCE_LOCK, true)
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            // API 28 and below: direct background activity start is allowed
            applicationContext.startActivity(launchIntent)
        } else {
            // API 29+: post a full-screen intent notification instead
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getActivity(
                applicationContext,
                LOCK_NOTIFICATION_ID,
                launchIntent,
                flags,
            )

            val notification = NotificationCompat.Builder(applicationContext, LOCK_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle(applicationContext.getString(R.string.notif_lock_title))
                .setContentText(applicationContext.getString(R.string.notif_lock_text))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setFullScreenIntent(pendingIntent, /* highPriority = */ true)
                .build()

            val nm = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE)
                as NotificationManager
            nm.notify(LOCK_NOTIFICATION_ID, notification)
        }
    }

    companion object {
        const val WORK_NAME = "payment_sync_worker"
        const val LOCK_CHANNEL_ID = "mederpay_lock_alerts"
        private const val LOCK_NOTIFICATION_ID = 1001
    }
}
