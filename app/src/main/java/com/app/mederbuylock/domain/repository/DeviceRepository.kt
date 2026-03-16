package com.app.mederbuylock.domain.repository

import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.domain.model.DeviceInfo

interface DeviceRepository {
    suspend fun getDeviceInfo(imei: String): Result<DeviceInfo>
    suspend fun getCachedDeviceInfo(): DeviceInfo?
    suspend fun saveDeviceInfo(deviceInfo: DeviceInfo)
}
