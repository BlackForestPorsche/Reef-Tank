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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.reefdeck.app.data.models.Outlet
import com.reefdeck.app.ui.TankUi
import com.reefdeck.app.ui.TankViewModel
import com.reefdeck.app.ui.components.EmptyState
import com.reefdeck.app.ui.components.LoadingGlance
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.components.ScreenHeader
import com.reefdeck.app.ui.components.StatusDot
import com.reefdeck.app.ui.components.outletSubtitle
import com.reefdeck.app.ui.theme.Card
import com.reefdeck.app.ui.theme.OceanAlarm
import com.reefdeck.app.ui.theme.OceanBlack
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanOff
import com.reefdeck.app.ui.theme.OceanOn
import com.reefdeck.app.ui.theme.OceanStroke
import com.reefdeck.app.ui.theme.OceanTeal
import com.reefdeck.app.ui.theme.OceanWarn

private data class ModeSpec(
    val id: String,
    val label: String,
    val active: Color,
)

private val MODES = listOf(
    ModeSpec("off", "Off", OceanOff),
    ModeSpec("auto", "Auto", OceanTeal),
    ModeSpec("on", "On", OceanOn),
)

@Composable
fun OutletsScreen(
    tank: TankUi,
    vm: TankViewModel,
) {
    val status = tank.status
    var pendingOn by remember { mutableStateOf<Outlet?>(null) }

    pendingOn?.let { outlet ->
        AlertDialog(
            onDismissRequest = { pendingOn = null },
            containerColor = OceanBlack,
            title = { Text("Force ${outlet.name} on?", color = OceanFoam) },
            text = {
                Text(
                    "On overrides Apex until you put this outlet back on Auto. Livestock-critical gear should stay in Auto.",
                    color = OceanMuted,
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        vm.setOutlet(outlet.id, outlet.name, "on")
                        pendingOn = null
                    },
                ) {
                    Text("Turn on", color = OceanOn)
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingOn = null }) {
                    Text("Cancel", color = OceanMuted)
                }
            },
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
    ) {
        ScreenHeader(kicker = "Outlets", status = status)
        Spacer(Modifier.height(12.dp))

        when {
            tank.loading && status == null -> LoadingGlance()
            tank.error != null && status == null -> EmptyState("Hub offline", tank.error)
            status != null && status.outlets.isEmpty() -> {
                EmptyState(
                    title = "No outlets yet",
                    detail = "Connect Apex Local on the Hub website, or stay on the demo tank.",
                )
            }
            status != null -> {
                if (!status.controlsEnabled) {
                    OceanCard {
                        Text(
                            "Writes are locked. Auto is the safe default on Apex. Allow controls is on the Hub website Setup for this alpha.",
                            color = OceanWarn,
                            fontSize = 14.sp,
                        )
                    }
                } else {
                    Text(
                        "Off and On override Apex. Auto gives the program back. Livestock-critical outlets should live in Auto.",
                        color = OceanMuted,
                        fontSize = 14.sp,
                    )
                }

                if (tank.actionError != null) {
                    Spacer(Modifier.height(12.dp))
                    OceanCard {
                        Text(tank.actionError, color = OceanAlarm, fontSize = 14.sp)
                    }
                }
                if (tank.actionNotice != null) {
                    Spacer(Modifier.height(8.dp))
                    Text(tank.actionNotice, color = OceanTeal, fontSize = 13.sp)
                }

                Spacer(Modifier.height(12.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    status.outlets.forEach { outlet ->
                        OutletRow(
                            outlet = outlet,
                            enabled = status.controlsEnabled && !tank.busyAction,
                            onSelect = { mode ->
                                if (mode == outlet.mode) return@OutletRow
                                if (mode == "on") {
                                    pendingOn = outlet
                                } else {
                                    vm.setOutlet(outlet.id, outlet.name, mode)
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun OutletRow(
    outlet: Outlet,
    enabled: Boolean,
    onSelect: (String) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, OceanStroke, RoundedCornerShape(18.dp))
            .background(Card)
            .padding(14.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(outlet.name, color = OceanFoam, fontWeight = FontWeight.Medium)
                Text(outletSubtitle(outlet), color = OceanMuted, fontSize = 11.sp)
            }
            StatusDot(on = outlet.running)
        }
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(OceanBlack.copy(alpha = 0.35f))
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            MODES.forEach { mode ->
                val selected = outlet.mode == mode.id
                TextButton(
                    onClick = { onSelect(mode.id) },
                    enabled = enabled,
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (selected) mode.active.copy(alpha = 0.22f) else Color.Transparent),
                ) {
                    Text(
                        mode.label,
                        color = when {
                            selected -> mode.active
                            else -> OceanMuted
                        },
                        fontSize = 13.sp,
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                    )
                }
            }
        }
    }
}
