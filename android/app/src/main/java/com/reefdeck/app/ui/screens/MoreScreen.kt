package com.reefdeck.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.outlined.DeveloperBoard
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.reefdeck.app.ui.SessionUi
import com.reefdeck.app.ui.TankUi
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.components.ScreenHeader
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanTeal

@Composable
fun MoreScreen(
    tank: TankUi,
    session: SessionUi,
    onSetup: () -> Unit,
    onAbout: () -> Unit,
    onDemo: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ScreenHeader(kicker = "More", status = tank.status)
        Text(
            session.email.ifBlank { "Helm session" },
            color = OceanMuted,
            fontSize = 14.sp,
        )
        MoreRow(
            icon = Icons.Outlined.Settings,
            title = "Setup",
            detail = "Helm URL and logout",
            onClick = onSetup,
        )
        MoreRow(
            icon = Icons.Outlined.DeveloperBoard,
            title = "Demo hardware",
            detail = "Fake Helm + Sightglass",
            onClick = onDemo,
        )
        MoreRow(
            icon = Icons.Outlined.Info,
            title = "About / Revision",
            detail = "0.1.1-alpha release notes",
            onClick = onAbout,
        )
        OceanCard {
            Text("Native console", color = OceanFoam, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(6.dp))
            Text(
                "Jetpack Compose talking to the Helm API. This is not a wrapped PWA.",
                color = OceanMuted,
                fontSize = 13.sp,
            )
        }
    }
}

@Composable
private fun MoreRow(
    icon: ImageVector,
    title: String,
    detail: String,
    onClick: () -> Unit,
) {
    OceanCard(modifier = Modifier.clickable(onClick = onClick)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = null, tint = OceanTeal)
                Column(modifier = Modifier.padding(start = 12.dp)) {
                    Text(title, color = OceanFoam, fontWeight = FontWeight.Medium)
                    Text(detail, color = OceanMuted, fontSize = 12.sp)
                }
            }
            Icon(Icons.AutoMirrored.Outlined.KeyboardArrowRight, contentDescription = null, tint = OceanMuted)
        }
    }
}
