package com.uagrm.smartaccess

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.uagrm.smartaccess.controller.AppController
import com.uagrm.smartaccess.controller.AppController.FloatingMessageTone
import com.uagrm.smartaccess.controller.LoginController
import com.uagrm.smartaccess.controller.NetworkConfig
import com.uagrm.smartaccess.model.AppScreen
import com.uagrm.smartaccess.ui.dashboard.AccessDashboardScreen
import com.uagrm.smartaccess.ui.entry.ClassroomEntryScreen
import com.uagrm.smartaccess.ui.profile.AdminProfileScreen
import com.uagrm.smartaccess.ui.recovery.PasswordRecoveryScreen
import com.uagrm.smartaccess.ui.report.ReportObjectsScreen
import com.uagrm.smartaccess.ui.theme.AccentRed
import com.uagrm.smartaccess.ui.theme.AccentRedDark
import com.uagrm.smartaccess.ui.theme.Danger
import com.uagrm.smartaccess.ui.theme.Line
import com.uagrm.smartaccess.ui.theme.Mint
import com.uagrm.smartaccess.ui.theme.Sky
import com.uagrm.smartaccess.ui.theme.SmartAccessTheme
import com.uagrm.smartaccess.ui.theme.Success
import com.uagrm.smartaccess.ui.theme.SurfaceCard
import com.uagrm.smartaccess.ui.theme.WhiteText
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SmartAccessTheme {
                SmartAccessApp()
            }
        }
    }
}

@Composable
private fun SmartAccessApp() {
    val appController = remember { AppController() }
    val loginController = remember { LoginController() }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        NetworkConfig.initialize(context)
        loginController.restoreRememberedSession(context)
    }

    LaunchedEffect(appController.currentScreen) {
        if (appController.currentScreen == AppScreen.LOGIN) {
            while (appController.currentScreen == AppScreen.LOGIN) {
                loginController.checkBackendHealth()
                delay(5000)
            }
        }
    }

    LaunchedEffect(appController.floatingMessage) {
        if (appController.floatingMessage != null) {
            delay(2600)
            appController.consumeFloatingMessage()
        }
    }

    BackHandler(enabled = appController.currentScreen != AppScreen.LOGIN) {
        appController.handleBack()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            contentWindowInsets = WindowInsets(0, 0, 0, 0)
        ) { innerPadding ->
            when (appController.currentScreen) {
            AppScreen.LOGIN -> {
                LoginScreen(
                    modifier = Modifier.padding(innerPadding),
                        controller = loginController,
                        onRecoverPassword = {
                            appController.openPasswordRecovery(loginController.state.registrationNumber)
                        },
                        onLoginSuccess = {
                            appController.updateLoggedInUserName(loginController.loggedInUserName)
                            appController.updateLoggedInUserRegistration(loginController.loggedInUserRegistration)
                            loginController.pullFloatingMessage()?.let {
                                appController.showFloatingMessage(it, FloatingMessageTone.SUCCESS)
                            }
                            appController.openDashboard()
                        }
                    )
            }

            AppScreen.PASSWORD_RECOVERY -> {
                PasswordRecoveryScreen(
                    modifier = Modifier.padding(innerPadding),
                    registrationNumber = appController.recoveryRegistration,
                    onBack = { appController.openLogin() }
                )
            }

                AppScreen.DASHBOARD -> {
                    AccessDashboardScreen(
                        modifier = Modifier.padding(innerPadding),
                        onLogout = { appController.closeSession() },
                        onOpenClassroomEntry = { appController.openClassroomEntry() },
                        onOpenReportObjects = { appController.openReportObjects() },
                        onOpenProfile = { appController.openProfileAdmin() }
                    )
                }

                AppScreen.CLASSROOM_ENTRY -> {
                    ClassroomEntryScreen(
                        modifier = Modifier.padding(innerPadding),
                        onBack = { appController.openDashboard() }
                    )
                }

                AppScreen.REPORT_OBJECTS -> {
                    ReportObjectsScreen(
                        modifier = Modifier.padding(innerPadding),
                        loggedInUserName = appController.loggedInUserName,
                        loggedInUserRegistration = appController.loggedInUserRegistration,
                        onFloatingMessage = appController::showFloatingMessage,
                        onBack = { appController.openDashboard() }
                    )
                }

                AppScreen.PROFILE_ADMIN -> {
                    AdminProfileScreen(
                        modifier = Modifier.padding(innerPadding),
                        onBack = { appController.openDashboard() }
                    )
                }
            }
        }

        AnimatedVisibility(
            visible = appController.floatingMessage != null,
            modifier = Modifier
                .statusBarsPadding()
                .padding(top = 12.dp)
                .align(androidx.compose.ui.Alignment.TopCenter),
            enter = slideInVertically(initialOffsetY = { -it / 2 }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { -it / 2 }) + fadeOut()
        ) {
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = when (appController.floatingMessageTone) {
                    FloatingMessageTone.SUCCESS -> Color(0xFF1F8F5A).copy(alpha = 0.82f)
                    FloatingMessageTone.ERROR -> AccentRed.copy(alpha = 0.46f)
                    FloatingMessageTone.INFO -> AccentRedDark.copy(alpha = 0.38f)
                },
                border = BorderStroke(
                    1.dp,
                    when (appController.floatingMessageTone) {
                        FloatingMessageTone.SUCCESS -> Color(0xFF7BE0AD).copy(alpha = 0.7f)
                        FloatingMessageTone.ERROR -> Color.White.copy(alpha = 0.14f)
                        FloatingMessageTone.INFO -> Color.White.copy(alpha = 0.14f)
                    }
                ),
                shadowElevation = 10.dp
            ) {
                Text(
                    text = appController.floatingMessage.orEmpty(),
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 12.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = WhiteText
                )
            }
        }
    }
}

@Composable
fun LoginScreen(
    modifier: Modifier = Modifier,
    controller: LoginController,
    onRecoverPassword: () -> Unit = {},
    onLoginSuccess: () -> Unit = {}
) {
    val state = controller.state
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

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
                .background(Color(0xB3061A31))
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 18.dp)
        ) {
            Column {
                BrandBlock()
                Spacer(modifier = Modifier.height(18.dp))
                Surface(
                    shape = RoundedCornerShape(50.dp),
                    color = when (controller.isBackendHealthy) {
                        true -> Success.copy(alpha = 0.18f)
                        false -> AccentRed.copy(alpha = 0.18f)
                        null -> Color.White.copy(alpha = 0.12f)
                    },
                    border = BorderStroke(
                        width = 1.5.dp,
                        color = when (controller.isBackendHealthy) {
                            true -> Success.copy(alpha = 0.95f)
                            false -> Danger.copy(alpha = 0.95f)
                            null -> Color.White.copy(alpha = 0.35f)
                        }
                    )
                ) {
                    Text(
                        text = "Control de Acceso Inteligente",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = WhiteText
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Sistema Inteligente de Control de Acceso",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = WhiteText
                )
                Spacer(modifier = Modifier.height(18.dp))
                Card(
                    shape = RoundedCornerShape(32.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.95f)),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.16f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 22.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = AccentRed.copy(alpha = 0.1f)
                        ) {
                            Text(
                                text = "Acceso seguro",
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                style = MaterialTheme.typography.labelMedium,
                                color = AccentRedDark
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Inicio de sesión",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Ingresa tus credenciales institucionales para continuar.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF5B6472)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = Line)
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(
                            value = state.registrationNumber,
                            onValueChange = controller::updateRegistrationNumber,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(22.dp),
                            singleLine = true,
                            label = { Text("Número de registro") },
                            placeholder = { Text("Ej. 202400123") },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Filled.Person,
                                    contentDescription = "Registro",
                                    tint = AccentRedDark
                                )
                            },
                            keyboardOptions = KeyboardOptions(
                                capitalization = KeyboardCapitalization.Characters,
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            isError = state.registrationError,
                            supportingText = {
                                if (state.registrationError) {
                                    Text("Ingresa un número de registro válido")
                                }
                            },
                            colors = loginFieldColors()
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedTextField(
                            value = state.password,
                            onValueChange = controller::updatePassword,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(22.dp),
                            singleLine = true,
                            label = { Text("Contraseña") },
                            placeholder = { Text("Min. 6 caracteres") },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Filled.Lock,
                                    contentDescription = "Contraseña",
                                    tint = AccentRedDark
                                )
                            },
                            visualTransformation = if (state.passwordVisible) {
                                VisualTransformation.None
                            } else {
                                PasswordVisualTransformation()
                            },
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            trailingIcon = {
                                IconButton(
                                    onClick = controller::togglePasswordVisibility
                                ) {
                                    Icon(
                                        imageVector = if (state.passwordVisible) {
                                            ImageVector.vectorResource(R.drawable.ic_visibility_off)
                                        } else {
                                            ImageVector.vectorResource(R.drawable.ic_visibility)
                                        },
                                        contentDescription = if (state.passwordVisible) {
                                            "Ocultar contraseña"
                                        } else {
                                            "Mostrar contraseña"
                                        },
                                        tint = Sky
                                    )
                                }
                            },
                            isError = state.passwordError,
                            supportingText = {
                                if (state.passwordError) {
                                    Text("La contraseña debe tener al menos 6 caracteres")
                                }
                            },
                            colors = loginFieldColors()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                                Checkbox(
                                    checked = state.rememberMe,
                                    onCheckedChange = controller::updateRememberMe,
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = Success,
                                        uncheckedColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.45f)
                                    )
                                )
                                Text(
                                    text = "Recordarme",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                            Surface(
                                onClick = onRecoverPassword,
                                color = Color.Transparent
                            ) {
                                Text(
                                    text = "Recuperar",
                                    modifier = Modifier.padding(top = 12.dp),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Sky
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    if (controller.login(context)) {
                                        onLoginSuccess()
                                    }
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = AccentRed,
                                contentColor = WhiteText,
                            ),
                            shape = RoundedCornerShape(18.dp),
                            enabled = !controller.isBusy
                        ) {
                            Text(
                                text = if (controller.isBusy) "Validando..." else "Iniciar Sesion",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = controller.feedbackMessage,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (controller.feedbackMessage.startsWith("Bienvenido")) Success else Danger
                        )
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginPreview() {
    SmartAccessTheme {
        LoginScreen(controller = LoginController())
    }
}

@Composable
private fun BrandBlock() {
    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
        Surface(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(14.dp)),
            shape = RoundedCornerShape(14.dp),
            color = Color.White.copy(alpha = 0.94f)
        ) {
            Image(
                painter = painterResource(R.drawable.escudo_ficct),
                contentDescription = "Escudo FICCT",
                modifier = Modifier
                    .fillMaxSize()
                    .padding(5.dp),
                contentScale = ContentScale.Fit
            )
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(
                text = "FICCT - UAGRM",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = WhiteText
            )
            Text(
                text = "Acceso, seguridad y gestión de ambientes",
                style = MaterialTheme.typography.bodySmall,
                color = WhiteText.copy(alpha = 0.68f)
            )
        }
    }
}

@Composable
private fun loginFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = Color(0xFFF8F9FC),
    unfocusedContainerColor = Color(0xFFF4F6FA),
    focusedBorderColor = AccentRed,
    unfocusedBorderColor = Color(0xFFD9DFEA),
    errorBorderColor = Danger,
    focusedLabelColor = AccentRedDark,
    unfocusedLabelColor = Color(0xFF6F7785),
    focusedLeadingIconColor = AccentRedDark,
    unfocusedLeadingIconColor = Color(0xFF7B8594),
    focusedTrailingIconColor = Sky,
    unfocusedTrailingIconColor = Sky.copy(alpha = 0.86f),
    cursorColor = AccentRedDark
)
