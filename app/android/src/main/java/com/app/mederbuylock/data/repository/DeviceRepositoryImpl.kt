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

    // Android ID is constant for the lifetime of the app installation; compute it once.
    private val androidId: String by lazy { DeviceUtils.getAndroidId(context) }

    override suspend fun getDeviceInfo(imei: String): Result<DeviceInfo> {
        return try {
            val response = apiService.getDeviceInfo(imei)

            if (response.isSuccessful) {
                val dto = requireNotNull(response.body()) { "Response body was null" }
                val deviceInfo = DeviceInfo(
                    imei = imei,
                    androidId = androidId,
                    isLocked = dto.isLocked,
                    daysOverdue = dto.daysOverdue,
                    paymentDueDate = dto.paymentDueDate ?: "",
                    userName = dto.userName ?: "",
                    phoneNumber = dto.phoneNumber ?: "",
                    paymentStatus = dto.paymentStatus,
                    accountNumber = dto.accountNumber,
                    balance = dto.balance,
                    paymentUrl = dto.paymentUrl,
                    supportPhone = dto.supportPhone,
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
        securePreferences.cachedPaymentStatus = deviceInfo.paymentStatus
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private fun DeviceInfoEntity.toDomain() = DeviceInfo(
        imei = imei,
        androidId = androidId,
        isLocked = isLocked,
        daysOverdue = daysOverdue,
        paymentDueDate = paymentDueDate,
        userName = userName,
        phoneNumber = phoneNumber,
        paymentStatus = paymentStatus,
        accountNumber = accountNumber,
        balance = balance,
        paymentUrl = paymentUrl,
        supportPhone = supportPhone,
    )

    private fun DeviceInfo.toEntity() = DeviceInfoEntity(
        imei = imei,
        androidId = androidId,
        isLocked = isLocked,
        daysOverdue = daysOverdue,
        paymentDueDate = paymentDueDate,
        userName = userName,
        phoneNumber = phoneNumber,
        paymentStatus = paymentStatus,
        accountNumber = accountNumber,
        balance = balance,
        paymentUrl = paymentUrl,
        supportPhone = supportPhone,
    )
}
