package com.uagrm.smartaccess.ui.profile

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.uagrm.smartaccess.R
import com.uagrm.smartaccess.controller.AdminProfileController
import com.uagrm.smartaccess.controller.NetworkConfig
import com.uagrm.smartaccess.model.AdminUserModel
import com.uagrm.smartaccess.ui.theme.AccentRed
import com.uagrm.smartaccess.ui.theme.Line
import com.uagrm.smartaccess.ui.theme.Mint
import com.uagrm.smartaccess.ui.theme.Night
import com.uagrm.smartaccess.ui.theme.WhiteText
import kotlinx.coroutines.launch

@Composable
fun AdminProfileScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit = {}
) {
    val adminSections = listOf("Importación", "Usuarios", "Servidor")
    val controller = remember { AdminProfileController() }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var showSaveConfirmation by remember { mutableStateOf(false) }
    var selectedRegistroForPassword by remember { mutableStateOf<String?>(null) }
    var newPassword by remember { mutableStateOf("") }
    var serverUrl by remember { mutableStateOf(NetworkConfig.baseUrl) }
    var selectedSection by remember { mutableStateOf("Importación") }
    val excelPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                controller.importExcelFromUri(context, uri)
                if (controller.importedUsers.isNotEmpty()) {
                    showSaveConfirmation = true
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        controller.loadUsersFromBackend()
    }

    LaunchedEffect(controller.floatingMessage) {
        val message = controller.floatingMessage ?: return@LaunchedEffect
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        controller.consumeFloatingMessage()
    }

    LaunchedEffect(NetworkConfig.baseUrl) {
        serverUrl = NetworkConfig.baseUrl
    }

    Box(modifier = modifier.fillMaxSize()) {
        if (showSaveConfirmation) {
            AlertDialog(
                onDismissRequest = { showSaveConfirmation = false },
                title = {
                    Text("Guardar datos importados")
                },
                text = {
                    Text("El Excel se cargó correctamente. ¿Quieres guardar estos datos en la base de datos ahora?")
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showSaveConfirmation = false
                            scope.launch {
                                controller.saveImportedUsers()
                            }
                        }
                    ) {
                        Text("Sí, guardar")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = { showSaveConfirmation = false }
                    ) {
                        Text("No todavía")
                    }
                }
            )
        }

        if (selectedRegistroForPassword != null) {
            AlertDialog(
                onDismissRequest = {
                    selectedRegistroForPassword = null
                    newPassword = ""
                },
                title = {
                    Text("Cambiar contraseña")
                },
                text = {
                    Column {
                        Text("Asignar nueva contraseña para el registro ${selectedRegistroForPassword.orEmpty()}.")
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = newPassword,
                            onValueChange = { newPassword = it },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            label = { Text("Nueva contraseña") }
                        )
                    }
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            val registro = selectedRegistroForPassword ?: return@TextButton
                            selectedRegistroForPassword = null
                            scope.launch {
                                controller.updateUserPassword(registro, newPassword.trim())
                                newPassword = ""
                            }
                        }
                    ) {
                        Text("Guardar")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            selectedRegistroForPassword = null
                            newPassword = ""
                        }
                    ) {
                        Text("Cancelar")
                    }
                }
            )
        }

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
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Volver"
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Volver")
                }

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = AccentRed.copy(alpha = 0.18f)
                ) {
                    Text(
                        text = "Perfil administrador",
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = WhiteText
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.94f))
            ) {
                Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 16.dp)) {
                    Text(
                        text = "Panel administrativo móvil",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Night
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Desde aquí administras importación masiva y tabla de usuarios sin depender de la web.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Night.copy(alpha = 0.72f)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = controller.feedbackMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = Night.copy(alpha = 0.72f)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = { excelPicker.launch(arrayOf("application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AccentRed, contentColor = WhiteText),
                            enabled = !controller.isBusy
                        ) {
                            Text(if (controller.isBusy) "Procesando..." else "Importación masiva")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                adminSections.forEach { section ->
                    val selected = section == selectedSection
                    Surface(
                        modifier = Modifier.clickable { selectedSection = section },
                        shape = RoundedCornerShape(18.dp),
                        color = if (selected) AccentRed else Color.White.copy(alpha = 0.12f),
                        border = BorderStroke(
                            1.dp,
                            if (selected) AccentRed.copy(alpha = 0.92f) else Color.White.copy(alpha = 0.14f)
                        )
                    ) {
                        Text(
                            text = section,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = WhiteText
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            when (selectedSection) {
                "Importación" -> {
                    if (controller.importedUsers.isNotEmpty()) {
                        UserTableCard(
                            title = "Lote importado",
                            subtitle = "Usuarios detectados para guardar en la tabla administrativa.",
                            users = controller.importedUsers,
                            actionLabel = "Revisado",
                            onAction = {},
                            onPassword = {}
                        )
                    } else {
                        ModulePlaceholderCard(
                            title = "Importación masiva",
                            subtitle = "Usa el botón superior para cargar un Excel y revisar aquí el lote detectado."
                        )
                    }
                }

                "Usuarios" -> {
                    UserTableCard(
                        title = "Tabla administrativa de usuarios",
                        subtitle = "Listado operativo con activación rápida de cuentas.",
                        users = controller.users,
                        actionLabel = "Activar",
                        onAction = controller::activateUser,
                        onPassword = { registro ->
                            selectedRegistroForPassword = registro
                        }
                    )
                }

                else -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.94f)),
                        border = BorderStroke(1.dp, Line.copy(alpha = 0.5f))
                    ) {
                        Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 16.dp)) {
                            Text(
                                text = "Servidor backend",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Night
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Configura aquí la dirección del servidor sin tocar el código de la app.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Night.copy(alpha = 0.7f)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedTextField(
                                value = serverUrl,
                                onValueChange = { serverUrl = it },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                label = { Text("URL del servidor") }
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = {
                                    val saved = NetworkConfig.saveBaseUrl(context, serverUrl)
                                    serverUrl = saved
                                    Toast.makeText(context, "Servidor actualizado: $saved", Toast.LENGTH_LONG).show()
                                },
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Night, contentColor = WhiteText)
                            ) {
                                Text("Guardar servidor")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ModulePlaceholderCard(
    title: String,
    subtitle: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.94f)),
        border = BorderStroke(1.dp, Line.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(horizontal = 18.dp, vertical = 18.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Night
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = Night.copy(alpha = 0.72f)
            )
        }
    }
}

@Composable
private fun UserTableCard(
    title: String,
    subtitle: String,
    users: List<AdminUserModel>,
    actionLabel: String,
    onAction: (String) -> Unit,
    onPassword: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.94f)),
        border = BorderStroke(1.dp, Line.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Night
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = Night.copy(alpha = 0.7f)
            )
            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = Line)
            Spacer(modifier = Modifier.height(10.dp))

            val horizontalState = rememberScrollState()
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(horizontalState)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier
                            .width(720.dp)
                            .padding(horizontal = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AdminHeaderCell("Usuario", 172.dp)
                        AdminHeaderCell("Registro", 84.dp)
                        AdminHeaderCell("Correo", 156.dp)
                        AdminHeaderCell("Rol", 94.dp)
                        AdminHeaderCell("Estado", 76.dp)
                        AdminHeaderCell("Acciones", 138.dp)
                    }

                    users.forEach { user ->
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (user.imported) Color(0xFFF8FBFF) else Color.White.copy(alpha = 0.96f)
                            ),
                            border = BorderStroke(
                                1.dp,
                                Line.copy(alpha = 0.45f)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .width(720.dp)
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                UserIdentityCell(user, 172.dp)
                                AdminCell(user.registro, 84.dp, emphasized = true)
                                AdminCell(user.correo, 156.dp)
                                AdminCell(user.rol, 94.dp)
                                StatusChip(user.estado, user.existsInDatabase, 76.dp)
                                Row(
                                    modifier = Modifier.width(138.dp),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Surface(
                                        onClick = { onPassword(user.registro) },
                                        enabled = actionLabel != "Revisado" && user.registro != AdminProfileController.SYSTEM_ADMIN_REGISTRO,
                                        shape = RoundedCornerShape(12.dp),
                                        color = if (user.registro == AdminProfileController.SYSTEM_ADMIN_REGISTRO) Color.Gray else Night
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(38.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Filled.Lock,
                                                contentDescription = "Clave",
                                                tint = WhiteText,
                                                modifier = Modifier.size(15.dp)
                                            )
                                        }
                                    }
                                    if (actionLabel != "Revisado" && user.estado != "Activo") {
                                        Button(
                                            onClick = { onAction(user.registro) },
                                            enabled = true,
                                            shape = RoundedCornerShape(12.dp),
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = AccentRed,
                                                contentColor = WhiteText
                                            )
                                        ) {
                                            Text(actionLabel)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AdminCell(
    text: String,
    width: androidx.compose.ui.unit.Dp,
    bold: Boolean = false,
    emphasized: Boolean = false
) {
    Text(
        text = text,
        modifier = Modifier.width(width),
        style = if (bold) MaterialTheme.typography.titleSmall else MaterialTheme.typography.bodySmall,
        fontWeight = when {
            bold -> FontWeight.Bold
            emphasized -> FontWeight.SemiBold
            else -> FontWeight.Normal
        },
        color = Night,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

@Composable
private fun AdminHeaderCell(
    text: String,
    width: androidx.compose.ui.unit.Dp
) {
    Text(
        text = text,
        modifier = Modifier.width(width),
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.Bold,
        color = Night.copy(alpha = 0.6f),
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

@Composable
private fun UserIdentityCell(
    user: AdminUserModel,
    width: androidx.compose.ui.unit.Dp
) {
    Row(
        modifier = Modifier.width(width),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .background(AccentRed.copy(alpha = 0.12f), CircleShape)
                .border(1.dp, AccentRed.copy(alpha = 0.18f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = user.nombre.take(1).uppercase(),
                color = AccentRed,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
        }
        Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                text = "${user.nombre} ${user.apellido}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = Night,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = if (user.imported) "Importado" else "Registrado",
                style = MaterialTheme.typography.labelSmall,
                color = Night.copy(alpha = 0.58f)
            )
        }
    }
}

@Composable
private fun StatusChip(
    status: String,
    existsInDatabase: Boolean,
    width: androidx.compose.ui.unit.Dp
) {
    val background = when (status) {
        "Activo" -> Color(0xFFE5F6EA)
        "Pendiente" -> Color(0xFFFFF3DE)
        else -> Color(0xFFF4F5F7)
    }
    val foreground = when (status) {
        "Activo" -> Color(0xFF18794E)
        "Pendiente" -> Color(0xFF9A6700)
        else -> Night.copy(alpha = 0.7f)
    }

    Box(modifier = Modifier.width(width)) {
        Surface(
            shape = RoundedCornerShape(50),
            color = if (existsInDatabase && status != "Activo") background.copy(alpha = 0.8f) else background
        ) {
            Text(
                text = status,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                color = foreground,
                maxLines = 1
            )
        }
    }
}
