package com.app.mederbuylock

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.app.mederbuylock.core.worker.PaymentSyncWorker
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltAndroidApp
class MederBuyLockApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(
                if (BuildConfig.DEBUG) android.util.Log.DEBUG else android.util.Log.ERROR,
            )
            .build()

    override fun onCreate() {
        super.onCreate()
        initTimber()
        createNotificationChannels()
        schedulePaymentSync()
    }

    private fun initTimber() {
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            // In production, plant a release tree that logs only warnings/errors
            Timber.plant(object : Timber.Tree() {
                override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
                    if (priority >= android.util.Log.WARN) {
                        android.util.Log.println(priority, tag ?: "MederBuyLock", message)
                    }
                }
            })
        }
    }

    /**
     * Creates the notification channels required for Android 8+ (API 26+).
     * Must be called before any notification is posted; safe to call repeatedly.
     */
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NotificationManager::class.java)

            // High-priority channel used by PaymentSyncWorker to show a full-screen
            // lock notification on Android 10+ where background activity starts are blocked.
            val lockChannel = NotificationChannel(
                PaymentSyncWorker.LOCK_CHANNEL_ID,
                getString(R.string.notif_channel_lock_name),
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = getString(R.string.notif_channel_lock_description)
                setShowBadge(false)
            }

            nm.createNotificationChannel(lockChannel)
        }
    }

    private fun schedulePaymentSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = PeriodicWorkRequestBuilder<PaymentSyncWorker>(4, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build()

        // Use REPLACE so any change to the sync interval takes effect immediately on update.
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            PaymentSyncWorker.WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            syncRequest
        )
    }
}
