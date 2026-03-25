package com.uagrm.smartaccess.model

data class AdminUserModel(
    val id: Int,
    val nombre: String,
    val apellido: String,
    val registro: String,
    val correo: String,
    val rol: String,
    val estado: String,
    val imported: Boolean = false,
    val existsInDatabase: Boolean = false
)
