package com.app.mederbuylock.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.app.mederbuylock.data.local.entity.DeviceInfoEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DeviceDao {

    @Query("SELECT * FROM device_info LIMIT 1")
    suspend fun getDeviceInfo(): DeviceInfoEntity?

    @Query("SELECT * FROM device_info LIMIT 1")
    fun observeDeviceInfo(): Flow<DeviceInfoEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeviceInfo(entity: DeviceInfoEntity)

    @Query("DELETE FROM device_info")
    suspend fun clearAll()
}
