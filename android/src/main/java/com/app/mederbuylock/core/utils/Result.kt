package com.app.mederbuylock.core.utils

/**
 * Generic wrapper for async operation results used across all layers.
 */
sealed class Result<out T> {
    data class Success<out T>(val data: T) : Result<T>()
    data class Error(val message: String, val throwable: Throwable? = null) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}
