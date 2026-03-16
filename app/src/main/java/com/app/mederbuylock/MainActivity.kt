package com.app.mederbuylock

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.app.mederbuylock.core.receiver.DeviceAdminReceiver
import com.app.mederbuylock.presentation.navigation.AppNavigation
import com.app.mederbuylock.presentation.navigation.Screen
import dagger.hilt.android.AndroidEntryPoint
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var devicePolicyManager: DevicePolicyManager

    private val deviceAdminComponent by lazy {
        ComponentName(this, DeviceAdminReceiver::class.java)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        applyWindowFlags()
        ensureDeviceAdmin()

        val startDestination = when {
            intent.getBooleanExtra(EXTRA_FORCE_LOCK, false) -> Screen.LockScreen.route
            intent.getBooleanExtra(EXTRA_FROM_BOOT, false) -> Screen.Splash.route
            else -> Screen.Splash.route
        }

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AppNavigation(startDestination = startDestination)
                }
            }
        }
    }

    /**
     * Keeps the screen on and allows the lock/home screen to be shown over the keyguard,
     * which is required for a proper BNPL lock experience.
     */
    private fun applyWindowFlags() {
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
        )
    }

    private fun ensureDeviceAdmin() {
        if (!devicePolicyManager.isAdminActive(deviceAdminComponent)) {
            Timber.w("Device admin not active — requesting activation")
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, deviceAdminComponent)
                putExtra(
                    DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    getString(R.string.device_admin_description),
                )
            }
            startActivity(intent)
        } else {
            Timber.d("Device admin is active")
        }
    }

    companion object {
        const val EXTRA_FORCE_LOCK = "force_lock"
        const val EXTRA_FROM_BOOT = "from_boot"
    }
}
