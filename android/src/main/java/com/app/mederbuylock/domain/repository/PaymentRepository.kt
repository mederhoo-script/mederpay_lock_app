package com.app.mederbuylock.domain.repository

import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.domain.model.PaymentStatus

interface PaymentRepository {
    suspend fun checkPaymentStatus(imei: String): Result<PaymentStatus>
}
