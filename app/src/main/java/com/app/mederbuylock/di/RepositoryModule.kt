package com.app.mederbuylock.di

import com.app.mederbuylock.data.repository.DeviceRepositoryImpl
import com.app.mederbuylock.data.repository.PaymentRepositoryImpl
import com.app.mederbuylock.domain.repository.DeviceRepository
import com.app.mederbuylock.domain.repository.PaymentRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindDeviceRepository(impl: DeviceRepositoryImpl): DeviceRepository

    @Binds
    @Singleton
    abstract fun bindPaymentRepository(impl: PaymentRepositoryImpl): PaymentRepository
}
