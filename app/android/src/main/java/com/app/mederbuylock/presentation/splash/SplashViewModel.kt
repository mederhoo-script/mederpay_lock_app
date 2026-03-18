package com.app.mederbuylock.presentation.splash

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.mederbuylock.BuildConfig
import com.app.mederbuylock.core.security.RootDetector
import com.app.mederbuylock.core.utils.DeviceUtils
import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.data.local.SecurePreferences
import com.app.mederbuylock.data.remote.ApiService
import com.app.mederbuylock.data.remote.dto.DeviceEventRequest
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
    private val apiService: ApiService,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SplashUiState())
    val uiState: StateFlow<SplashUiState> = _uiState.asStateFlow()

    private val _navEvents = MutableSharedFlow<SplashNavEvent>()
    val navEvents: SharedFlow<SplashNavEvent> = _navEvents.asSharedFlow()

    init {
        bootstrap()
    }

    private fun bootstrap() = viewModelScope.launch {
        val imei = DeviceUtils.getImei(context)
        securePreferences.cachedImei = imei

        // Root check runs concurrently with network work
        val isRooted = rootDetector.isRooted(context)
        _uiState.update { it.copy(isRooted = isRooted) }

        // Fire-and-forget telemetry events (non-fatal)
        launch { postEvent(imei, "BOOT", if (isRooted) "rooted=true" else null) }
        if (isRooted) {
            launch { postEvent(imei, "ROOT_DETECTED", "Root detected on boot") }
        }

        // Enforce minimum splash time for UX
        val minSplashJob = launch { delay(1_500) }

        val result = getDeviceInfoUseCase(imei)
        minSplashJob.join()

        _uiState.update { it.copy(isLoading = false) }

        when (result) {
            is Result.Success -> {
                val event = if (result.data.isLocked) SplashNavEvent.ToLockScreen
                else SplashNavEvent.ToHome
                _navEvents.emit(event)
            }
            is Result.Error -> {
                Timber.e("Splash bootstrap failed: ${result.message}")
                val event = if (securePreferences.isDeviceLocked) SplashNavEvent.ToLockScreen
                else SplashNavEvent.ToHome
                _navEvents.emit(event)
            }
            is Result.Loading -> Unit
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
}
