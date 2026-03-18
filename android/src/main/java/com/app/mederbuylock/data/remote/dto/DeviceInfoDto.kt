package com.app.mederbuylock.data.remote.dto

import com.google.gson.annotations.SerializedName

data class DeviceInfoDto(
    // ── Android-specific fields (computed by server) ───────────────────────
    @SerializedName("is_locked")      val isLocked: Boolean,
    @SerializedName("days_overdue")   val daysOverdue: Int,
    @SerializedName("payment_status") val paymentStatus: String,
    @SerializedName("user_name")      val userName: String?,
    @SerializedName("phone_number")   val phoneNumber: String?,
    @SerializedName("due_date")       val paymentDueDate: String?,
    // ── Extended payment fields ────────────────────────────────────────────
    @SerializedName("account_number") val accountNumber: String?,
    @SerializedName("balance")        val balance: Long,
    @SerializedName("payment_url")    val paymentUrl: String?,
    @SerializedName("support_phone")  val supportPhone: String?,
    @SerializedName("status")         val status: String,
)
