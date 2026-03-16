package com.app.mederbuylock.di

import android.app.admin.DevicePolicyManager
import android.content.Context
import com.app.mederbuylock.domain.repository.DeviceRepository
import com.app.mederbuylock.domain.repository.PaymentRepository
import com.app.mederbuylock.domain.usecase.CheckPaymentStatusUseCase
import com.app.mederbuylock.domain.usecase.GetDeviceInfoUseCase
import com.app.mederbuylock.domain.usecase.LockDeviceUseCase
import com.app.mederbuylock.domain.usecase.UnlockDeviceUseCase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object UseCaseModule {

    @Provides
    @Singleton
    fun provideGetDeviceInfoUseCase(repo: DeviceRepository): GetDeviceInfoUseCase =
        GetDeviceInfoUseCase(repo)

    @Provides
    @Singleton
    fun provideCheckPaymentStatusUseCase(repo: PaymentRepository): CheckPaymentStatusUseCase =
        CheckPaymentStatusUseCase(repo)

    @Provides
    @Singleton
    fun provideLockDeviceUseCase(
        @ApplicationContext context: Context,
        dpm: DevicePolicyManager,
    ): LockDeviceUseCase = LockDeviceUseCase(context, dpm)

    @Provides
    @Singleton
    fun provideUnlockDeviceUseCase(
        @ApplicationContext context: Context,
        dpm: DevicePolicyManager,
        repo: DeviceRepository,
    ): UnlockDeviceUseCase = UnlockDeviceUseCase(context, dpm, repo)
}
