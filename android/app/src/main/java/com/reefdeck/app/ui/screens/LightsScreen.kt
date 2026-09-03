package com.reefdeck.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.reefdeck.app.data.models.LightChannel
import com.reefdeck.app.ui.TankUi
import com.reefdeck.app.ui.components.EmptyState
import com.reefdeck.app.ui.components.LoadingGlance
import com.reefdeck.app.ui.components.ScreenHeader
import com.reefdeck.app.ui.theme.Card
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanOn
import com.reefdeck.app.ui.theme.OceanStroke
import com.reefdeck.app.ui.theme.OceanTeal

@Composable
fun LightsScreen(tank: TankUi) {
    val status = tank.status
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
    ) {
        ScreenHeader(kicker = "Lights", status = status)
        Spacer(Modifier.height(12.dp))

        when {
            tank.loading && status == null -> LoadingGlance()
            tank.error != null && status == null -> EmptyState("Hub offline", tank.error)
            status != null && status.lights.isEmpty() -> {
                EmptyState(
                    title = "No lights on Apex",
                    detail = "If Hydras run on Apex MXM or 0–10V, they show up here. Direct AI LAN control is a later adapter.",
                )
            }
            status != null -> {
                Text(
                    "Sightglass does not replace the AI schedule. It shows what Apex already believes. Read-only on this alpha.",
                    color = OceanMuted,
                    fontSize = 14.sp,
                )
                Spacer(Modifier.height(14.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    status.lights.forEach { light ->
                        LightRow(light)
                    }
                }
            }
        }
    }
}

@Composable
private fun LightRow(light: LightChannel) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, OceanStroke, RoundedCornerShape(18.dp))
            .background(Card)
            .padding(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(light.name, color = OceanFoam, fontWeight = FontWeight.Medium)
                Text(
                    light.schedule.ifBlank { "No schedule from Apex" },
                    color = OceanMuted,
                    fontSize = 11.sp,
                )
            }
            Text(
                if (light.on) "On" else "Off",
                color = if (light.on) OceanOn else OceanMuted,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
            )
        }
        Spacer(Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(OceanStroke),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(light.intensity.coerceIn(0, 100) / 100f)
                    .height(8.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (light.on) OceanOn else OceanTeal.copy(alpha = 0.45f)),
            )
        }
        Text(
            "${light.intensity}%",
            color = OceanMuted,
            fontFamily = FontFamily.Monospace,
            fontSize = 12.sp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
        )
    }
}
