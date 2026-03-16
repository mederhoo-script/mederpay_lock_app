package com.app.mederbuylock.data.remote

import com.app.mederbuylock.data.remote.dto.DeviceInfoDto
import com.app.mederbuylock.data.remote.dto.PaymentStatusDto
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    /**
     * Fetches device and payment info from the MederPay server.
     *
     * GET /device/{imei}
     * Headers: X-Device-Token: <token>
     */
    @GET("device/{imei}")
    suspend fun getDeviceInfo(
        @Path("imei") imei: String,
        @Header("X-Device-Token") deviceToken: String,
    ): Response<DeviceInfoDto>

    /**
     * Triggers a fresh payment-status check on the server side.
     *
     * POST /device/{imei}/payment-status
     */
    @POST("device/{imei}/payment-status")
    suspend fun checkPaymentStatus(
        @Path("imei") imei: String,
    ): Response<PaymentStatusDto>
}
