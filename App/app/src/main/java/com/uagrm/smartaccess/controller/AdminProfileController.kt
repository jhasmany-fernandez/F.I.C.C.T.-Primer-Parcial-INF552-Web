package com.uagrm.smartaccess.controller

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.uagrm.smartaccess.model.AdminUserModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

class AdminProfileController {
    companion object {
        const val SYSTEM_ADMIN_REGISTRO = "222233337"
    }

    var users by mutableStateOf(emptyList<AdminUserModel>())
        private set

    var importedUsers by mutableStateOf(emptyList<AdminUserModel>())
        private set

    var feedbackMessage by mutableStateOf("Carga usuarios o importa un Excel para comenzar.")
        private set

    var floatingMessage by mutableStateOf<String?>(null)
        private set

    var isBusy by mutableStateOf(false)
        private set

    suspend fun loadUsersFromBackend() {
        isBusy = true
        try {
            withContext(Dispatchers.IO) {
                val response = request("GET", "/api/users")
                val usersJson = response.optJSONArray("users") ?: JSONArray()
                users = mapUsers(usersJson)
            }
            feedbackMessage = "Tabla administrativa actualizada desde el backend."
        } catch (error: Exception) {
            feedbackMessage = "No se pudieron cargar usuarios: ${error.message ?: error.javaClass.simpleName}"
        } finally {
            isBusy = false
        }
    }

    suspend fun importExcelFromUri(context: Context, uri: Uri) {
        isBusy = true
        try {
            val fileName = queryFileName(context, uri)
            withContext(Dispatchers.IO) {
                val base64 = readFileAsBase64(context, uri)
                val response = request(
                    method = "POST",
                    endpoint = "/api/users/import-excel",
                    body = JSONObject()
                        .put("fileName", fileName)
                        .put("fileContentBase64", base64)
                        .toString()
                )

                val importedJson = response.optJSONArray("users") ?: JSONArray()
                importedUsers = mapUsers(importedJson, imported = true)
                feedbackMessage = if (!response.isNull("databaseWarning")) {
                    response.optString("databaseWarning")
                } else {
                    "Se importaron ${importedUsers.size} filas desde $fileName."
                }
            }
        } catch (error: Exception) {
            feedbackMessage = "No se pudo importar el Excel: ${error.message ?: error.javaClass.simpleName}"
        } finally {
            isBusy = false
        }
    }

    suspend fun saveImportedUsers() {
        if (importedUsers.isEmpty()) {
            feedbackMessage = "No hay filas importadas para guardar."
            return
        }

        isBusy = true
        try {
            withContext(Dispatchers.IO) {
                val payloadUsers = JSONArray().apply {
                    importedUsers.forEach { user ->
                        put(
                            JSONObject()
                                .put("registro", user.registro)
                                .put("correo", user.correo)
                                .put("nombre", user.nombre)
                                .put("apellido", user.apellido)
                                .put("rol", user.rol)
                                .put("estado", user.estado)
                        )
                    }
                }

                val response = request(
                    method = "POST",
                    endpoint = "/api/users/bulk-save",
                    body = JSONObject().put("users", payloadUsers).toString()
                )

                val created = response.optInt("created", 0)
                val skipped = response.optInt("skipped", 0)
                importedUsers = emptyList()
                feedbackMessage = "Importación guardada. Nuevos: $created, omitidos: $skipped."
                floatingMessage = "Guardados: $created. Omitidos por mismo registro: $skipped."
                val usersResponse = request("GET", "/api/users")
                val usersJson = usersResponse.optJSONArray("users") ?: JSONArray()
                users = mapUsers(usersJson)
            }
        } catch (error: Exception) {
            feedbackMessage = "No se pudo guardar el lote: ${error.message ?: error.javaClass.simpleName}"
            floatingMessage = "No se pudo guardar el lote."
        } finally {
            isBusy = false
        }
    }

    fun consumeFloatingMessage() {
        floatingMessage = null
    }

    fun activateUser(registro: String) {
        users = users.map { user ->
            if (user.registro == registro) user.copy(estado = "Activo") else user
        }
    }

    suspend fun updateUserPassword(registro: String, password: String) {
        if (registro == SYSTEM_ADMIN_REGISTRO) {
            feedbackMessage = "La contraseña del administrador del sistema es fija."
            floatingMessage = "La clave del administrador del sistema no se puede editar."
            return
        }

        if (password.length < 8) {
            feedbackMessage = "La contraseña debe tener al menos 8 caracteres."
            floatingMessage = "Contraseña no válida."
            return
        }

        isBusy = true
        try {
            withContext(Dispatchers.IO) {
                val response = request(
                    method = "POST",
                    endpoint = "/api/users/update-password",
                    body = JSONObject()
                        .put("registro", registro)
                        .put("password", password)
                        .toString()
                )

                feedbackMessage = response.optString(
                    "message",
                    "La contraseña del registro $registro fue actualizada."
                )
                floatingMessage = "Clave actualizada para $registro."
                val usersResponse = request("GET", "/api/users")
                val usersJson = usersResponse.optJSONArray("users") ?: JSONArray()
                users = mapUsers(usersJson)
            }
        } catch (error: Exception) {
            feedbackMessage = "No se pudo actualizar la contraseña: ${error.message ?: error.javaClass.simpleName}"
            floatingMessage = "No se pudo actualizar la clave."
        } finally {
            isBusy = false
        }
    }

    private fun mapUsers(array: JSONArray, imported: Boolean = false): List<AdminUserModel> {
        return buildList {
            for (index in 0 until array.length()) {
                val item = array.getJSONObject(index)
                add(
                    AdminUserModel(
                        id = item.optInt("id", index + 1),
                        nombre = item.optString("nombre"),
                        apellido = item.optString("apellido"),
                        registro = item.optString("registro"),
                        correo = item.optString("correo"),
                        rol = item.optString("rol", "Sin asignar"),
                        estado = item.optString("estado", "Pendiente"),
                        imported = imported,
                        existsInDatabase = item.optBoolean("existsInDatabase", false)
                    )
                )
            }
        }
    }

    private fun request(method: String, endpoint: String, body: String? = null): JSONObject {
        return NetworkConfig.runWithFallback { activeBaseUrl ->
            val connection = (URL("$activeBaseUrl$endpoint").openConnection() as HttpURLConnection).apply {
                requestMethod = method
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 10000
                readTimeout = 15000
                doInput = true
                if (body != null) {
                    doOutput = true
                }
            }

            if (body != null) {
                connection.outputStream.use { output ->
                    output.write(body.toByteArray(Charsets.UTF_8))
                }
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

    private fun queryFileName(context: Context, uri: Uri): String {
        val cursor = context.contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            val nameIndex = it.getColumnIndex("_display_name")
            if (nameIndex >= 0 && it.moveToFirst()) {
                return it.getString(nameIndex)
            }
        }
        return "usuarios.xlsx"
    }

    private fun readFileAsBase64(context: Context, uri: Uri): String {
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalStateException("No se pudo leer el archivo seleccionado.")
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
}
