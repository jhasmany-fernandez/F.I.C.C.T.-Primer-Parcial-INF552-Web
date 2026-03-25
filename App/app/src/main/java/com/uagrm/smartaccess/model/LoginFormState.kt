package com.uagrm.smartaccess.model

data class LoginFormState(
    val registrationNumber: String = "",
    val password: String = "",
    val rememberMe: Boolean = true,
    val passwordVisible: Boolean = false
) {
    val registrationError: Boolean
        get() = registrationNumber.isNotBlank() && registrationNumber.length < 5

    val passwordError: Boolean
        get() = password.isNotBlank() && password.length < 6
}
