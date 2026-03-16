package com.app.mederbuylock.data.repository

import android.content.Context
import com.app.mederbuylock.core.utils.DeviceUtils
import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.data.local.SecurePreferences
import com.app.mederbuylock.data.local.dao.DeviceDao
import com.app.mederbuylock.data.local.entity.DeviceInfoEntity
import com.app.mederbuylock.data.remote.ApiService
import com.app.mederbuylock.domain.model.DeviceInfo
import com.app.mederbuylock.domain.repository.DeviceRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject

class DeviceRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService,
    private val deviceDao: DeviceDao,
    private val securePreferences: SecurePreferences,
) : DeviceRepository {

    override suspend fun getDeviceInfo(imei: String): Result<DeviceInfo> {
        return try {
            val token = securePreferences.deviceToken.orEmpty()
            val response = apiService.getDeviceInfo(imei, token)

            if (response.isSuccessful) {
                val dto = requireNotNull(response.body()) { "Response body was null" }
                val deviceInfo = DeviceInfo(
                    imei = dto.imei,
                    androidId = DeviceUtils.getAndroidId(context),
                    deviceToken = token,
                    isLocked = dto.isLocked,
                    daysOverdue = dto.daysOverdue,
                    paymentDueDate = dto.paymentDueDate,
                    userName = dto.userName,
                    phoneNumber = dto.phoneNumber,
                )
                saveDeviceInfo(deviceInfo)
                Result.Success(deviceInfo)
            } else {
                Timber.w("API error ${response.code()}: ${response.message()} — serving cache")
                getCachedDeviceInfo()
                    ?.let { Result.Success(it) }
                    ?: Result.Error("API error: ${response.code()} ${response.message()}")
            }
        } catch (e: Exception) {
            Timber.e(e, "Network failure — serving cache")
            getCachedDeviceInfo()
                ?.let { Result.Success(it) }
                ?: Result.Error(e.message ?: "Unknown network error", e)
        }
    }

    override suspend fun getCachedDeviceInfo(): DeviceInfo? =
        deviceDao.getDeviceInfo()?.toDomain()

    override suspend fun saveDeviceInfo(deviceInfo: DeviceInfo) {
        deviceDao.insertDeviceInfo(deviceInfo.toEntity())
        securePreferences.isDeviceLocked = deviceInfo.isLocked
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private fun DeviceInfoEntity.toDomain() = DeviceInfo(
        imei = imei,
        androidId = androidId,
        deviceToken = deviceToken,
        isLocked = isLocked,
        daysOverdue = daysOverdue,
        paymentDueDate = paymentDueDate,
        userName = userName,
        phoneNumber = phoneNumber,
    )

    private fun DeviceInfo.toEntity() = DeviceInfoEntity(
        imei = imei,
        androidId = androidId,
        deviceToken = deviceToken,
        isLocked = isLocked,
        daysOverdue = daysOverdue,
        paymentDueDate = paymentDueDate,
        userName = userName,
        phoneNumber = phoneNumber,
    )
}
