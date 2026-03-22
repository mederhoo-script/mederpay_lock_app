package com.app.mederbuylock.core.security

import okhttp3.CertificatePinner
import javax.inject.Inject

/**
 * Builds an OkHttp [CertificatePinner] for mederbuy.vercel.app.
 *
 * ⚠️  WHY PINNING IS DISABLED FOR THIS DEPLOYMENT:
 *
 * The MederPay backend is hosted on Vercel (https://mederbuy.vercel.app/api/).
 * Vercel provisions TLS certificates automatically via Let's Encrypt, which issues
 * 90-day certificates and rotates them (including the public key) without notice.
 *
 * OkHttp SPKI/leaf certificate pinning would cause ALL network requests to fail
 * immediately after Let's Encrypt renews the certificate — there is no way to
 * pre-compute or bundle the next pin without a forced app update.
 *
 * The appropriate transport-security posture for a Vercel-hosted backend is:
 *   1. Enforce HTTPS only — done via android:usesCleartextTraffic="false"
 *      and network_security_config.xml (cleartextTrafficPermitted="false").
 *   2. Trust only the system CA store — done via the <certificates src="system"/>
 *      entry in network_security_config.xml (user-installed CAs are rejected).
 *   3. Certificate pinning — intentionally left disabled; the `.certificatePinner()`
 *      call in AppModule.kt is commented out for this reason.
 *
 * If the backend is ever migrated to a custom domain with a stable certificate
 * (e.g., via Cloudflare with a fixed intermediate CA), re-enable pinning by:
 *   1. Replacing the placeholder pins below with real SHA-256 SPKI hashes:
 *        openssl s_client -connect <your-domain>:443 </dev/null | \
 *          openssl x509 -pubkey -noout | \
 *          openssl pkey -pubin -outform der | \
 *          openssl dgst -sha256 -binary | base64
 *   2. Uncommenting the `.certificatePinner(certificatePinner.build())` call
 *      in AppModule.kt.
 */
class AppCertificatePinner @Inject constructor() {

    fun build(): CertificatePinner = CertificatePinner.Builder()
        // Placeholder pins — replace with real SPKI hashes if pinning is re-enabled
        .add(HOST, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
        .add(HOST, "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")
        .build()

    companion object {
        private const val HOST = "mederbuy.vercel.app"
    }
}
