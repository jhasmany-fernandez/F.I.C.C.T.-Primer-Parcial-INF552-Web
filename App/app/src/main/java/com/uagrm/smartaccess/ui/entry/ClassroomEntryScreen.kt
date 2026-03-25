package com.uagrm.smartaccess.ui.entry

import android.app.Activity
import android.hardware.biometrics.BiometricPrompt
import android.os.Build
import android.os.CancellationSignal
import androidx.biometric.BiometricManager
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Face
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.uagrm.smartaccess.R
import com.uagrm.smartaccess.controller.EntryController
import com.uagrm.smartaccess.model.EntryMethodModel
import com.uagrm.smartaccess.model.EntryMethodType
import com.uagrm.smartaccess.ui.theme.AccentRed
import com.uagrm.smartaccess.ui.theme.Line
import com.uagrm.smartaccess.ui.theme.Mint
import com.uagrm.smartaccess.ui.theme.Night
import com.uagrm.smartaccess.ui.theme.NightSoft
import com.uagrm.smartaccess.ui.theme.Sky
import com.uagrm.smartaccess.ui.theme.WhiteText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ClassroomEntryScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit = {}
) {
    val controller = remember { EntryController() }
    val context = LocalContext.current
    val activity = context as? Activity
    val coroutineScope = rememberCoroutineScope()
    val methods = listOf(
        EntryMethodModel(
            title = "Reconocimiento facial",
            subtitle = "Acceso biométrico rápido.",
            type = EntryMethodType.FACE
        ),
        EntryMethodModel(
            title = "Generador código",
            subtitle = "PIN temporal de 6 dígitos.",
            type = EntryMethodType.CODE_GENERATOR
        ),
        EntryMethodModel(
            title = "Huella dactilar",
            subtitle = "Validación directa con el sensor.",
            type = EntryMethodType.FINGERPRINT
        )
    )

    LaunchedEffect(controller.isGeneratorActive, controller.isGenerating) {
        while (controller.isGeneratorActive) {
            delay(1000)
            controller.tickCountdown()
        }
    }

    val launchBiometricAuth = remember(activity) {
        { method: String ->
            val currentActivity = activity

            if (currentActivity == null) {
                if (method == "face") {
                    controller.onFaceError("No se pudo acceder al servicio biométrico del teléfono.")
                } else {
                    controller.onFingerprintError("No se pudo acceder al servicio biométrico del teléfono.")
                }
            } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                val message = "La biometría del sistema requiere Android 9 o superior."
                if (method == "face") controller.onFaceError(message) else controller.onFingerprintError(message)
            } else {
                when (
                    BiometricManager.from(currentActivity).canAuthenticate(
                        BiometricManager.Authenticators.BIOMETRIC_STRONG or
                            BiometricManager.Authenticators.BIOMETRIC_WEAK
                    )
                ) {
                    BiometricManager.BIOMETRIC_SUCCESS -> {
                        if (method == "face") {
                            controller.resetFaceState()
                        } else {
                            controller.resetFingerprintState()
                        }

                        val callback = object : BiometricPrompt.AuthenticationCallback() {
                            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                                coroutineScope.launch {
                                    try {
                                        controller.authorizeBiometricAccess(method)
                                        if (method == "face") {
                                            controller.onFaceAuthenticated()
                                        } else {
                                            controller.onFingerprintAuthenticated()
                                        }
                                    } catch (error: Exception) {
                                        val message = error.message ?: "No se pudo notificar al backend."
                                        if (method == "face") {
                                            controller.onFaceError(message)
                                        } else {
                                            controller.onFingerprintError(message)
                                        }
                                    }
                                }
                            }

                            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                                if (method == "face") {
                                    controller.onFaceError(errString.toString())
                                } else {
                                    controller.onFingerprintError(errString.toString())
                                }
                            }

                            override fun onAuthenticationFailed() {
                                if (method == "face") {
                                    controller.onFaceError("El reconocimiento facial no coincide. Intenta nuevamente.")
                                } else {
                                    controller.onFingerprintError("La huella no coincide. Intenta nuevamente.")
                                }
                            }
                        }

                        val cancellationSignal = CancellationSignal()
                        val negativeText = "Cancelar"
                        val title = if (method == "face") {
                            "Acceso con reconocimiento facial"
                        } else {
                            "Acceso con huella dactilar"
                        }
                        val subtitle = if (method == "face") {
                            "Confirma la biometría facial del teléfono para habilitar el ingreso."
                        } else {
                            "Confirma tu huella registrada para habilitar el ingreso."
                        }

                        BiometricPrompt.Builder(currentActivity)
                            .setTitle(title)
                            .setSubtitle(subtitle)
                            .setNegativeButton(
                                negativeText,
                                ContextCompat.getMainExecutor(currentActivity)
                            ) { _, _ ->
                                if (method == "face") {
                                    controller.onFaceError("Autenticación cancelada.")
                                } else {
                                    controller.onFingerprintError("Autenticación cancelada.")
                                }
                            }
                            .build()
                            .authenticate(
                                cancellationSignal,
                                ContextCompat.getMainExecutor(currentActivity),
                                callback
                            )
                    }

                    BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> {
                        val message = "Este teléfono no tiene biometría disponible."
                        if (method == "face") controller.onFaceError(message) else controller.onFingerprintError(message)
                    }

                    BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> {
                        val message = "El sensor biométrico no está disponible ahora."
                        if (method == "face") controller.onFaceError(message) else controller.onFingerprintError(message)
                    }

                    BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
                        val message = if (method == "face") {
                            "No hay biometría facial registrada en el teléfono."
                        } else {
                            "No hay huellas registradas en el teléfono."
                        }
                        if (method == "face") controller.onFaceError(message) else controller.onFingerprintError(message)
                    }

                    else -> {
                        val message = "La autenticación biométrica no está disponible."
                        if (method == "face") controller.onFaceError(message) else controller.onFingerprintError(message)
                    }
                }
            }
        }
    }

    Box(
        modifier = modifier.fillMaxSize()
    ) {
        Image(
            painter = painterResource(R.drawable.ficct_background),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xCC061A31))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onBack,
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White.copy(alpha = 0.14f),
                        contentColor = WhiteText
                    )
                ) {
                    Icon(
                        imageVector = Icons.Filled.ArrowBack,
                        contentDescription = "Volver",
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Volver")
                }

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = AccentRed.copy(alpha = 0.18f)
                ) {
                    Text(
                        text = "Ingreso Aula",
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = WhiteText
                    )
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            Text(
                text = "Métodos de ingreso",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = WhiteText
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Elige una opción para acceder.",
                style = MaterialTheme.typography.bodySmall,
                color = WhiteText.copy(alpha = 0.72f)
            )

            Spacer(modifier = Modifier.height(20.dp))

            methods.forEach { method ->
                EntryMethodCard(
                    method = method,
                    controller = controller,
                    onOpenFingerprint = { launchBiometricAuth("fingerprint") },
                    onOpenFace = { launchBiometricAuth("face") }
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun EntryMethodCard(
    method: EntryMethodModel,
    controller: EntryController,
    onOpenFingerprint: () -> Unit,
    onOpenFace: () -> Unit
) {
    LaunchedEffect(method.type, controller.generationTrigger) {
        if (method.type != EntryMethodType.CODE_GENERATOR || controller.generationTrigger == 0) return@LaunchedEffect

        controller.beginGeneration()

        repeat(20) {
            controller.animateCodePreview()
            delay(100)
        }

        try {
            val finalCode = controller.requestSharedAccessCode()
            controller.finishGeneration(finalCode)
        } catch (error: Exception) {
            controller.failGeneration(error.message ?: "No se pudo sincronizar el código con el backend.")
        }
    }

    val accent = when (method.type) {
        EntryMethodType.FACE -> AccentRed
        EntryMethodType.CODE_GENERATOR -> Sky
        EntryMethodType.FINGERPRINT -> Mint
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.96f)),
        border = BorderStroke(1.dp, Line.copy(alpha = 0.65f))
    ) {
        Column(
            modifier = Modifier.padding(18.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(accent, NightSoft)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    when (method.type) {
                        EntryMethodType.FACE -> {
                            Icon(
                                imageVector = Icons.Filled.Face,
                                contentDescription = null,
                                tint = WhiteText,
                                modifier = Modifier.size(28.dp)
                            )
                        }

                        EntryMethodType.CODE_GENERATOR -> {
                            Icon(
                                painter = painterResource(R.drawable.ic_keypad),
                                contentDescription = null,
                                tint = WhiteText,
                                modifier = Modifier.size(28.dp)
                            )
                        }

                        EntryMethodType.FINGERPRINT -> {
                            Icon(
                                painter = painterResource(R.drawable.ic_fingerprint),
                                contentDescription = null,
                                tint = WhiteText,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = method.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Night
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = method.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = Night.copy(alpha = 0.64f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (method.type == EntryMethodType.CODE_GENERATOR) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    color = accent.copy(alpha = 0.09f)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Código actual",
                            style = MaterialTheme.typography.labelMedium,
                            color = Night.copy(alpha = 0.62f)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = controller.displayedCode,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = accent
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (controller.isGeneratorActive) {
                                "Cambio automático en ${controller.secondsRemaining}s"
                            } else {
                                "Activa la rotación automática"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = Night.copy(alpha = 0.68f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                controller.generationError?.let { message ->
                    Text(
                        text = message,
                        style = MaterialTheme.typography.bodySmall,
                        color = AccentRed
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }

            if (method.type == EntryMethodType.FINGERPRINT) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    color = accent.copy(alpha = 0.09f)
                ) {
                    Text(
                        text = controller.fingerprintStatusMessage,
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 14.dp),
                        style = MaterialTheme.typography.bodySmall,
                        color = when (controller.fingerprintAuthenticated) {
                            true -> Night
                            false -> AccentRed
                            null -> Night.copy(alpha = 0.68f)
                        }
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))
            }

            if (method.type == EntryMethodType.FACE) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    color = accent.copy(alpha = 0.09f)
                ) {
                    Text(
                        text = controller.faceStatusMessage,
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 14.dp),
                        style = MaterialTheme.typography.bodySmall,
                        color = when (controller.faceAuthenticated) {
                            true -> Night
                            false -> AccentRed
                            null -> Night.copy(alpha = 0.68f)
                        }
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))
            }

            Button(
                onClick = {
                    when (method.type) {
                        EntryMethodType.FACE -> onOpenFace()
                        EntryMethodType.CODE_GENERATOR -> {
                            if (!controller.isGenerating) {
                                controller.activateGenerator()
                            }
                        }

                        EntryMethodType.FINGERPRINT -> onOpenFingerprint()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = accent.copy(alpha = 0.92f),
                    contentColor = if (accent == Mint) Night else WhiteText
                ),
                enabled = !controller.isGenerating
            ) {
                Text(
                    if (method.type == EntryMethodType.CODE_GENERATOR) {
                        if (controller.isGenerating) "Generando código..."
                        else if (controller.isGeneratorActive) "Generador activo"
                        else "Activar generador código"
                    } else if (method.type == EntryMethodType.FACE) {
                        "Autenticar con rostro"
                    } else if (method.type == EntryMethodType.FINGERPRINT) {
                        "Autenticar con huella"
                    } else {
                        "Abrir módulo"
                    }
                )
            }
        }
    }
}
