package com.app.mederbuylock.data.remote

import com.app.mederbuylock.data.remote.dto.DeviceEventRequest
import com.app.mederbuylock.data.remote.dto.DeviceInfoDto
import com.app.mederbuylock.data.remote.dto.DeviceEventResponseDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    /**
     * Fetches device and payment info from the MederPay server.
     * GET /device/{imei}
     * Auth header is added automatically by DeviceSecretInterceptor.
     */
    @GET("device/{imei}")
    suspend fun getDeviceInfo(
        @Path("imei") imei: String,
    ): Response<DeviceInfoDto>

    /**
     * Posts a device event (e.g. STATUS_CHECK, BOOT, LOCK_ENFORCED) to the server.
     * POST /device/{imei}/event
     * Auth header is added automatically by DeviceSecretInterceptor.
     */
    @POST("device/{imei}/event")
    suspend fun postDeviceEvent(
        @Path("imei") imei: String,
        @Body body: DeviceEventRequest,
    ): Response<DeviceEventResponseDto>
}
