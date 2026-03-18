package com.app.mederbuylock.domain.usecase

import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.domain.model.PaymentStatus
import com.app.mederbuylock.domain.repository.PaymentRepository
import javax.inject.Inject

class CheckPaymentStatusUseCase @Inject constructor(
    private val paymentRepository: PaymentRepository,
) {
    suspend operator fun invoke(imei: String): Result<PaymentStatus> =
        paymentRepository.checkPaymentStatus(imei)
}
