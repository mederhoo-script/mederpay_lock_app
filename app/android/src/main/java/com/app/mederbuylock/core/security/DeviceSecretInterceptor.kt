package com.app.mederbuylock.core.security

import com.app.mederbuylock.BuildConfig
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * OkHttp interceptor that attaches the shared device secret to every outgoing request.
 * This keeps authentication DRY — no call site needs to pass the header manually.
 */
class DeviceSecretInterceptor @Inject constructor() : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .header("X-Device-Secret", BuildConfig.DEVICE_API_SECRET)
            .build()
        return chain.proceed(request)
    }
}
