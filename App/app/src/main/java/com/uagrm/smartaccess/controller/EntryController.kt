package com.uagrm.smartaccess.controller

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL
import kotlin.random.Random

class EntryController {
    companion object {
        const val CODE_REFRESH_SECONDS = 20
    }

    var generatedCode by mutableStateOf(generateAccessCode())
        private set

    var displayedCode by mutableStateOf(generatedCode)
        private set

    var generationTrigger by mutableIntStateOf(0)
        private set

    var isGenerating by mutableStateOf(false)
        private set

    var generationError by mutableStateOf<String?>(null)
        private set

    var isGeneratorActive by mutableStateOf(false)
        private set

    var secondsRemaining by mutableIntStateOf(CODE_REFRESH_SECONDS)
        private set

    var fingerprintStatusMessage by mutableStateOf("Usa la huella registrada en tu teléfono para habilitar el acceso.")
        private set

    var fingerprintAuthenticated by mutableStateOf<Boolean?>(null)
        private set

    var faceStatusMessage by mutableStateOf("Usa el reconocimiento facial del teléfono para habilitar el acceso.")
        private set

    var faceAuthenticated by mutableStateOf<Boolean?>(null)
        private set

    fun requestCodeGeneration(force: Boolean = false) {
        if (!isGenerating && (force || !isGeneratorActive)) {
            generationTrigger += 1
        }
    }

    fun activateGenerator() {
        if (isGeneratorActive || isGenerating) {
            return
        }

        isGeneratorActive = true
        secondsRemaining = CODE_REFRESH_SECONDS
        requestCodeGeneration(force = true)
    }

    fun tickCountdown() {
        if (!isGeneratorActive || isGenerating) {
            return
        }

        if (secondsRemaining > 0) {
            secondsRemaining -= 1
            return
        }

        secondsRemaining = CODE_REFRESH_SECONDS
        requestCodeGeneration(force = true)
    }

    fun beginGeneration() {
        isGenerating = true
        generationError = null
    }

    fun animateCodePreview() {
        displayedCode = generateAccessCode()
    }

    fun finishGeneration(finalCode: String) {
        generatedCode = finalCode
        displayedCode = finalCode
        isGenerating = false
        generationError = null
        secondsRemaining = CODE_REFRESH_SECONDS
    }

    fun failGeneration(message: String) {
        isGenerating = false
        generationError = message
        isGeneratorActive = false
    }

    fun onFingerprintAuthenticated() {
        fingerprintAuthenticated = true
        fingerprintStatusMessage = "Acceso habilitado por huella dactilar."
    }

    fun onFingerprintError(message: String) {
        fingerprintAuthenticated = false
        fingerprintStatusMessage = message
    }

    fun resetFingerprintState() {
        fingerprintAuthenticated = null
        fingerprintStatusMessage = "Usa la huella registrada en tu teléfono para habilitar el acceso."
    }

    fun onFaceAuthenticated() {
        faceAuthenticated = true
        faceStatusMessage = "Acceso habilitado por reconocimiento facial."
    }

    fun onFaceError(message: String) {
        faceAuthenticated = false
        faceStatusMessage = message
    }

    fun resetFaceState() {
        faceAuthenticated = null
        faceStatusMessage = "Usa el reconocimiento facial del teléfono para habilitar el acceso."
    }

    fun createFinalCode(): String {
        return generateAccessCode()
    }

    suspend fun requestSharedAccessCode(): String {
        return withContext(Dispatchers.IO) {
            requestRemoteCode()
        }
    }

    private fun requestRemoteCode(): String {
        return NetworkConfig.runWithFallback { activeBaseUrl ->
            val connection = (URL("$activeBaseUrl/api/access-code/generate").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10000
                readTimeout = 15000
                doInput = true
            }

            val statusCode = connection.responseCode
            val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            val text = stream.bufferedReader().use(BufferedReader::readText)
            val json = JSONObject(text.ifBlank { "{}" })

            if (statusCode !in 200..299) {
                throw IllegalStateException(json.optString("error", "Error HTTP $statusCode"))
            }

            json.optString("code").ifBlank {
                throw IllegalStateException("El backend no devolvió un código.")
            }
        }
    }

    suspend fun authorizeBiometricAccess(method: String) {
        withContext(Dispatchers.IO) {
            NetworkConfig.runWithFallback { activeBaseUrl ->
                val connection = (URL("$activeBaseUrl/api/biometric-access/authorize").openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    connectTimeout = 10000
                    readTimeout = 15000
                    doInput = true
                    doOutput = true
                }

                val body = JSONObject()
                    .put("method", method)
                    .toString()

                connection.outputStream.use { output ->
                    output.write(body.toByteArray(Charsets.UTF_8))
                }

                val statusCode = connection.responseCode
                val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
                val text = stream.bufferedReader().use(BufferedReader::readText)
                val json = JSONObject(text.ifBlank { "{}" })

                if (statusCode !in 200..299) {
                    throw IllegalStateException(json.optString("error", "Error HTTP $statusCode"))
                }
            }
        }
    }

    private fun generateAccessCode(): String {
        return Random.nextInt(100_000, 1_000_000).toString()
    }
}
