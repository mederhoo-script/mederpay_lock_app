package com.app.mederbuylock.data.remote

import com.app.mederbuylock.data.remote.dto.DeviceEventRequest
import com.app.mederbuylock.data.remote.dto.DeviceInfoDto
import com.app.mederbuylock.data.remote.dto.DeviceEventResponseDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    /**
     * Fetches device and payment info from the MederPay server.
     *
     * GET /device/{imei}
     * Headers: X-Device-Secret: <shared_secret>
     */
    @GET("device/{imei}")
    suspend fun getDeviceInfo(
        @Path("imei") imei: String,
        @Header("X-Device-Secret") deviceSecret: String,
    ): Response<DeviceInfoDto>

    /**
     * Posts a device event (e.g. STATUS_CHECK, BOOT, LOCK_ENFORCED) to the server.
     *
     * POST /device/{imei}/event
     * Headers: X-Device-Secret: <shared_secret>
     */
    @POST("device/{imei}/event")
    suspend fun postDeviceEvent(
        @Path("imei") imei: String,
        @Header("X-Device-Secret") deviceSecret: String,
        @Body body: DeviceEventRequest,
    ): Response<DeviceEventResponseDto>
}
