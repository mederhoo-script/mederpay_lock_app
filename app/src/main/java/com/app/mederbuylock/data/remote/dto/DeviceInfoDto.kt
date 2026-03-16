package com.app.mederbuylock.data.remote.dto

import com.google.gson.annotations.SerializedName

data class DeviceInfoDto(
    @SerializedName("imei") val imei: String,
    @SerializedName("userName") val userName: String,
    @SerializedName("phoneNumber") val phoneNumber: String,
    @SerializedName("isLocked") val isLocked: Boolean,
    @SerializedName("daysOverdue") val daysOverdue: Int,
    @SerializedName("paymentDueDate") val paymentDueDate: String,
    @SerializedName("paymentStatus") val paymentStatus: String,
)
