package com.app.mederbuylock.presentation.lockscreen

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.mederbuylock.core.utils.DeviceUtils
import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.data.local.SecurePreferences
import com.app.mederbuylock.domain.model.DeviceInfo
import com.app.mederbuylock.domain.usecase.GetDeviceInfoUseCase
import com.app.mederbuylock.domain.usecase.LockDeviceUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
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

data class LockScreenUiState(
    val isLoading: Boolean = true,
    val deviceInfo: DeviceInfo? = null,
    val error: String? = null,
)

sealed class LockScreenEvent {
    data object CallSupport : LockScreenEvent()
    data object EmergencyCall : LockScreenEvent()
    data object NavigateToHome : LockScreenEvent()
}

@HiltViewModel
class LockScreenViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val getDeviceInfoUseCase: GetDeviceInfoUseCase,
    private val lockDeviceUseCase: LockDeviceUseCase,
    private val securePreferences: SecurePreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LockScreenUiState())
    val uiState: StateFlow<LockScreenUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<LockScreenEvent>()
    val events: SharedFlow<LockScreenEvent> = _events.asSharedFlow()

    init {
        enforceLock()
        loadDeviceInfo()
    }

    private fun enforceLock() {
        lockDeviceUseCase()
    }

    fun refresh() = loadDeviceInfo()

    private fun loadDeviceInfo() = viewModelScope.launch {
        _uiState.update { it.copy(isLoading = true, error = null) }
        val imei = securePreferences.cachedImei ?: DeviceUtils.getImei(context)
        when (val result = getDeviceInfoUseCase(imei)) {
            is Result.Success -> {
                _uiState.update { it.copy(isLoading = false, deviceInfo = result.data) }
                if (!result.data.isLocked) {
                    _events.emit(LockScreenEvent.NavigateToHome)
                }
            }
            is Result.Error -> {
                Timber.e("LockScreen: failed to load device info — ${result.message}")
                _uiState.update { it.copy(isLoading = false, error = result.message) }
            }
            is Result.Loading -> Unit
        }
    }

    fun onCallSupportClicked() = viewModelScope.launch {
        _events.emit(LockScreenEvent.CallSupport)
    }

    fun onEmergencyCallClicked() = viewModelScope.launch {
        _events.emit(LockScreenEvent.EmergencyCall)
    }
}
