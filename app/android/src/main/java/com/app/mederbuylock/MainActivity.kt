package com.app.mederbuylock

import android.Manifest
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
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

    // Runtime permission launcher for READ_PHONE_STATE (needed for IMEI on Android 8/9).
    private val phoneStatePermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) {
                Timber.d("READ_PHONE_STATE permission granted")
            } else {
                Timber.w("READ_PHONE_STATE permission denied — device will use Android ID instead")
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        applyWindowFlags()
        ensureDeviceAdmin()
        requestPhoneStatePermissionIfNeeded()

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
     *
     * Activity.setShowWhenLocked() and Activity.setTurnScreenOn() were added in API 27
     * (Android 8.1). On API 26 (Android 8.0, minSdk) the equivalent window flags are used
     * instead — they are deprecated but functional on all API levels.
     */
    private fun applyWindowFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
            )
        }
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

    /**
     * Requests READ_PHONE_STATE at runtime on Android 8/9 so [DeviceUtils.getImei] can
     * retrieve the real IMEI instead of falling back to Android ID.
     * On Android 10+ the IMEI is restricted to privileged apps regardless of permission,
     * so there is no point asking.
     */
    private fun requestPhoneStatePermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) return
        if (ContextCompat.checkSelfPermission(
                this, Manifest.permission.READ_PHONE_STATE,
            ) == PackageManager.PERMISSION_GRANTED
        ) return
        phoneStatePermissionLauncher.launch(Manifest.permission.READ_PHONE_STATE)
    }

    companion object {
        const val EXTRA_FORCE_LOCK = "force_lock"
        const val EXTRA_FROM_BOOT = "from_boot"
    }
}
