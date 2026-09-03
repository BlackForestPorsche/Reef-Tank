package com.reefdeck.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.reefdeck.app.data.models.Alert
import com.reefdeck.app.data.models.Outlet
import com.reefdeck.app.data.models.Probe
import com.reefdeck.app.data.models.TankStatus
import com.reefdeck.app.ui.theme.Card
import com.reefdeck.app.ui.theme.OceanAlarm
import com.reefdeck.app.ui.theme.OceanBlack
import com.reefdeck.app.ui.theme.OceanCyan
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanInfo
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanStroke
import com.reefdeck.app.ui.theme.OceanTeal
import com.reefdeck.app.ui.theme.OceanWarn

val CardShape = RoundedCornerShape(18.dp)

@Composable
fun ScreenHeader(
    kicker: String,
    status: TankStatus?,
    modifier: Modifier = Modifier,
) {
    val age = status?.let { (it.ageMs / 1000).toInt() }
    val live = status?.connected == true && status.stale.not()
    val freshness = when {
        status == null -> "…"
        status.connected.not() -> "Offline"
        status.stale -> "Stale"
        else -> "Live"
    }
    val freshnessColor = when {
        status == null -> OceanMuted
        live -> OceanTeal
        else -> OceanWarn
    }
    val source = when (status?.source) {
        "apex" -> "Apex Local"
        "mock" -> "Demo tank"
        null -> "Hub"
        else -> status.source
    }
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = kicker.uppercase(),
                color = OceanTeal.copy(alpha = 0.85f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 2.4.sp,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = status?.tankName ?: "Connecting",
                color = OceanFoam,
                fontSize = 26.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .border(1.dp, OceanStroke, RoundedCornerShape(999.dp))
                .background(Color.White.copy(alpha = 0.04f))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.End,
        ) {
            Text(text = freshness, color = freshnessColor, fontSize = 11.sp, fontWeight = FontWeight.Medium)
            Text(
                text = buildString {
                    append(source)
                    if (age != null && status.connected) append(" · ${age}s")
                },
                color = OceanMuted,
                fontSize = 10.sp,
            )
        }
    }
}

@Composable
fun OceanCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(CardShape)
            .border(1.dp, OceanStroke, CardShape)
            .background(Card)
            .padding(16.dp),
        content = content,
    )
}

@Composable
fun ProbeCard(probe: Probe, modifier: Modifier = Modifier) {
    val tone = when (probe.band) {
        "alarm" -> OceanAlarm
        "warn", "stale" -> OceanWarn
        else -> OceanFoam
    }
    Column(
        modifier = modifier
            .clip(CardShape)
            .border(1.dp, OceanStroke, CardShape)
            .background(Card)
            .padding(horizontal = 14.dp, vertical = 16.dp),
    ) {
        Text(
            text = probe.name.uppercase(),
            color = OceanMuted,
            fontSize = 11.sp,
            letterSpacing = 1.8.sp,
        )
        Spacer(Modifier.height(6.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                text = probe.display.ifBlank { "—" },
                color = tone,
                fontFamily = FontFamily.Monospace,
                fontSize = 36.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = (-1).sp,
                lineHeight = 38.sp,
            )
            if (probe.unit.isNotBlank()) {
                Text(
                    text = " ${probe.unit}",
                    color = OceanMuted,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(bottom = 4.dp),
                )
            }
        }
    }
}

@Composable
fun AlertStrip(alerts: List<Alert>) {
    if (alerts.isEmpty()) {
        OceanCard(
            modifier = Modifier
                .border(1.dp, OceanTeal.copy(alpha = 0.2f), CardShape),
        ) {
            Text("Life support looks quiet. No alarms.", color = OceanTeal, fontSize = 14.sp)
        }
        return
    }
    val top = alerts.first()
    val tone = when (top.level) {
        "alarm" -> OceanAlarm
        "warn" -> OceanWarn
        else -> OceanInfo
    }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(CardShape)
            .border(1.dp, tone.copy(alpha = 0.35f), CardShape)
            .background(tone.copy(alpha = 0.12f))
            .padding(16.dp),
    ) {
        Text(top.title, color = OceanFoam, fontWeight = FontWeight.Medium)
        Text(top.detail, color = OceanFoam.copy(alpha = 0.7f), fontSize = 12.sp)
        if (alerts.size > 1) {
            Text("+${alerts.size - 1} more", color = OceanMuted, fontSize = 11.sp, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
fun EmptyState(title: String, detail: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(CardShape)
            .border(1.dp, OceanStroke, CardShape)
            .padding(horizontal = 16.dp, vertical = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(title, color = OceanFoam, fontWeight = FontWeight.Medium)
        Spacer(Modifier.height(6.dp))
        Text(detail, color = OceanMuted, fontSize = 14.sp)
    }
}

@Composable
fun LoadingGlance() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(64.dp)
                .clip(CardShape)
                .background(Color.White.copy(alpha = 0.06f)),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            repeat(2) {
                Box(
                    Modifier
                        .weight(1f)
                        .height(96.dp)
                        .clip(CardShape)
                        .background(Color.White.copy(alpha = 0.06f)),
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            repeat(2) {
                Box(
                    Modifier
                        .weight(1f)
                        .height(96.dp)
                        .clip(CardShape)
                        .background(Color.White.copy(alpha = 0.06f)),
                )
            }
        }
    }
}

@Composable
fun StatusDot(on: Boolean) {
    val color by animateColorAsState(if (on) OceanTeal else Color.White.copy(alpha = 0.2f), label = "dot")
    Box(
        modifier = Modifier
            .size(8.dp)
            .clip(CircleShape)
            .background(color),
    )
}

@Composable
fun OceanField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    password: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    placeholder: String = "",
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        label = { Text(label) },
        placeholder = if (placeholder.isBlank()) null else ({ Text(placeholder) }),
        singleLine = true,
        visualTransformation = if (password) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = if (password) KeyboardType.Password else keyboardType),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = OceanTeal,
            unfocusedBorderColor = OceanStroke,
            focusedLabelColor = OceanTeal,
            unfocusedLabelColor = OceanMuted,
            cursorColor = OceanTeal,
            focusedTextColor = OceanFoam,
            unfocusedTextColor = OceanFoam,
        ),
        shape = RoundedCornerShape(14.dp),
    )
}

@Composable
fun OceanButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    busy: Boolean = false,
    container: Color = OceanTeal,
    content: Color = OceanBlack,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !busy,
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = container,
            contentColor = content,
            disabledContainerColor = container.copy(alpha = 0.35f),
            disabledContentColor = content.copy(alpha = 0.6f),
        ),
    ) {
        if (busy) {
            CircularProgressIndicator(
                modifier = Modifier.size(18.dp),
                color = content,
                strokeWidth = 2.dp,
            )
        } else {
            Text(text, fontWeight = FontWeight.SemiBold)
        }
    }
}

fun featuredProbes(status: TankStatus): List<Probe> {
    val order = listOf("temp", "ph", "salinity", "alk")
    val picked = mutableListOf<Probe>()
    for (kind in order) {
        status.probes.firstOrNull { it.kind == kind }?.let { picked += it }
    }
    if (picked.size < 4) {
        for (probe in status.probes) {
            if (picked.size >= 4) break
            if (picked.none { it.id == probe.id }) picked += probe
        }
    }
    return picked
}

fun formatClock(totalSec: Int): String {
    val clamped = totalSec.coerceAtLeast(0)
    val m = clamped / 60
    val s = clamped % 60
    return "$m:${s.toString().padStart(2, '0')}"
}

fun outletSubtitle(outlet: Outlet): String {
    val detail = outlet.detail?.takeIf { it.isNotBlank() }
    return listOfNotNull(detail, outlet.device).joinToString(" · ")
}
