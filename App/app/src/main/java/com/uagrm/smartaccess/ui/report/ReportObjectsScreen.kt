package com.uagrm.smartaccess.ui.report

import android.Manifest
import android.graphics.Bitmap
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.BackHandler
import androidx.core.content.ContextCompat
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.uagrm.smartaccess.R
import com.uagrm.smartaccess.controller.AppController
import com.uagrm.smartaccess.controller.ReportController
import com.uagrm.smartaccess.model.ReportPriorityModel
import com.uagrm.smartaccess.ui.theme.AccentRed
import com.uagrm.smartaccess.ui.theme.AccentRedDark
import com.uagrm.smartaccess.ui.theme.Line
import com.uagrm.smartaccess.ui.theme.Mint
import com.uagrm.smartaccess.ui.theme.Night
import com.uagrm.smartaccess.ui.theme.Sky
import com.uagrm.smartaccess.ui.theme.WhiteText
import kotlinx.coroutines.launch

@Composable
fun ReportObjectsScreen(
    modifier: Modifier = Modifier,
    loggedInUserName: String = "",
    loggedInUserRegistration: String = "",
    onFloatingMessage: (String, AppController.FloatingMessageTone) -> Unit = { _, _ -> },
    onBack: () -> Unit = {}
) {
    val controller = remember { ReportController() }
    val state = controller.state
    val priority = controller.priority
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var capturedPhoto by remember { mutableStateOf<Bitmap?>(null) }
    var cameraMessage by remember { mutableStateOf("Captura evidencia del reporte con la cámara del teléfono.") }
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        if (bitmap != null) {
            capturedPhoto = bitmap
            cameraMessage = "Toca la imagen para volver a capturar."
        } else {
            cameraMessage = "No se capturó la foto. Intenta nuevamente."
        }
    }
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            cameraLauncher.launch(null)
        } else {
            cameraMessage = "Debes permitir el acceso a la cámara para adjuntar evidencia."
        }
    }

    val openCamera = {
        if (!controller.canOpenCamera) {
            onFloatingMessage("Primero selecciona el tipo de problema y el estado.", AppController.FloatingMessageTone.ERROR)
        } else {
            when {
                ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED -> {
                    cameraLauncher.launch(null)
                }

                else -> {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                }
            }
        }
    }

    BackHandler {
        onFloatingMessage("Se canceló el reporte.", AppController.FloatingMessageTone.INFO)
        onBack()
    }

    Box(modifier = modifier.fillMaxSize()) {
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
                    onClick = {
                        onFloatingMessage("Se canceló el reporte.", AppController.FloatingMessageTone.INFO)
                        onBack()
                    },
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
                        text = "Reportar objetos",
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = WhiteText
                    )
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            Text(
                text = "Formulario de reporte",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = WhiteText
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Describe el problema, adjunta evidencia y registra el incidente.",
                style = MaterialTheme.typography.bodyMedium,
                color = WhiteText.copy(alpha = 0.76f)
            )

            Spacer(modifier = Modifier.height(18.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(30.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.94f))
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 22.dp)
                ) {
                    if (loggedInUserName.isNotBlank()) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xFFF5F8FF),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFDCE6F7))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    modifier = Modifier.size(42.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    color = AccentRed.copy(alpha = 0.12f)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = loggedInUserName.firstOrNull()?.uppercase() ?: "U",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = AccentRedDark
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column {
                                    Text(
                                        text = "Usuario logueado",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = Night.copy(alpha = 0.62f)
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = loggedInUserName,
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Night
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFFFBFCFF),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE4EAF4))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Clasificación",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = Night
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            SelectionField(
                                label = "Tipo de problema",
                                value = state.selectedProblem.ifBlank { "Selecciona un tipo de problema" },
                                options = controller.problemTypes.map { "${it.label} · ${it.category}" },
                                enabled = true,
                                onValueSelected = { selected ->
                                    controller.updateProblem(selected.substringBefore(" · "))
                                }
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            SelectionField(
                                label = "Estado",
                                value = state.selectedState.ifBlank { "Selecciona el estado" },
                                options = controller.stateOptions,
                                enabled = controller.canSelectState,
                                onValueSelected = controller::updateState
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    PriorityCard(priority = priority)

                    Spacer(modifier = Modifier.height(14.dp))

                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFFF9FBFF),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE7EDF6))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Evidencia",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = Night
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            PhotoPlaceholder(
                                photo = capturedPhoto,
                                message = cameraMessage,
                                enabled = controller.canOpenCamera,
                                onCapturePhoto = openCamera
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = Color(0xFFFDFEFF),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE9EEF6))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Detalle",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = Night
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedTextField(
                                value = state.description,
                                onValueChange = controller::updateDescription,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(142.dp),
                                label = { Text("Descripción") },
                                placeholder = { Text("Describe brevemente lo observado") },
                                colors = reportFieldColors(),
                                shape = RoundedCornerShape(18.dp),
                                enabled = controller.canWriteDescription(capturedPhoto != null)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Button(
                        onClick = {
                            scope.launch {
                                val result = controller.submitReport(
                                    reporterRegistration = loggedInUserRegistration,
                                    reporterName = loggedInUserName,
                                    evidencePhoto = capturedPhoto
                                )
                                if (result.success) {
                                    capturedPhoto = null
                                    cameraMessage = "Captura evidencia del reporte con la cámara del teléfono."
                                    onFloatingMessage("Reporte registrado correctamente.", AppController.FloatingMessageTone.SUCCESS)
                                } else {
                                    onFloatingMessage(result.message, AppController.FloatingMessageTone.ERROR)
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AccentRed,
                            contentColor = WhiteText
                        ),
                        enabled = !controller.isBusy && controller.canSubmit(capturedPhoto != null)
                    ) {
                        Text(if (controller.isBusy) "Registrando..." else "Registrar reporte")
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = controller.feedbackMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (controller.feedbackMessage.startsWith("Reporte registrado")) Sky else Night.copy(alpha = 0.7f)
                    )
                }
            }
        }
    }
}

@Composable
private fun SelectionField(
    label: String,
    value: String,
    options: List<String>,
    enabled: Boolean,
    onValueSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = Night
        )
        Spacer(modifier = Modifier.height(6.dp))
        Box {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = enabled) { expanded = true },
                shape = RoundedCornerShape(18.dp),
                color = if (enabled) Color.White else Color(0xFFF3F5F8),
                border = androidx.compose.foundation.BorderStroke(1.dp, if (enabled) Color(0xFFDCE2EC) else Color(0xFFE7EBF1))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = value,
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (enabled) Night else Night.copy(alpha = 0.45f)
                    )
                    Icon(
                        imageVector = Icons.Filled.KeyboardArrowDown,
                        contentDescription = null,
                        tint = if (enabled) Sky else Sky.copy(alpha = 0.35f)
                    )
                }
            }

            DropdownMenu(
                expanded = enabled && expanded,
                onDismissRequest = { expanded = false }
            ) {
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option) },
                        onClick = {
                            onValueSelected(option)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun PriorityCard(priority: ReportPriorityModel) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = Color(0xFFFFFBF0),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF3E6B0))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Prioridad automática",
                    style = MaterialTheme.typography.labelLarge,
                    color = Night,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = when (priority) {
                        ReportPriorityModel.HIGH -> "No funciona"
                        ReportPriorityModel.MEDIUM -> "Funciona mal"
                        ReportPriorityModel.LOW -> "Detalle estético"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = Night.copy(alpha = 0.68f)
                )
            }

            Surface(
                shape = RoundedCornerShape(50),
                color = priority.color
            ) {
                Text(
                    text = when (priority) {
                        ReportPriorityModel.HIGH -> "Alta"
                        ReportPriorityModel.MEDIUM -> "Media"
                        ReportPriorityModel.LOW -> "Baja"
                    },
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                    style = MaterialTheme.typography.labelLarge,
                    color = if (priority == ReportPriorityModel.MEDIUM) Night else WhiteText
                )
            }
        }
    }
}

@Composable
private fun PhotoPlaceholder(
    photo: Bitmap?,
    message: String,
    enabled: Boolean,
    onCapturePhoto: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = if (enabled) Mint.copy(alpha = 0.36f) else Color(0xFFF4F6F8),
        border = androidx.compose.foundation.BorderStroke(1.dp, if (enabled) Color(0xFFD7EBDD) else Color(0xFFE3E7EC))
    ) {
        if (photo != null) {
            Column(
                modifier = Modifier.padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Image(
                    bitmap = photo.asImageBitmap(),
                    contentDescription = "Evidencia capturada",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(190.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .clickable(enabled = enabled) { onCapturePhoto() },
                    contentScale = ContentScale.Crop
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = Night.copy(alpha = 0.72f)
                )
            }
        } else {
            Column(
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Cámara",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (enabled) Night else Night.copy(alpha = 0.48f)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (enabled) message else "Debes seleccionar el tipo de problema y el estado antes de abrir la cámara.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Night.copy(alpha = 0.7f)
                )
                Spacer(modifier = Modifier.height(14.dp))
                OutlinedButton(
                    onClick = onCapturePhoto,
                    shape = RoundedCornerShape(16.dp),
                    enabled = enabled,
                    border = androidx.compose.foundation.BorderStroke(1.dp, AccentRed.copy(alpha = if (enabled) 0.5f else 0.18f))
                ) {
                    Text(
                        text = "Abrir cámara",
                        color = if (enabled) AccentRedDark else Night.copy(alpha = 0.4f)
                    )
                }
            }
        }
    }
}

@Composable
private fun reportFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = Color.White,
    unfocusedContainerColor = Color.White,
    focusedBorderColor = AccentRed,
    unfocusedBorderColor = Line,
    focusedLabelColor = AccentRed,
    cursorColor = AccentRed
)
