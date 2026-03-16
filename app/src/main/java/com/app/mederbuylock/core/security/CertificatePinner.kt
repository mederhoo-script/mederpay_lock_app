package com.app.mederbuylock.core.security

import okhttp3.CertificatePinner
import javax.inject.Inject

/**
 * Builds an OkHttp [CertificatePinner] for api.mederpay.com.
 *
 * ⚠️  PRODUCTION NOTE: Replace the placeholder SHA-256 pins below with the real
 * leaf- and backup-certificate pins obtained via:
 *   openssl s_client -connect api.mederpay.com:443 | \
 *     openssl x509 -pubkey -noout | \
 *     openssl pkey -pubin -outform der | \
 *     openssl dgst -sha256 -binary | base64
 *
 * Always include at least one backup pin so you can rotate without a forced update.
 */
class AppCertificatePinner @Inject constructor() {

    fun build(): CertificatePinner = CertificatePinner.Builder()
        // Primary leaf pin — REPLACE before release
        .add(HOST, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        // Backup / intermediate pin — REPLACE before release
        .add(HOST, "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")
        .build()

    companion object {
        private const val HOST = "api.mederpay.com"
    }
}
