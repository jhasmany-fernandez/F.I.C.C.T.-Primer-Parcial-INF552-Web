package com.uagrm.smartaccess.ui.recovery

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.uagrm.smartaccess.R
import com.uagrm.smartaccess.ui.theme.AccentRed
import com.uagrm.smartaccess.ui.theme.AccentRedDark
import com.uagrm.smartaccess.ui.theme.Line
import com.uagrm.smartaccess.ui.theme.Sky
import com.uagrm.smartaccess.ui.theme.Success
import com.uagrm.smartaccess.ui.theme.WhiteText

@Composable
fun PasswordRecoveryScreen(
    modifier: Modifier = Modifier,
    registrationNumber: String = "",
    onBack: () -> Unit = {}
) {
    var newPassword by remember { mutableStateOf("") }
    var repeatPassword by remember { mutableStateOf("") }
    var feedback by remember { mutableStateOf("Ingresa tu número de registro y define una nueva contraseña.") }

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
                        text = "Recuperación",
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = WhiteText
                    )
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            Text(
                text = "Recuperar contraseña",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = WhiteText
            )
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "Solicita la reposición de tu acceso institucional desde esta vista.",
                style = MaterialTheme.typography.bodyMedium,
                color = WhiteText.copy(alpha = 0.78f)
            )

            Spacer(modifier = Modifier.height(22.dp))

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
                        color = Sky.copy(alpha = 0.14f)
                    ) {
                        Text(
                            text = "Acceso asistido",
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            style = MaterialTheme.typography.labelMedium,
                            color = AccentRedDark
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Validación de identidad",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Completa tus datos para actualizar tu contraseña desde esta vista.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF5B6472)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = Line)
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = registrationNumber,
                        onValueChange = {},
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(22.dp),
                        enabled = false,
                        readOnly = true,
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
                            keyboardType = KeyboardType.Text,
                            imeAction = ImeAction.Next
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(22.dp),
                        singleLine = true,
                        label = { Text("Nueva contraseña") },
                        placeholder = { Text("Mínimo 8 caracteres") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = "Nueva contraseña",
                                tint = AccentRedDark
                            )
                        },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Next
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = repeatPassword,
                        onValueChange = { repeatPassword = it },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(22.dp),
                        singleLine = true,
                        label = { Text("Repetir nueva contraseña") },
                        placeholder = { Text("Confirma tu contraseña") },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = "Repetir contraseña",
                                tint = AccentRedDark
                            )
                        },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        )
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    Button(
                        onClick = {
                            feedback = if (registrationNumber.isBlank() || newPassword.isBlank() || repeatPassword.isBlank()) {
                                "Completa todos los campos para continuar."
                            } else if (newPassword.length < 8) {
                                "La nueva contraseña debe tener al menos 8 caracteres."
                            } else if (newPassword != repeatPassword) {
                                "Las contraseñas no coinciden."
                            } else {
                                "Datos listos para actualizar la contraseña."
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AccentRed,
                            contentColor = WhiteText
                        )
                    ) {
                        Text(
                            text = "Solicitar recuperación",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = feedback,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (feedback.startsWith("Datos listos")) Success else AccentRedDark
                    )
                }
            }
        }
    }
}
