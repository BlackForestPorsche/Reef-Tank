package com.reefdeck.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.reefdeck.app.ui.TankUi
import com.reefdeck.app.ui.TankViewModel
import com.reefdeck.app.ui.components.EmptyState
import com.reefdeck.app.ui.components.LoadingGlance
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.components.ScreenHeader
import com.reefdeck.app.ui.components.formatClock
import com.reefdeck.app.ui.theme.Card
import com.reefdeck.app.ui.theme.OceanAlarm
import com.reefdeck.app.ui.theme.OceanCyan
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanStroke
import com.reefdeck.app.ui.theme.OceanTeal
import com.reefdeck.app.ui.theme.OceanWarn
import kotlinx.coroutines.delay

private data class FeedChannel(
    val id: String,
    val title: String,
    val blurb: String,
)

private val CHANNELS = listOf(
    FeedChannel("A", "Feed A", "Feeding — gyre and skimmer pause"),
    FeedChannel("B", "Feed B", "Water change"),
    FeedChannel("C", "Feed C", "Maintenance"),
    FeedChannel("D", "Feed D", "Custom Apex program"),
)

@Composable
fun FeedScreen(
    tank: TankUi,
    vm: TankViewModel,
) {
    val status = tank.status
    var armed by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(armed) {
        if (armed != null) {
            delay(4_000)
            armed = null
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp),
    ) {
        ScreenHeader(kicker = "Feed", status = status)
        Spacer(Modifier.height(12.dp))

        when {
            tank.loading && status == null -> LoadingGlance()
            tank.error != null && status == null -> EmptyState("Hub offline", tank.error)
            status != null -> {
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
                            "RUNNING ${status.feed.active}",
                            color = OceanCyan.copy(alpha = 0.8f),
                            fontSize = 11.sp,
                            letterSpacing = 1.8.sp,
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(status.feed.label, color = OceanFoam, fontSize = 18.sp, fontWeight = FontWeight.Medium)
                                Text(
                                    "Apex owns the timers. This only starts or cancels the cycle.",
                                    color = OceanMuted,
                                    fontSize = 12.sp,
                                )
                            }
                            Text(
                                formatClock(status.feed.remainingSec),
                                color = OceanCyan,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                    }
                } else {
                    Text(
                        "Tap a cycle once to arm it, tap again to start. Apex still owns the timers — pumps follow whatever you already programmed.",
                        color = OceanMuted,
                        fontSize = 14.sp,
                    )
                }

                if (!status.controlsEnabled) {
                    Spacer(Modifier.height(12.dp))
                    OceanCard {
                        Text(
                            "Controls are locked. Turn on writes in the Hub website Setup before feeding.",
                            color = OceanWarn,
                            fontSize = 14.sp,
                        )
                    }
                }

                if (tank.actionError != null) {
                    Spacer(Modifier.height(12.dp))
                    OceanCard {
                        Text(tank.actionError, color = OceanAlarm, fontSize = 14.sp)
                    }
                }
                if (tank.actionNotice != null) {
                    Spacer(Modifier.height(12.dp))
                    Text(tank.actionNotice, color = OceanTeal, fontSize = 13.sp)
                }

                Spacer(Modifier.height(16.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    CHANNELS.chunked(2).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            row.forEach { channel ->
                                TwoTapFeedButton(
                                    title = channel.title,
                                    hint = channel.blurb,
                                    armed = armed == channel.id,
                                    active = status.feed.active == channel.id,
                                    enabled = status.controlsEnabled && !tank.busyAction,
                                    modifier = Modifier.weight(1f),
                                    onArm = { armed = channel.id },
                                    onConfirm = {
                                        armed = null
                                        vm.feed(channel.id)
                                    },
                                )
                            }
                        }
                    }
                }

                if (status.feed.active != null) {
                    Spacer(Modifier.height(14.dp))
                    TwoTapFeedButton(
                        title = "Cancel feed",
                        hint = "Tap twice to restore Auto",
                        armed = armed == "cancel",
                        active = false,
                        enabled = status.controlsEnabled && !tank.busyAction,
                        danger = true,
                        modifier = Modifier.fillMaxWidth(),
                        onArm = { armed = "cancel" },
                        onConfirm = {
                            armed = null
                            vm.feed("cancel")
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun TwoTapFeedButton(
    title: String,
    hint: String,
    armed: Boolean,
    active: Boolean,
    enabled: Boolean,
    onArm: () -> Unit,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier,
    danger: Boolean = false,
) {
    val ring = when {
        armed -> OceanWarn
        active -> OceanTeal
        else -> OceanStroke
    }
    val shape = RoundedCornerShape(18.dp)
    Box(
        modifier = modifier
            .clip(shape)
            .border(1.dp, ring.copy(alpha = if (armed || active) 0.85f else 1f), shape)
            .background(
                when {
                    !enabled -> Card
                    armed && danger -> OceanAlarm.copy(alpha = 0.16f)
                    armed -> OceanWarn.copy(alpha = 0.14f)
                    active -> OceanTeal.copy(alpha = 0.12f)
                    else -> Card
                },
            )
            .clickable(enabled = enabled) {
                if (armed) onConfirm() else onArm()
            }
            .padding(16.dp),
    ) {
        Column {
            Text(
                text = if (armed) "Confirm $title" else title,
                color = if (enabled) OceanFoam else OceanMuted,
                fontWeight = FontWeight.Medium,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = if (armed) "Tap again to start" else hint,
                color = OceanMuted,
                fontSize = 12.sp,
            )
        }
    }
}
