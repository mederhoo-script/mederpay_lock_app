package com.app.mederbuylock.data.remote.dto

import com.google.gson.annotations.SerializedName

data class PaymentStatusDto(
    @SerializedName("status") val status: String,
)
