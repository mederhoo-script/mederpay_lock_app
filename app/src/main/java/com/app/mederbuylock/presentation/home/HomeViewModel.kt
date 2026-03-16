package com.app.mederbuylock.presentation.home

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.mederbuylock.core.utils.DeviceUtils
import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.data.local.SecurePreferences
import com.app.mederbuylock.domain.model.DeviceInfo
import com.app.mederbuylock.domain.model.PaymentStatus
import com.app.mederbuylock.domain.usecase.CheckPaymentStatusUseCase
import com.app.mederbuylock.domain.usecase.GetDeviceInfoUseCase
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

data class HomeUiState(
    val isLoading: Boolean = false,
    val deviceInfo: DeviceInfo? = null,
    val paymentStatus: PaymentStatus? = null,
    val error: String? = null,
)

sealed class HomeNavEvent {
    data object ToLockScreen : HomeNavEvent()
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val getDeviceInfoUseCase: GetDeviceInfoUseCase,
    private val checkPaymentStatusUseCase: CheckPaymentStatusUseCase,
    private val securePreferences: SecurePreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _navEvents = MutableSharedFlow<HomeNavEvent>()
    val navEvents: SharedFlow<HomeNavEvent> = _navEvents.asSharedFlow()

    init {
        loadData()
    }

    fun refresh() = loadData()

    private fun loadData() = viewModelScope.launch {
        _uiState.update { it.copy(isLoading = true, error = null) }

        val imei = securePreferences.cachedImei ?: DeviceUtils.getImei(context)

        when (val deviceResult = getDeviceInfoUseCase(imei)) {
            is Result.Success -> {
                val info = deviceResult.data
                _uiState.update { it.copy(isLoading = false, deviceInfo = info) }
                if (info.isLocked) {
                    _navEvents.emit(HomeNavEvent.ToLockScreen)
                    return@launch
                }
                checkStatus(imei)
            }
            is Result.Error -> {
                Timber.e("Home: failed to load device info — ${deviceResult.message}")
                _uiState.update { it.copy(isLoading = false, error = deviceResult.message) }
            }
            is Result.Loading -> Unit
        }
    }

    private fun checkStatus(imei: String) = viewModelScope.launch {
        when (val result = checkPaymentStatusUseCase(imei)) {
            is Result.Success -> {
                _uiState.update { it.copy(paymentStatus = result.data) }
                when (result.data) {
                    is PaymentStatus.Locked, is PaymentStatus.Overdue ->
                        _navEvents.emit(HomeNavEvent.ToLockScreen)
                    else -> Unit
                }
            }
            is Result.Error -> Timber.e("Home: payment status error — ${result.message}")
            is Result.Loading -> Unit
        }
    }
}
