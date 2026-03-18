package com.app.mederbuylock.data.remote.dto

import com.google.gson.annotations.SerializedName

/** Response body returned by POST /device/{imei}/event */
data class DeviceEventResponseDto(
    @SerializedName("success") val success: Boolean,
)

/** Request body for POST /device/{imei}/event */
data class DeviceEventRequest(
    @SerializedName("event_type") val eventType: String,
    @SerializedName("details") val details: String? = null,
    @SerializedName("old_status") val oldStatus: String? = null,
    @SerializedName("new_status") val newStatus: String? = null,
)
