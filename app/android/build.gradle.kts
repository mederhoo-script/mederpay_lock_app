plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.app.mederbuylock"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.app.mederbuylock"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // Shared secret used to authenticate Android device requests against the MederPay server.
        // Override at build time via: -PANDROID_DEVICE_API_SECRET=your_secret
        buildConfigField(
            "String",
            "DEVICE_API_SECRET",
            "\"${project.findProperty("ANDROID_DEVICE_API_SECRET") ?: "change-me-before-release"}\"",
        )

        // Base URL for the MederPay REST API consumed by this app.
        // Override at build time via: -PANDROID_API_BASE_URL=https://your-domain/api/
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"${project.findProperty("ANDROID_API_BASE_URL") ?: "https://mederbuy.vercel.app/api/"}\"",
        )
    }

    // Release signing — reads from gradle.properties (never committed to VCS).
    // In CI the properties are written to app/gradle.properties from GitHub Secrets.
    // Locally: copy app/gradle.properties.example → app/gradle.properties and fill in values.
    val keystorePath = (project.findProperty("ANDROID_KEYSTORE_PATH") as? String).orEmpty()
    val keystorePassword = (project.findProperty("ANDROID_KEYSTORE_PASSWORD") as? String).orEmpty()
    val keyAlias = (project.findProperty("ANDROID_KEY_ALIAS") as? String).orEmpty()
    val keyPassword = (project.findProperty("ANDROID_KEY_PASSWORD") as? String).orEmpty()
    val hasSigningConfig = keystorePath.isNotBlank() &&
            keystorePassword.isNotBlank() &&
            keyAlias.isNotBlank() &&
            keyPassword.isNotBlank()

    if (hasSigningConfig) {
        signingConfigs {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = keystorePassword
                keyAlias = keyAlias
                keyPassword = keyPassword
            }
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            if (hasSigningConfig) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core
    implementation(libs.core.ktx)
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.activity.compose)

    // Compose BOM
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.extended)

    // Navigation
    implementation(libs.navigation.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)
    implementation(libs.hilt.work)
    ksp(libs.hilt.ext.compiler)

    // Retrofit + OkHttp
    implementation(libs.retrofit)
    implementation(libs.retrofit.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)

    // Room
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    // WorkManager
    implementation(libs.work.runtime.ktx)

    // Security
    implementation(libs.security.crypto)

    // RootBeer
    implementation(libs.rootbeer)

    // Timber
    implementation(libs.timber)

    // Gson
    implementation(libs.gson)

    // Coroutines
    implementation(libs.coroutines.android)

    // Debug
    debugImplementation(libs.compose.ui.tooling)
}
