package com.app.mederbuylock.presentation.splash

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.mederbuylock.core.security.RootDetector
import com.app.mederbuylock.core.utils.DeviceUtils
import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.data.local.SecurePreferences
import com.app.mederbuylock.domain.usecase.GetDeviceInfoUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

data class SplashUiState(
    val isLoading: Boolean = true,
    val isRooted: Boolean = false,
)

sealed class SplashNavEvent {
    data object ToHome : SplashNavEvent()
    data object ToLockScreen : SplashNavEvent()
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val getDeviceInfoUseCase: GetDeviceInfoUseCase,
    private val securePreferences: SecurePreferences,
    private val rootDetector: RootDetector,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SplashUiState())
    val uiState: StateFlow<SplashUiState> = _uiState.asStateFlow()

    private val _navEvents = MutableSharedFlow<SplashNavEvent>()
    val navEvents: SharedFlow<SplashNavEvent> = _navEvents.asSharedFlow()

    init {
        bootstrap()
    }

    private fun bootstrap() = viewModelScope.launch {
        // Root check runs concurrently with the minimum splash display time
        val isRooted = rootDetector.isRooted(context)
        _uiState.update { it.copy(isRooted = isRooted) }

        // Ensure a device token exists
        if (securePreferences.deviceToken.isNullOrBlank()) {
            securePreferences.deviceToken = DeviceUtils.generateDeviceToken()
        }

        val imei = DeviceUtils.getImei(context)
        securePreferences.cachedImei = imei

        // Enforce minimum splash time for UX (runs in parallel with network call)
        val minSplashJob = launch { delay(1_500) }

        val result = getDeviceInfoUseCase(imei)
        minSplashJob.join() // Wait for branding to be visible

        _uiState.update { it.copy(isLoading = false) }

        when (result) {
            is Result.Success -> {
                val event = if (result.data.isLocked) SplashNavEvent.ToLockScreen
                else SplashNavEvent.ToHome
                _navEvents.emit(event)
            }
            is Result.Error -> {
                Timber.e("Splash bootstrap failed: ${result.message}")
                // Respect the last known lock state from secure storage
                val event = if (securePreferences.isDeviceLocked) SplashNavEvent.ToLockScreen
                else SplashNavEvent.ToHome
                _navEvents.emit(event)
            }
            is Result.Loading -> Unit
        }
    }
}
