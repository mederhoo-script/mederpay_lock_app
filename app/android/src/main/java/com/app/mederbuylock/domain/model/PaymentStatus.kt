package com.app.mederbuylock.domain.model

/**
 * Represents all possible payment/device states returned by the MederPay API.
 */
sealed class PaymentStatus {
    /** Device is paid up — no action needed. */
    data object Active : PaymentStatus()

    /** Device has been locked by the server. */
    data object Locked : PaymentStatus()

    /** Payment is past due. */
    data class Overdue(val daysOverdue: Int) : PaymentStatus()

    /** Payment is overdue but within the grace window. */
    data class GracePeriod(val daysRemaining: Int) : PaymentStatus()

    companion object {
        /**
         * Maps a raw status string returned by the server to a [PaymentStatus] instance.
         *
         * The `status` parameter is nullable to guard against Gson silently injecting `null`
         * when the `payment_status` field is absent from the JSON response — calling `.uppercase()`
         * on a `null` string would otherwise produce a NullPointerException at runtime.
         * A `null` or unrecognised value defaults to [Active].
         */
        fun fromString(status: String?, daysOverdue: Int = 0, daysRemaining: Int = 0): PaymentStatus =
            when (status?.uppercase()) {
                "ACTIVE", "COMPLETED" -> Active
                "LOCKED", "LOCK"      -> Locked
                "OVERDUE", "DEFAULTED" -> Overdue(daysOverdue)
                "GRACE_PERIOD", "GRACE" -> GracePeriod(daysRemaining)
                else -> Active
            }
    }
}
