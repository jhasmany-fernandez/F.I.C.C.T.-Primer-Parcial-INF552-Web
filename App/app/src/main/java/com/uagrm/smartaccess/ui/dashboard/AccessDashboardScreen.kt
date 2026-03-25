package com.uagrm.smartaccess.ui.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.uagrm.smartaccess.R
import com.uagrm.smartaccess.model.DashboardActionModel
import com.uagrm.smartaccess.ui.theme.AccentRed
import com.uagrm.smartaccess.ui.theme.DarkText
import com.uagrm.smartaccess.ui.theme.Danger
import com.uagrm.smartaccess.ui.theme.Line
import com.uagrm.smartaccess.ui.theme.Mint
import com.uagrm.smartaccess.ui.theme.Night
import com.uagrm.smartaccess.ui.theme.NightSoft
import com.uagrm.smartaccess.ui.theme.Sky
import com.uagrm.smartaccess.ui.theme.SurfaceCard
import com.uagrm.smartaccess.ui.theme.WhiteText
import kotlinx.coroutines.delay

@Composable
fun AccessDashboardScreen(
    modifier: Modifier = Modifier,
    onLogout: () -> Unit = {},
    onOpenClassroomEntry: () -> Unit = {},
    onOpenReportObjects: () -> Unit = {},
    onOpenProfile: () -> Unit = {}
) {
    val actions = listOf(
        DashboardActionModel(
            title = "Ingreso Aula",
            subtitle = "Control de entrada y validación rápida",
            badge = "01"
        ),
        DashboardActionModel(
            title = "Reportar objetos",
            subtitle = "Incidencias, hallazgos y objetos olvidados",
            badge = "02"
        ),
        DashboardActionModel(
            title = "Visualización de aulas",
            subtitle = "Estado, capacidad y disponibilidad de ambientes",
            badge = "03"
        )
    )
    val adminActions = listOf(
        DashboardActionModel(
            title = "Reportes",
            subtitle = "Formulario y seguimiento de incidencias",
            badge = "R1"
        ),
        DashboardActionModel(
            title = "Admin",
            subtitle = "Usuarios, importación y servidor backend",
            badge = "A1"
        )
    )
    var selectedAction by remember { mutableStateOf(actions.first()) }
    var selectedAdminAction by remember { mutableStateOf(adminActions.first()) }
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
                .background(Color(0xC4061A31))
        )
        DecorativeBackdrop()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(start = 18.dp, end = 18.dp, top = 16.dp, bottom = 24.dp)
        ) {
            DashboardTopBar(onLogout = onLogout)
            Spacer(modifier = Modifier.height(12.dp))

            DashboardHero()
            Spacer(modifier = Modifier.height(12.dp))
            DashboardQuickStats()
            Spacer(modifier = Modifier.height(14.dp))

            SectionHeader(
                title = "Módulos rápidos",
                subtitle = "Selecciona el flujo operativo que necesitas abrir."
            )
            Spacer(modifier = Modifier.height(10.dp))

            ActionCarousel(
                actions = actions,
                selectedAction = selectedAction,
                onActionSelected = { selectedAction = it },
                onOpenClassroomEntry = onOpenClassroomEntry,
                onOpenReportObjects = onOpenReportObjects
            )

            Spacer(modifier = Modifier.height(14.dp))

            SectionHeader(
                title = "Gestión rápida",
                subtitle = "Accesos directos a reportes y administración."
            )
            Spacer(modifier = Modifier.height(10.dp))

            ManagementCarousel(
                actions = adminActions,
                selectedAction = selectedAdminAction,
                onActionSelected = { selectedAdminAction = it },
                onOpenReportObjects = onOpenReportObjects,
                onOpenProfile = onOpenProfile
            )

        }
    }
}

@Composable
private fun ManagementCarousel(
    actions: List<DashboardActionModel>,
    selectedAction: DashboardActionModel,
    onActionSelected: (DashboardActionModel) -> Unit,
    onOpenReportObjects: () -> Unit,
    onOpenProfile: () -> Unit
) {
    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        actions.forEach { action ->
            val isSelected = action.title == selectedAction.title
            Card(
                modifier = Modifier
                    .width(184.dp)
                    .clickable {
                        onActionSelected(action)
                        when (action.title) {
                            "Reportes" -> onOpenReportObjects()
                            "Admin" -> onOpenProfile()
                        }
                    },
                shape = RoundedCornerShape(26.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isSelected) Color.White.copy(alpha = 0.98f) else SurfaceCard
                ),
                border = BorderStroke(
                    width = 1.dp,
                    color = if (isSelected) AccentRed.copy(alpha = 0.3f) else Color.White.copy(alpha = 0.08f)
                )
            ) {
                Column(
                    modifier = Modifier.padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = if (isSelected) AccentRed.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.08f)
                        ) {
                            Text(
                                text = action.badge,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                style = MaterialTheme.typography.labelMedium,
                                color = if (isSelected) AccentRed else WhiteText.copy(alpha = 0.9f)
                            )
                        }
                        Icon(
                            imageVector = if (action.title == "Admin") Icons.Filled.Settings else Icons.Filled.Person,
                            contentDescription = action.title,
                            tint = if (isSelected) AccentRed else Sky,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = action.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) DarkText else Night,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = action.subtitle,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) DarkText.copy(alpha = 0.72f) else Night.copy(alpha = 0.76f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
private fun DashboardTopBar(onLogout: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color.White.copy(alpha = 0.1f),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(Mint)
                )
                Text(
                    text = "FICCT",
                    style = MaterialTheme.typography.labelLarge,
                    color = WhiteText
                )
            }
        }

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White.copy(alpha = 0.12f))
                .clickable(onClick = onLogout)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                contentDescription = "Cerrar sesión",
                tint = WhiteText
            )
        }
    }
}

@Composable
private fun DashboardHero() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(34.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color(0xB813233A),
                            Color(0xB81E4D84),
                            Color(0xB81B7E78)
                        )
                        )
                    )
                .padding(horizontal = 18.dp, vertical = 18.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color.White.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "Centro de control",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = WhiteText
                    )
                }
                Text(
                    text = "Dashboard operativo",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = WhiteText
                )
            }
        }
    }
}

@Composable
private fun DashboardQuickStats() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatCard(
            modifier = Modifier.weight(1f),
            title = "Accesos",
            value = "128",
            accent = AccentRed,
            icon = Icons.Filled.Lock
        )
        StatCard(
            modifier = Modifier.weight(1f),
            title = "Aulas",
            value = "24",
            accent = Sky,
            icon = Icons.Filled.Home
        )
        StatCard(
            modifier = Modifier.weight(1f),
            title = "Reservas",
            value = "08",
            accent = Mint,
            icon = Icons.Filled.Person
        )
    }
}

@Composable
private fun StatCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    accent: Color,
    icon: ImageVector
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f)),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.16f))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = accent.copy(alpha = 0.12f)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = accent,
                    modifier = Modifier.padding(10.dp)
                )
            }
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Night
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = DarkText.copy(alpha = 0.62f),
                maxLines = 1
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    subtitle: String
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = WhiteText
        )
        Text(
            text = subtitle,
            style = MaterialTheme.typography.labelSmall,
            color = WhiteText.copy(alpha = 0.72f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun ActionCarousel(
    actions: List<DashboardActionModel>,
    selectedAction: DashboardActionModel,
    onActionSelected: (DashboardActionModel) -> Unit,
    onOpenClassroomEntry: () -> Unit,
    onOpenReportObjects: () -> Unit
) {
    val scrollState = rememberScrollState()
    val loopingActions = remember(actions) { List(4) { actions }.flatten() }

    LaunchedEffect(scrollState.maxValue) {
        if (scrollState.maxValue == 0) return@LaunchedEffect

        while (true) {
            delay(42)
            val nextValue = scrollState.value + 1
            if (nextValue >= scrollState.maxValue) {
                scrollState.scrollTo(0)
            } else {
                scrollState.scrollTo(nextValue)
            }
        }
    }

    Row(
        modifier = Modifier.horizontalScroll(scrollState),
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        loopingActions.forEach { action ->
            val isSelected = action.title == selectedAction.title
            Card(
                modifier = Modifier
                    .width(166.dp)
                    .clickable {
                        onActionSelected(action)
                        when (action.title) {
                            "Ingreso Aula" -> onOpenClassroomEntry()
                            "Reportar objetos" -> onOpenReportObjects()
                        }
                    },
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isSelected) Color.White.copy(alpha = 0.98f) else SurfaceCard
                ),
                border = BorderStroke(
                    width = 1.dp,
                    color = if (isSelected) AccentRed.copy(alpha = 0.3f) else Color.White.copy(alpha = 0.08f)
                )
            ) {
                Column(
                    modifier = Modifier.padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = if (isSelected) AccentRed.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.08f)
                        ) {
                            Text(
                                text = action.badge,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                style = MaterialTheme.typography.labelMedium,
                                color = if (isSelected) AccentRed else WhiteText.copy(alpha = 0.9f)
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) AccentRed else Sky)
                        )
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = action.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) DarkText else Night,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = action.subtitle,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) DarkText.copy(alpha = 0.72f) else Night.copy(alpha = 0.76f),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
private fun DecorativeBackdrop() {
    Box(modifier = Modifier.fillMaxSize()) {
        listOf(
            Triple(24.dp, 72.dp, 54.dp),
            Triple(312.dp, 112.dp, 22.dp),
            Triple(96.dp, 260.dp, 30.dp),
            Triple(290.dp, 420.dp, 62.dp),
            Triple(44.dp, 560.dp, 18.dp),
            Triple(250.dp, 700.dp, 26.dp)
        ).forEach { (x, y, size) ->
            Box(
                modifier = Modifier
                    .padding(start = x, top = y)
                    .size(size)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.05f))
            )
        }
    }
}
