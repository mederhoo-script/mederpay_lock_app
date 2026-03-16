package com.app.mederbuylock.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "device_info")
data class DeviceInfoEntity(
    @PrimaryKey val imei: String,
    val androidId: String,
    val deviceToken: String,
    val isLocked: Boolean,
    val daysOverdue: Int,
    val paymentDueDate: String,
    val userName: String,
    val phoneNumber: String,
    val lastSyncTimestamp: Long = System.currentTimeMillis(),
)
