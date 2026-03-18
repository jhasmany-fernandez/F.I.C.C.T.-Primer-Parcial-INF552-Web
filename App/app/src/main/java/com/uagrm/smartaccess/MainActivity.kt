package com.uagrm.smartaccess

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
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

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SmartAccessTheme {
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    contentWindowInsets = WindowInsets(0, 0, 0, 0)
                ) { innerPadding ->
                    LoginScreen(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun LoginScreen(modifier: Modifier = Modifier) {
    var registrationNumber by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var rememberMe by remember { mutableStateOf(true) }
    var passwordVisible by remember { mutableStateOf(false) }

    val registrationError = registrationNumber.isNotBlank() && registrationNumber.length < 5
    val passwordError = password.isNotBlank() && password.length < 6

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
                .background(
                    Color(0xB3061A31)
                )
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                BrandBlock()
                Spacer(modifier = Modifier.height(28.dp))
                Surface(
                    shape = RoundedCornerShape(50.dp),
                    color = AccentRed.copy(alpha = 0.18f)
                ) {
                    Text(
                        text = "Control de Acceso Inteligente",
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = WhiteText
                    )
                }
                Spacer(modifier = Modifier.height(18.dp))
                Text(
                    text = "Sistema Inteligente de Control de Acceso",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = WhiteText
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "Aulas y laboratorios - FICCT UAGRM",
                    style = MaterialTheme.typography.bodyLarge,
                    color = WhiteText.copy(alpha = 0.72f)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Gestione accesos, disponibilidad de ambientes, incidencias e inventario desde una plataforma centralizada.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = WhiteText.copy(alpha = 0.62f)
                )
                Spacer(modifier = Modifier.height(24.dp))
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(22.dp)
                    ) {
                        Text(
                            text = "Inicio de sesion",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Ingrese sus credenciales para administrar accesos y consultar informacion operativa del modulo academico.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        HorizontalDivider(color = Line)
                        Spacer(modifier = Modifier.height(20.dp))
                        OutlinedTextField(
                            value = registrationNumber,
                            onValueChange = { registrationNumber = it.filter(Char::isLetterOrDigit).uppercase() },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            label = { Text("Numero de registro") },
                            placeholder = { Text("Ej. 202400123") },
                            keyboardOptions = KeyboardOptions(
                                capitalization = KeyboardCapitalization.Characters,
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            isError = registrationError,
                            supportingText = {
                                if (registrationError) {
                                    Text("Ingresa un numero de registro valido")
                                }
                            },
                            colors = loginFieldColors()
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            label = { Text("Contraseña") },
                            placeholder = { Text("Min. 6 caracteres") },
                            visualTransformation = if (passwordVisible) {
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
                                    onClick = {
                                        passwordVisible = !passwordVisible
                                    }
                                ) {
                                    Icon(
                                        imageVector = if (passwordVisible) {
                                            ImageVector.vectorResource(R.drawable.ic_visibility_off)
                                        } else {
                                            ImageVector.vectorResource(R.drawable.ic_visibility)
                                        },
                                        contentDescription = if (passwordVisible) {
                                            "Ocultar contraseña"
                                        } else {
                                            "Mostrar contraseña"
                                        },
                                        tint = Sky
                                    )
                                }
                            },
                            isError = passwordError,
                            supportingText = {
                                if (passwordError) {
                                    Text("La contraseña debe tener al menos 6 caracteres")
                                }
                            },
                            colors = loginFieldColors()
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                                Checkbox(
                                    checked = rememberMe,
                                    onCheckedChange = { rememberMe = it },
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
                            Text(
                                text = "Recuperar",
                                modifier = Modifier.padding(top = 12.dp),
                                style = MaterialTheme.typography.bodyMedium,
                                color = Sky
                            )
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Button(
                            onClick = {},
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = AccentRed,
                                contentColor = WhiteText
                            ),
                            shape = RoundedCornerShape(18.dp)
                        ) {
                            Text(
                                text = "Entrar",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Uso exclusivo para porteria, personal autorizado, docentes y estudiantes habilitados.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            SecurityFooter()
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginPreview() {
    SmartAccessTheme {
        LoginScreen()
    }
}

@Composable
private fun BrandBlock() {
    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
        Surface(
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(18.dp)),
            shape = RoundedCornerShape(18.dp),
            color = Color.White.copy(alpha = 0.94f)
        ) {
            Image(
                painter = painterResource(R.drawable.escudo_ficct),
                contentDescription = "Escudo FICCT",
                modifier = Modifier
                    .fillMaxSize()
                    .padding(6.dp),
                contentScale = ContentScale.Fit
            )
        }
        Spacer(modifier = Modifier.width(14.dp))
        Column {
            Text(
                text = "FICCT - UAGRM",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = WhiteText
            )
            Text(
                text = "Acceso, seguridad y gestion de ambientes",
                style = MaterialTheme.typography.bodyMedium,
                color = WhiteText.copy(alpha = 0.68f)
            )
        }
    }
}

@Composable
private fun SecurityFooter() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.08f))
            .padding(horizontal = 18.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "Gestion centralizada",
                style = MaterialTheme.typography.labelLarge,
                color = WhiteText
            )
            Text(
                text = "Registro de accesos, control de ambientes y seguimiento de incidencias",
                style = MaterialTheme.typography.bodySmall,
                color = WhiteText.copy(alpha = 0.64f)
            )
        }
        Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
            Text(
                text = "FICCT",
                style = MaterialTheme.typography.labelLarge,
                color = Mint
            )
            Text(
                text = "UAGRM",
                style = MaterialTheme.typography.bodySmall,
                color = WhiteText.copy(alpha = 0.64f)
            )
        }
    }
}

@Composable
private fun loginFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = Color.White,
    unfocusedContainerColor = Color.White.copy(alpha = 0.92f),
    focusedBorderColor = AccentRed,
    unfocusedBorderColor = Line,
    errorBorderColor = Danger,
    focusedLabelColor = AccentRedDark,
    cursorColor = AccentRedDark
)
