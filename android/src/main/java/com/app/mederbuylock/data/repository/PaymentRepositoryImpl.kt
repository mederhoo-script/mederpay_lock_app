package com.app.mederbuylock.data.repository

import com.app.mederbuylock.BuildConfig
import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.data.remote.ApiService
import com.app.mederbuylock.data.remote.dto.DeviceEventRequest
import com.app.mederbuylock.domain.model.PaymentStatus
import com.app.mederbuylock.domain.repository.PaymentRepository
import timber.log.Timber
import javax.inject.Inject

class PaymentRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
) : PaymentRepository {

    override suspend fun checkPaymentStatus(imei: String): Result<PaymentStatus> {
        return try {
            // The GET endpoint is the authoritative source for device + payment state.
            val response = apiService.getDeviceInfo(imei, BuildConfig.DEVICE_API_SECRET)
            if (response.isSuccessful) {
                val dto = requireNotNull(response.body()) { "Response body was null" }

                // Fire-and-forget: log a STATUS_CHECK event (failure is non-fatal).
                try {
                    apiService.postDeviceEvent(
                        imei,
                        BuildConfig.DEVICE_API_SECRET,
                        DeviceEventRequest(eventType = "STATUS_CHECK"),
                    )
                } catch (e: Exception) {
                    Timber.w(e, "STATUS_CHECK event logging failed (non-fatal)")
                }

                Result.Success(PaymentStatus.fromString(dto.paymentStatus, dto.daysOverdue))
            } else {
                Result.Error("Payment status check failed: ${response.code()} ${response.message()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to check payment status")
            Result.Error(e.message ?: "Unknown error", e)
        }
    }
}
