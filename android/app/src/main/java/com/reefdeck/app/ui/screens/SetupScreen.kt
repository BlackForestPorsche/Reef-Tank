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
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.reefdeck.app.ui.AboutViewModel
import com.reefdeck.app.ui.SessionUi
import com.reefdeck.app.ui.SessionViewModel
import com.reefdeck.app.ui.SetupViewModel
import com.reefdeck.app.ui.components.OceanButton
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.components.OceanField
import com.reefdeck.app.ui.theme.OceanAlarm
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanTeal
import com.reefdeck.app.ui.theme.OceanWarn

@Composable
fun SetupScreen(
    session: SessionUi,
    sessionVm: SessionViewModel,
    setupVm: SetupViewModel,
    aboutVm: AboutViewModel,
    onAbout: () -> Unit,
    onDemo: () -> Unit,
) {
    val setup by setupVm.ui.collectAsStateWithLifecycle()
    val about by aboutVm.ui.collectAsStateWithLifecycle()
    val settings = setup.settings
    val version = about.hub

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
    ) {
        Text(
            text = "SETUP",
            color = OceanTeal.copy(alpha = 0.85f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 2.4.sp,
        )
        Spacer(Modifier.height(4.dp))
        Text("This phone", color = OceanFoam, fontSize = 26.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(6.dp))
        Text(
            "Signed in as ${session.email.ifBlank { "—" }}. Same Helm account as the website.",
            color = OceanMuted,
            fontSize = 14.sp,
        )

        Spacer(Modifier.height(18.dp))
        OceanField(
            value = setup.hubUrl,
            onValueChange = setupVm::setHubUrl,
            label = "Helm URL",
            keyboardType = KeyboardType.Uri,
            placeholder = "http://10.0.2.2:43180",
        )
        Spacer(Modifier.height(10.dp))
        OceanButton(
            text = "Save Helm URL",
            onClick = {
                setupVm.saveHubUrl()
                sessionVm.setHubUrlDraft(setup.hubUrl)
                sessionVm.saveHubUrl()
            },
        )
        if (setup.testResult != null) {
            Spacer(Modifier.height(8.dp))
            Text(
                setup.testResult,
                color = if (setup.testOk) OceanTeal else OceanAlarm,
                fontSize = 13.sp,
            )
        }

        Spacer(Modifier.height(16.dp))
        OceanCard {
            Text("ALLOW CONTROLS", color = OceanMuted, fontSize = 11.sp, letterSpacing = 1.6.sp)
            Spacer(Modifier.height(4.dp))
            Text(
                if (settings?.controlsEnabled == true) "Writes are on" else "Writes are locked",
                color = if (settings?.controlsEnabled == true) OceanTeal else OceanWarn,
                fontWeight = FontWeight.Medium,
            )
            Text(
                "Allow controls lives on the Helm website Setup for this alpha. This phone only shows the current flag.",
                color = OceanMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 6.dp),
            )
            if (settings != null) {
                Spacer(Modifier.height(10.dp))
                Text(
                    "${settings.tankName.ifBlank { "Unnamed tank" }} · ${if (settings.source == "apex") "Apex Local" else "Demo tank"}",
                    color = OceanFoam,
                    fontSize = 13.sp,
                )
            }
        }

        Spacer(Modifier.height(12.dp))
        OceanCard {
            Text("ON THE HELM WEBSITE", color = OceanMuted, fontSize = 11.sp, letterSpacing = 1.6.sp)
            Spacer(Modifier.height(6.dp))
            Text(
                "Demo kits, notes, revision are on the Helm website",
                color = OceanFoam,
                fontWeight = FontWeight.Medium,
            )
            Text(
                "Open the same Helm URL in a browser for shopping lists, release notes, and dummy unboxing.",
                color = OceanMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
            Spacer(Modifier.height(10.dp))
            OceanButton(text = "Demo hardware", onClick = onDemo)
        }

        Spacer(Modifier.height(12.dp))
        OceanCard {
            Text("FIRMWARE PUSH", color = OceanMuted, fontSize = 11.sp, letterSpacing = 1.6.sp)
            Spacer(Modifier.height(6.dp))
            Text(
                "Hub ${setup.ota?.hub?.status ?: "…"} · Panels ${setup.ota?.panel?.status ?: "…"}",
                color = OceanFoam,
                fontSize = 13.sp,
            )
            Text(
                if (setup.ota?.panel?.binaryPresent == true) {
                    "panel.bin is staged on the Hub."
                } else {
                    "Stage data/firmware/panel.bin on the Hub before pushing panels."
                },
                color = OceanMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
            setup.ota?.hub?.lastError?.let {
                Text(it, color = OceanWarn, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp))
            }
            setup.ota?.panel?.lastError?.let {
                Text(it, color = OceanWarn, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp))
            }
            setup.otaNotice?.let {
                Text(it, color = OceanTeal, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp))
            }
            setup.otaError?.let {
                Text(it, color = OceanAlarm, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp))
            }
            Spacer(Modifier.height(10.dp))
            OceanButton(
                text = if (setup.otaBusy) "Pushing…" else "Push Helm update",
                onClick = { setupVm.pushFirmware("hub") },
            )
            Spacer(Modifier.height(8.dp))
            OceanButton(
                text = "Push Sightglass firmware",
                onClick = { setupVm.pushFirmware("panel") },
            )
            Spacer(Modifier.height(8.dp))
            OceanButton(
                text = "Push both",
                onClick = { setupVm.pushFirmware("all") },
            )
        }

        Spacer(Modifier.height(12.dp))
        OceanCard {
            Text("VERSION", color = OceanMuted, fontSize = 11.sp, letterSpacing = 1.6.sp)
            Spacer(Modifier.height(4.dp))
            Text(
                version?.version ?: "0.1.1-alpha",
                color = OceanFoam,
                fontWeight = FontWeight.Medium,
            )
            Text(
                listOfNotNull(
                    version?.channel?.takeIf { it.isNotBlank() } ?: "alpha",
                    version?.revision?.takeIf { it.isNotBlank() },
                    version?.released?.takeIf { it.isNotBlank() },
                ).joinToString(" · "),
                color = OceanMuted,
                fontSize = 13.sp,
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = onAbout) {
                    Text("Release notes & revision", color = OceanTeal)
                }
            }
        }

        Spacer(Modifier.height(20.dp))
        OceanButton(
            text = "Log out",
            onClick = sessionVm::logout,
            container = OceanAlarm,
            content = OceanFoam,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Token stays on this phone. Logging out does not remove the Helm account.",
            color = OceanMuted,
            fontSize = 12.sp,
        )
    }
}
