package com.app.mederbuylock.domain.usecase

import com.app.mederbuylock.core.utils.Result
import com.app.mederbuylock.domain.model.DeviceInfo
import com.app.mederbuylock.domain.repository.DeviceRepository
import javax.inject.Inject

class GetDeviceInfoUseCase @Inject constructor(
    private val deviceRepository: DeviceRepository,
) {
    suspend operator fun invoke(imei: String): Result<DeviceInfo> =
        deviceRepository.getDeviceInfo(imei)
}
