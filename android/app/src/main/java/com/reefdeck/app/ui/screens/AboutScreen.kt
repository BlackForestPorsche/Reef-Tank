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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.reefdeck.app.data.models.ReleaseNote
import com.reefdeck.app.data.models.VersionInfo
import com.reefdeck.app.ui.AboutViewModel
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanTeal

private val FallbackVersion = VersionInfo(
    version = "0.1.1-alpha",
    channel = "alpha",
    revision = "0.1.1",
    released = "2026-09-02",
    notes = listOf(
        ReleaseNote(
            version = "0.1.1-alpha",
            date = "2026-09-02",
            title = "First glass",
            highlights = listOf(
                "Local website Hub with demo reef, Apex Local adapter, feed and outlets.",
                "Dummy Hub unboxing: Imager, plug in, pair, Wi-Fi, account, adopt screens.",
                "Native Android client (alpha) against the same LAN API.",
            ),
        ),
    ),
)

@Composable
fun AboutScreen(
    aboutVm: AboutViewModel,
    onBack: () -> Unit,
) {
    val about by aboutVm.ui.collectAsStateWithLifecycle()
    val info = about.hub ?: FallbackVersion
    val notes = info.notes.ifEmpty { FallbackVersion.notes }
    val usingFallback = about.hub == null

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(
                    Icons.AutoMirrored.Outlined.ArrowBack,
                    contentDescription = "Back",
                    tint = OceanFoam,
                )
            }
            Column {
                Text(
                    "RELEASE NOTES",
                    color = OceanTeal.copy(alpha = 0.85f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 2.4.sp,
                )
                Text("Revision", color = OceanFoam, fontSize = 22.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(12.dp))
        Text(
            info.version,
            color = OceanFoam,
            fontFamily = FontFamily.Monospace,
            fontSize = 28.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 8.dp),
        )
        Text(
            "First glass · ${info.channel} · released ${info.released.ifBlank { "2026-09-02" }}",
            color = OceanMuted,
            fontSize = 14.sp,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
        )
        if (usingFallback) {
            Text(
                "Hub unreachable. Showing the 0.1.1-alpha First glass build that ships with this phone app.",
                color = OceanMuted,
                fontSize = 13.sp,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
            )
        }

        Spacer(Modifier.height(12.dp))
        OceanCard {
            MetaRow("Version", info.version)
            MetaRow("Channel", info.channel.ifBlank { "alpha" })
            MetaRow("Revision", info.revision.ifBlank { "0.1.1" })
            MetaRow("Released", info.released.ifBlank { "2026-09-02" })
        }

        Spacer(Modifier.height(16.dp))
        notes.forEach { note ->
            OceanCard {
                Text(
                    "${note.version} · ${note.date}",
                    color = OceanTeal.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                )
                Text(
                    note.title.ifBlank { "First glass" },
                    color = OceanFoam,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 4.dp),
                )
                Spacer(Modifier.height(8.dp))
                note.highlights.forEach { line ->
                    Text(
                        "· $line",
                        color = OceanFoam.copy(alpha = 0.75f),
                        fontSize = 14.sp,
                        modifier = Modifier.padding(vertical = 2.dp),
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
        }
    }
}

@Composable
private fun MetaRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, color = OceanMuted, fontSize = 14.sp)
        Text(value, color = OceanFoam, fontWeight = FontWeight.Medium, fontSize = 14.sp)
    }
}
