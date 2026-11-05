plugins {
    id("com.android.application")
}

android {
    namespace = "com.tom.monbudget"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.tom.monbudget"
        minSdk = 24
        targetSdk = 35
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1.0." + (System.getenv("GITHUB_RUN_NUMBER") ?: "1")
    }

    // Clé fixe : permet d'installer chaque nouvelle version PAR-DESSUS l'ancienne sans perdre les données.
    signingConfigs {
        create("fixed") {
            storeFile = file("monbudget.keystore")
            storePassword = "monbudget"
            keyAlias = "monbudget"
            keyPassword = "monbudget"
        }
    }
    buildTypes {
        debug { signingConfig = signingConfigs.getByName("fixed") }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity:1.9.3")
    implementation("androidx.core:core:1.15.0")
}
