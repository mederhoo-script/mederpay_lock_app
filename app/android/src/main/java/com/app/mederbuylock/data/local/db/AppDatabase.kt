package com.app.mederbuylock.data.local.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.app.mederbuylock.data.local.dao.DeviceDao
import com.app.mederbuylock.data.local.entity.DeviceInfoEntity

@Database(
    entities = [DeviceInfoEntity::class],
    version = 3,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun deviceDao(): DeviceDao

    companion object {
        const val DATABASE_NAME = "mederbuylock_db"
    }
}
