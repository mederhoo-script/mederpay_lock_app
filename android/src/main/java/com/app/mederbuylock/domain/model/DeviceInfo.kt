package com.app.mederbuylock.domain.model

/**
 * Core domain model representing a financed device and its payment state.
 */
data class DeviceInfo(
    val imei: String,
    val androidId: String,
    val isLocked: Boolean,
    val daysOverdue: Int,
    val paymentDueDate: String,
    val userName: String,
    val phoneNumber: String,
    val paymentStatus: String,
    val accountNumber: String?,
    val balance: Long,
    val paymentUrl: String?,
)
