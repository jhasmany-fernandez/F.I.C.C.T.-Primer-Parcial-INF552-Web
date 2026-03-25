package com.uagrm.smartaccess.controller

import android.graphics.Bitmap
import android.util.Base64
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.uagrm.smartaccess.model.ProblemTypeModel
import com.uagrm.smartaccess.model.ReportFormState
import com.uagrm.smartaccess.model.ReportPriorityModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

class ReportController {
    data class SubmitResult(
        val success: Boolean,
        val message: String,
    )

    val problemTypes = listOf(
        ProblemTypeModel("Equipo de computación", "Tecnología"),
        ProblemTypeModel("Proyector o pantalla", "Tecnología"),
        ProblemTypeModel("Audio o internet", "Tecnología"),
        ProblemTypeModel("Electricidad", "Infraestructura"),
        ProblemTypeModel("Aire acondicionado", "Infraestructura"),
        ProblemTypeModel("Mobiliario", "Aula"),
        ProblemTypeModel("Puertas o ventanas", "Aula"),
        ProblemTypeModel("Limpieza o higiene", "Aula"),
        ProblemTypeModel("Iluminación o ambiente", "Aula"),
        ProblemTypeModel("Seguridad o riesgo", "Seguridad"),
        ProblemTypeModel("Otro problema", "General")
    )

    val stateOptions = listOf("No funciona", "Funciona mal", "Detalle estético")

    var state by mutableStateOf(
        ReportFormState(
            selectedProblem = "",
            selectedState = ""
        )
    )
        private set

    var feedbackMessage by mutableStateOf("Completa el formulario y registra el reporte.")
        private set

    var isBusy by mutableStateOf(false)
        private set

    val priority: ReportPriorityModel
        get() = when (state.selectedState) {
            "No funciona" -> ReportPriorityModel.HIGH
            "Funciona mal" -> ReportPriorityModel.MEDIUM
            else -> ReportPriorityModel.LOW
        }

    val canSelectState: Boolean
        get() = state.selectedProblem.isNotBlank()

    val canOpenCamera: Boolean
        get() = state.selectedProblem.isNotBlank() && state.selectedState.isNotBlank()

    fun canWriteDescription(hasPhoto: Boolean): Boolean {
        return canOpenCamera && hasPhoto
    }

    fun canSubmit(hasPhoto: Boolean): Boolean {
        return state.selectedProblem.isNotBlank() &&
            state.selectedState.isNotBlank() &&
            hasPhoto &&
            state.description.isNotBlank()
    }

    fun updateProblem(value: String) {
        state = state.copy(selectedProblem = value)
    }

    fun updateState(value: String) {
        state = state.copy(selectedState = value)
    }

    fun updateDescription(value: String) {
        state = state.copy(description = value)
    }

    suspend fun submitReport(
        reporterRegistration: String,
        reporterName: String,
        evidencePhoto: Bitmap?
    ): SubmitResult {
        if (reporterRegistration.isBlank()) {
            feedbackMessage = "No se identificó el usuario logueado."
            return SubmitResult(false, feedbackMessage)
        }

        if (state.description.isBlank()) {
            feedbackMessage = "Debes escribir una descripción del reporte."
            return SubmitResult(false, feedbackMessage)
        }

        isBusy = true
        return try {
            val response = withContext(Dispatchers.IO) {
                request(
                    body = JSONObject()
                        .put("reporterRegistro", reporterRegistration)
                        .put("reporterNombre", reporterName.ifBlank { reporterRegistration })
                        .put("problemType", state.selectedProblem)
                        .put("problemState", state.selectedState)
                        .put("priority", priority.label)
                        .put("description", state.description.trim())
                        .put("evidenceImageBase64", evidencePhoto?.toBase64())
                        .toString()
                )
            }

            resetForm()
            feedbackMessage = response.optString("message", "Reporte registrado correctamente.")
            SubmitResult(true, feedbackMessage)
        } catch (error: Exception) {
            feedbackMessage = error.message ?: "No se pudo registrar el reporte."
            SubmitResult(false, feedbackMessage)
        } finally {
            isBusy = false
        }
    }

    private fun resetForm() {
        state = ReportFormState(
            selectedProblem = "",
            selectedState = "",
            description = ""
        )
    }

    private fun request(body: String): JSONObject {
        return NetworkConfig.runWithFallback { activeBaseUrl ->
            val connection = (URL("$activeBaseUrl/api/reports").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 10000
                readTimeout = 15000
                doInput = true
                doOutput = true
            }

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

    private fun Bitmap.toBase64(): String {
        val output = ByteArrayOutputStream()
        compress(Bitmap.CompressFormat.JPEG, 82, output)
        return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
    }
}
