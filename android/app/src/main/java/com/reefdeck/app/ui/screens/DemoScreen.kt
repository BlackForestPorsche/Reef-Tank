package com.reefdeck.app.ui.screens

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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.reefdeck.app.data.models.DemoGlass
import com.reefdeck.app.ui.DemoViewModel
import com.reefdeck.app.ui.components.OceanButton
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.components.OceanField
import com.reefdeck.app.ui.theme.OceanAlarm
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanTeal

@Composable
fun DemoScreen(demoVm: DemoViewModel) {
    val demo by demoVm.ui.collectAsStateWithLifecycle()
    val provision = demo.provision
    val glasses = provision?.panels.orEmpty()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
    ) {
        Text(
            "SALTY ELECTRONICS · DEMO",
            color = OceanTeal.copy(alpha = 0.85f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 2.4.sp,
        )
        Spacer(Modifier.height(4.dp))
        Text("Fake hardware", color = OceanFoam, fontSize = 26.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(6.dp))
        Text(
            "No Pi and no glass required. Seed a Helm and Sightglass units, then walk Glance, adopt, and firmware push. Same API as the website.",
            color = OceanMuted,
            fontSize = 14.sp,
        )

        Spacer(Modifier.height(16.dp))
        OceanButton(
            text = if (demo.busy) "Working…" else "Load demo rack",
            onClick = { demoVm.run("seed") },
            busy = demo.busy,
        )
        Spacer(Modifier.height(8.dp))
        OceanButton(text = "Add fake Helm", onClick = { demoVm.run("add-helm") })
        Spacer(Modifier.height(8.dp))
        OceanButton(text = "Add Sightglass", onClick = { demoVm.run("add-sightglass") })
        Spacer(Modifier.height(8.dp))
        OceanButton(text = "Clear", onClick = { demoVm.run("clear") })
        Spacer(Modifier.height(10.dp))
        OceanField(
            value = demo.glassName,
            onValueChange = demoVm::setGlassName,
            label = "Optional Sightglass name",
            placeholder = "Sump Sightglass",
        )

        demo.notice?.let {
            Spacer(Modifier.height(10.dp))
            Text(it, color = OceanTeal, fontSize = 13.sp)
        }
        demo.error?.let {
            Spacer(Modifier.height(10.dp))
            Text(it, color = OceanAlarm, fontSize = 13.sp)
        }

        Spacer(Modifier.height(16.dp))
        OceanCard {
            Text("HELM", color = OceanMuted, fontSize = 11.sp, letterSpacing = 1.6.sp)
            if (provision?.provisioned == true) {
                Text(
                    "${provision.serial} · ${provision.ssid ?: "LAN"}",
                    color = OceanFoam,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 4.dp),
                )
                Text(
                    "${provision.accountEmail ?: "demo"} · SoftAP Helm-${provision.serial.takeLast(4)}",
                    color = OceanMuted,
                    fontSize = 12.sp,
                )
            } else {
                Text("No Helm in demo yet.", color = OceanMuted, modifier = Modifier.padding(top = 4.dp))
            }
        }

        Spacer(Modifier.height(12.dp))
        if (glasses.isEmpty()) {
            Text("No Sightglass units. Seed the rack or add one.", color = OceanMuted, fontSize = 14.sp)
        } else {
            glasses.forEach { glass ->
                GlassCard(glass)
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun GlassCard(panel: DemoGlass) {
    OceanCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(panel.name, color = OceanFoam, fontWeight = FontWeight.Medium)
            Text(
                when {
                    panel.adopted -> "Adopted"
                    panel.pairing -> "Pairing"
                    else -> "Idle"
                },
                color = OceanTeal,
                fontSize = 11.sp,
            )
        }
        Text(
            "${panel.serial} · code ${panel.pairingCode} · SSID Sightglass-${panel.serial.takeLast(4)}",
            color = OceanMuted,
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}
