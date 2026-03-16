package com.app.mederbuylock.core.security

import android.content.Context
import com.scottyab.rootbeer.RootBeer
import timber.log.Timber
import javax.inject.Inject

class RootDetector @Inject constructor() {

    /**
     * Returns true if RootBeer determines the device is rooted.
     * Detection failure is treated as non-rooted to avoid false positives.
     */
    fun isRooted(context: Context): Boolean {
        return try {
            val rootBeer = RootBeer(context)
            rootBeer.isRooted.also { rooted ->
                if (rooted) Timber.w("SECURITY WARNING: Device appears to be rooted!")
            }
        } catch (e: Exception) {
            Timber.e(e, "Root detection error — treating as non-rooted")
            false
        }
    }
}
