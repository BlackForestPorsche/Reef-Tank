package com.reefdeck.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
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
import com.reefdeck.app.data.models.Outlet
import com.reefdeck.app.data.models.Probe
import com.reefdeck.app.data.models.TankStatus
import com.reefdeck.app.ui.TankUi
import com.reefdeck.app.ui.components.AlertStrip
import com.reefdeck.app.ui.components.EmptyState
import com.reefdeck.app.ui.components.LoadingGlance
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.components.ScreenHeader
import com.reefdeck.app.ui.components.featuredProbes
import com.reefdeck.app.ui.components.formatClock
import com.reefdeck.app.ui.theme.Card
import com.reefdeck.app.ui.theme.OceanAlarm
import com.reefdeck.app.ui.theme.OceanCyan
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanStroke
import com.reefdeck.app.ui.theme.OceanWarn

@Composable
fun GlanceScreen(tank: TankUi) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
    ) {
        ScreenHeader(kicker = "Glance", status = tank.status)
        Spacer(Modifier.height(16.dp))

        when {
            tank.loading && tank.status == null -> LoadingGlance()
            tank.error != null && tank.status == null -> {
                EmptyState(
                    title = "Cannot reach Helm",
                    detail = tank.error,
                )
            }
            tank.status != null -> GlanceBody(tank.status)
        }
    }
}

@Composable
private fun GlanceBody(status: TankStatus) {
    val probes = featuredProbes(status)
    val extras = status.probes.filter { probe -> probes.none { it.id == probe.id } }
    val returnPump = status.outlets.find { it.device == "return" }
    val gyre = status.outlets.find { it.device == "gyre" }
    val lightsOn = status.lights.count { it.on }
    val live = status.connected && !status.stale

    AlertStrip(status.alerts)
    Spacer(Modifier.height(12.dp))

    if (status.hub.provisioned) {
        OceanCard {
            Text(
                if (status.hub.dummy) "DEMO HELM" else "HELM",
                color = OceanMuted,
                fontSize = 11.sp,
                letterSpacing = 1.8.sp,
            )
            Text(
                listOfNotNull(status.hub.accountEmail ?: status.hub.serial, status.hub.ssid)
                    .joinToString(" · "),
                color = OceanFoam,
                fontWeight = FontWeight.Medium,
            )
            Text(
                "${status.hub.panelsAdopted} Sightglass${if (status.hub.panelsAdopted == 1) "" else " units"} adopted" +
                    if (status.hub.dummy) " · demo rack" else "",
                color = OceanMuted,
                fontSize = 11.sp,
            )
            status.hub.panels.forEach { glass ->
                Text(
                    "${glass.name} · ${glass.serial}" +
                        if (glass.pairing) " · pairing" else if (glass.adopted) " · adopted" else "",
                    color = OceanMuted,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
        Spacer(Modifier.height(12.dp))
    }

    if (status.feed.active != null) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .border(1.dp, OceanCyan.copy(alpha = 0.28f), RoundedCornerShape(18.dp))
                .background(OceanCyan.copy(alpha = 0.10f))
                .padding(16.dp),
        ) {
            Text(
                text = "FEED ${status.feed.active}",
                color = OceanCyan.copy(alpha = 0.85f),
                fontSize = 11.sp,
                letterSpacing = 1.8.sp,
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom,
            ) {
                Text(status.feed.label, color = OceanFoam, fontSize = 17.sp, fontWeight = FontWeight.Medium)
                Text(
                    formatClock(status.feed.remainingSec),
                    color = OceanCyan,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
        Spacer(Modifier.height(12.dp))
    }

    if (!live) {
        val detail = if (!status.connected) {
            "Hub is offline. Numerals are last known, not live."
        } else {
            "Readings are stale. Do not treat this as a healthy tank."
        }
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .border(1.dp, OceanWarn.copy(alpha = 0.35f), RoundedCornerShape(18.dp))
                .background(OceanWarn.copy(alpha = 0.10f))
                .padding(14.dp),
        ) {
            Text(if (!status.connected) "Offline" else "Stale", color = OceanWarn, fontWeight = FontWeight.Medium)
            Text(detail, color = OceanFoam.copy(alpha = 0.75f), fontSize = 13.sp)
        }
        Spacer(Modifier.height(12.dp))
    }

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        probes.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                row.forEach { probe ->
                    HugeProbe(
                        probe = probe,
                        live = live,
                        modifier = Modifier.weight(1f),
                    )
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }

    Spacer(Modifier.height(12.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        EquipChip("Return", returnPump, live, Modifier.weight(1f))
        EquipChip("Gyre", gyre, live, Modifier.weight(1f))
        Column(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(18.dp))
                .border(1.dp, OceanStroke, RoundedCornerShape(18.dp))
                .background(Card)
                .padding(12.dp),
        ) {
            Text("LIGHTS", color = OceanMuted, fontSize = 10.sp, letterSpacing = 1.6.sp)
            Text(
                "${lightsOn}/${status.lights.size}",
                color = if (live) OceanFoam else OceanWarn,
                fontWeight = FontWeight.Medium,
            )
            Text("AI on schedule", color = OceanMuted, fontSize = 11.sp)
        }
    }

    if (status.room.available) {
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            RoomStat("Room", status.room.temperatureF?.let { "${it.toInt()}°" } ?: "—", Modifier.weight(1f))
            RoomStat("RH", status.room.humidity?.let { "${it.toInt()}%" } ?: "—", Modifier.weight(1f))
            RoomStat("CO₂", status.room.co2?.toInt()?.toString() ?: "—", Modifier.weight(1f))
            RoomStat("VOC", status.room.voc?.toInt()?.toString() ?: "—", Modifier.weight(1f))
        }
    } else {
        Spacer(Modifier.height(16.dp))
        Text(
            "Room CO₂ / VOC arrive with a Pro panel. Demo tank fakes them so you can see the pH story.",
            color = OceanMuted.copy(alpha = 0.8f),
            fontSize = 11.sp,
            modifier = Modifier.fillMaxWidth(),
        )
    }

    if (extras.isNotEmpty()) {
        Spacer(Modifier.height(12.dp))
        extras.forEach { probe ->
            Text(
                "${probe.name} ${probe.display}${if (probe.unit.isNotBlank()) " ${probe.unit}" else ""}",
                color = OceanFoam.copy(alpha = 0.7f),
                fontSize = 12.sp,
                modifier = Modifier.padding(vertical = 2.dp),
            )
        }
    }
}

@Composable
private fun HugeProbe(
    probe: Probe,
    live: Boolean,
    modifier: Modifier = Modifier,
) {
    val tone = when {
        !live -> OceanWarn
        probe.band == "alarm" -> OceanAlarm
        probe.band == "warn" || probe.band == "stale" -> OceanWarn
        else -> OceanFoam
    }
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, OceanStroke, RoundedCornerShape(18.dp))
            .background(Card)
            .padding(horizontal = 12.dp, vertical = 14.dp),
    ) {
        Text(
            probe.name.uppercase(),
            color = OceanMuted,
            fontSize = 11.sp,
            letterSpacing = 1.8.sp,
        )
        Spacer(Modifier.height(4.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                text = probe.display.ifBlank { "—" },
                color = tone,
                fontFamily = FontFamily.Monospace,
                fontSize = 40.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = (-1.2).sp,
                lineHeight = 42.sp,
            )
            if (probe.unit.isNotBlank()) {
                Text(
                    " ${probe.unit}",
                    color = OceanMuted,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(bottom = 4.dp),
                )
            }
        }
    }
}

@Composable
private fun EquipChip(
    label: String,
    outlet: Outlet?,
    live: Boolean,
    modifier: Modifier = Modifier,
) {
    val running = outlet?.running == true
    val valueColor = when {
        !live -> OceanWarn
        running -> OceanFoam
        else -> OceanFoam.copy(alpha = 0.7f)
    }
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, OceanStroke, RoundedCornerShape(18.dp))
            .background(Card)
            .padding(12.dp),
    ) {
        Text(label.uppercase(), color = OceanMuted, fontSize = 10.sp, letterSpacing = 1.6.sp)
        Text(
            text = when {
                outlet == null -> "—"
                running -> "On"
                else -> "Off"
            },
            color = valueColor,
            fontWeight = FontWeight.Medium,
        )
        Text(
            outlet?.mode ?: "not seen",
            color = OceanMuted,
            fontSize = 11.sp,
        )
    }
}

@Composable
private fun RoomStat(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, OceanStroke, RoundedCornerShape(14.dp))
            .background(Card)
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(label, color = OceanMuted, fontSize = 10.sp)
        Text(value, color = OceanFoam, fontFamily = FontFamily.Monospace, fontSize = 13.sp)
    }
}
