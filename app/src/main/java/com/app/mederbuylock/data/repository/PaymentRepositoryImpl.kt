package com.app.mederbuylock.data.repository

import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.data.remote.ApiService
import com.app.mederbuylock.domain.model.PaymentStatus
import com.app.mederbuylock.domain.repository.PaymentRepository
import timber.log.Timber
import javax.inject.Inject

class PaymentRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
) : PaymentRepository {

    override suspend fun checkPaymentStatus(imei: String): Result<PaymentStatus> {
        return try {
            val response = apiService.checkPaymentStatus(imei)
            if (response.isSuccessful) {
                val dto = requireNotNull(response.body()) { "Response body was null" }
                Result.Success(PaymentStatus.fromString(dto.status))
            } else {
                Result.Error("Payment status check failed: ${response.code()} ${response.message()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to check payment status")
            Result.Error(e.message ?: "Unknown error", e)
        }
    }
}
