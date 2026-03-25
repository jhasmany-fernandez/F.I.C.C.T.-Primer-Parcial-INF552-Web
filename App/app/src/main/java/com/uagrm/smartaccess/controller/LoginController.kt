package com.uagrm.smartaccess.controller

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.uagrm.smartaccess.model.LoginFormState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

class LoginController {
    companion object {
        private const val PREFS_NAME = "smart_access_login"
        private const val KEY_REMEMBER_ME = "remember_me"
        private const val KEY_REGISTRATION = "registration"
        private const val KEY_PASSWORD = "password"
    }

    var state by mutableStateOf(LoginFormState())
        private set

    var feedbackMessage by mutableStateOf("Ingresa tus credenciales para acceder.")
        private set

    var floatingMessage by mutableStateOf<String?>(null)
        private set

    var isBusy by mutableStateOf(false)
        private set

    var isBackendHealthy by mutableStateOf<Boolean?>(null)
        private set

    var backendStatusLabel by mutableStateOf("Verificando servidor...")
        private set

    var loggedInUserName by mutableStateOf("")
        private set

    var loggedInUserRegistration by mutableStateOf("")
        private set

    fun updateRegistrationNumber(value: String) {
        state = state.copy(registrationNumber = value.filter(Char::isLetterOrDigit).uppercase())
    }

    fun updatePassword(value: String) {
        state = state.copy(password = value)
    }

    fun updateRememberMe(value: Boolean) {
        state = state.copy(rememberMe = value)
    }

    fun togglePasswordVisibility() {
        state = state.copy(passwordVisible = !state.passwordVisible)
    }

    fun canLogin(): Boolean {
        return state.registrationNumber.isNotBlank() &&
            state.password.isNotBlank()
    }

    suspend fun checkBackendHealth() {
        isBackendHealthy = null
        backendStatusLabel = "Verificando servidor..."

        try {
            val response = withContext(Dispatchers.IO) {
                requestHealth()
            }
            val status = response.optString("status")
            val database = response.optJSONObject("database")
            val databaseAvailable = database?.optBoolean("available", false) ?: false

            isBackendHealthy = status == "ok" && databaseAvailable
            backendStatusLabel = if (isBackendHealthy == true) {
                "Backend activo"
            } else {
                "Backend con incidencias"
            }
        } catch (_: Exception) {
            isBackendHealthy = false
            backendStatusLabel = "Backend sin conexión"
        }
    }

    fun restoreRememberedSession(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val rememberMe = prefs.getBoolean(KEY_REMEMBER_ME, false)
        val registration = prefs.getString(KEY_REGISTRATION, "").orEmpty()
        val password = prefs.getString(KEY_PASSWORD, "").orEmpty()

        state = state.copy(
            registrationNumber = registration,
            password = password,
            rememberMe = rememberMe
        )

        feedbackMessage = if (rememberMe && registration.isNotBlank()) {
            "Se restauraron tus credenciales guardadas."
        } else {
            "Ingresa tus credenciales para acceder."
        }
    }

    suspend fun login(context: Context): Boolean {
        if (!canLogin()) {
            feedbackMessage = "Debes ingresar número de registro y contraseña."
            return false
        }

        isBusy = true
        return try {
            val response = withContext(Dispatchers.IO) {
                requestLogin(
                    registro = state.registrationNumber.trim(),
                    password = state.password
                )
            }
            val user = response.optJSONObject("user")
            val displayName = buildString {
                append(user?.optString("nombre").orEmpty())
                val apellido = user?.optString("apellido").orEmpty()
                if (apellido.isNotBlank()) {
                    append(" ")
                    append(apellido)
                }
            }.trim()
            feedbackMessage = if (displayName.isNotBlank()) {
                "Bienvenido $displayName."
            } else {
                response.optString("message", "Inicio de sesión correcto.")
            }
            loggedInUserName = displayName
            loggedInUserRegistration = user?.optString("registro").orEmpty()
            floatingMessage = if (displayName.isNotBlank()) {
                "Bienvenido $displayName"
            } else {
                "Bienvenido"
            }
            persistRememberedSession(context)
            true
        } catch (error: Exception) {
            feedbackMessage = error.message ?: "No se pudo iniciar sesión."
            false
        } finally {
            isBusy = false
        }
    }

    fun consumeFloatingMessage() {
        floatingMessage = null
    }

    fun pullFloatingMessage(): String? {
        val message = floatingMessage
        floatingMessage = null
        return message
    }

    private fun persistRememberedSession(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            if (state.rememberMe) {
                putBoolean(KEY_REMEMBER_ME, true)
                putString(KEY_REGISTRATION, state.registrationNumber)
                putString(KEY_PASSWORD, state.password)
            } else {
                putBoolean(KEY_REMEMBER_ME, false)
                remove(KEY_REGISTRATION)
                remove(KEY_PASSWORD)
            }
        }.apply()
    }

    private fun requestLogin(registro: String, password: String): JSONObject {
        return NetworkConfig.runWithFallback { activeBaseUrl ->
            val connection = (URL("$activeBaseUrl/api/login").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 10000
                readTimeout = 15000
                doInput = true
                doOutput = true
            }

            val body = JSONObject()
                .put("registro", registro)
                .put("password", password)
                .toString()

            connection.outputStream.use { output ->
                output.write(body.toByteArray(Charsets.UTF_8))
            }

            val statusCode = connection.responseCode
            val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            val text = stream.bufferedReader().use(BufferedReader::readText)
            val json = JSONObject(text.ifBlank { "{}" })

            if (statusCode !in 200..299) {
                throw IllegalStateException(json.optString("error", json.optString("message", "Error HTTP $statusCode")))
            }

            json
        }
    }

    private fun requestHealth(): JSONObject {
        return NetworkConfig.runWithFallback { activeBaseUrl ->
            val connection = (URL("$activeBaseUrl/vida").openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 7000
                readTimeout = 10000
                doInput = true
            }

            val statusCode = connection.responseCode
            val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            val text = stream.bufferedReader().use(BufferedReader::readText)
            val json = JSONObject(text.ifBlank { "{}" })

            if (statusCode !in 200..299) {
                throw IllegalStateException(json.optString("error", "Health HTTP $statusCode"))
            }

            json
        }
    }
}
