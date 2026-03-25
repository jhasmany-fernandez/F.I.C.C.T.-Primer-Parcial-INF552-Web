package com.uagrm.smartaccess.controller

import android.os.SystemClock
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.uagrm.smartaccess.model.AppScreen

class AppController {
    enum class FloatingMessageTone {
        SUCCESS,
        ERROR,
        INFO
    }

    companion object {
        private const val LOGOUT_CONFIRMATION_WINDOW_MS = 2200L
    }

    var currentScreen by mutableStateOf(AppScreen.LOGIN)
        private set

    var floatingMessage by mutableStateOf<String?>(null)
        private set

    var floatingMessageTone by mutableStateOf(FloatingMessageTone.INFO)
        private set

    var recoveryRegistration by mutableStateOf("")
        private set

    var loggedInUserName by mutableStateOf("")
        private set

    var loggedInUserRegistration by mutableStateOf("")
        private set

    private var lastLogoutTapAt = 0L

    fun openLogin() {
        currentScreen = AppScreen.LOGIN
    }

    fun closeSession() {
        val now = SystemClock.elapsedRealtime()
        if (now - lastLogoutTapAt > LOGOUT_CONFIRMATION_WINDOW_MS) {
            lastLogoutTapAt = now
            showFloatingMessage("Toca otra vez para cerrar sesión.", FloatingMessageTone.INFO)
            return
        }

        lastLogoutTapAt = 0L
        showFloatingMessage("Cerrando sesión...", FloatingMessageTone.INFO)
        loggedInUserName = ""
        loggedInUserRegistration = ""
        currentScreen = AppScreen.LOGIN
    }

    fun openDashboard() {
        lastLogoutTapAt = 0L
        currentScreen = AppScreen.DASHBOARD
    }

    fun openPasswordRecovery(registration: String) {
        recoveryRegistration = registration
        currentScreen = AppScreen.PASSWORD_RECOVERY
    }

    fun openClassroomEntry() {
        currentScreen = AppScreen.CLASSROOM_ENTRY
    }

    fun openReportObjects() {
        currentScreen = AppScreen.REPORT_OBJECTS
    }

    fun openProfileAdmin() {
        currentScreen = AppScreen.PROFILE_ADMIN
    }

    fun updateLoggedInUserName(value: String) {
        loggedInUserName = value
    }

    fun updateLoggedInUserRegistration(value: String) {
        loggedInUserRegistration = value
    }

    fun showFloatingMessage(message: String, tone: FloatingMessageTone = FloatingMessageTone.INFO) {
        floatingMessage = message
        floatingMessageTone = tone
    }

    fun consumeFloatingMessage() {
        floatingMessage = null
        floatingMessageTone = FloatingMessageTone.INFO
    }

    fun handleBack(): Boolean {
        currentScreen = when (currentScreen) {
            AppScreen.PASSWORD_RECOVERY -> AppScreen.LOGIN
            AppScreen.CLASSROOM_ENTRY,
            AppScreen.REPORT_OBJECTS,
            AppScreen.PROFILE_ADMIN -> AppScreen.DASHBOARD

            AppScreen.DASHBOARD -> AppScreen.LOGIN
            AppScreen.LOGIN -> return false
        }
        return true
    }
}
