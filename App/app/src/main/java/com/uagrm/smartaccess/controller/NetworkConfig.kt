package com.uagrm.smartaccess.controller

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

object NetworkConfig {
    private const val PREFS_NAME = "smart_access_network"
    private const val KEY_BASE_URL = "base_url"
    private const val DEFAULT_BASE_URL = "http://192.168.26.5:8081"

    var baseUrl by mutableStateOf(DEFAULT_BASE_URL)
        private set

    fun initialize(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        baseUrl = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL).orEmpty().ifBlank { DEFAULT_BASE_URL }
    }

    fun saveBaseUrl(context: Context, value: String): String {
        val normalized = normalize(value)
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_BASE_URL, normalized)
            .apply()
        baseUrl = normalized
        return normalized
    }

    fun setActiveBaseUrl(value: String) {
        baseUrl = normalize(value)
    }

    fun candidateBaseUrls(): List<String> {
        return listOf(
            baseUrl,
            DEFAULT_BASE_URL,
            "http://192.168.26.5:8081",
            "http://192.168.0.50:8081",
            "http://10.0.2.2:8081",
        ).map(::normalize).distinct()
    }

    fun <T> runWithFallback(request: (String) -> T): T {
        var lastError: Exception? = null

        for (candidate in candidateBaseUrls()) {
            try {
                val result = request(candidate)
                baseUrl = candidate
                return result
            } catch (error: Exception) {
                lastError = error
            }
        }

        throw lastError ?: IllegalStateException("No se pudo conectar con el backend.")
    }

    private fun normalize(value: String): String {
        val trimmed = value.trim().removeSuffix("/")
        return when {
            trimmed.isBlank() -> DEFAULT_BASE_URL
            trimmed.startsWith("http://") || trimmed.startsWith("https://") -> trimmed
            else -> "http://$trimmed"
        }
    }
}
