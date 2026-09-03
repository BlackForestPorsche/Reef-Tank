package com.reefdeck.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val OceanScheme = darkColorScheme(
    primary = OceanTeal,
    onPrimary = OceanBlack,
    primaryContainer = OceanTealDim,
    onPrimaryContainer = OceanFoam,
    secondary = OceanCyan,
    onSecondary = OceanBlack,
    background = OceanBlack,
    onBackground = OceanFoam,
    surface = OceanDeep,
    onSurface = OceanFoam,
    surfaceVariant = OceanCard,
    onSurfaceVariant = OceanMuted,
    outline = OceanStroke,
    error = OceanAlarm,
    onError = OceanBlack,
    tertiary = OceanOn,
    onTertiary = OceanBlack,
    scrim = Color(0xCC031016),
)

@Composable
fun ReefDeckTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = OceanScheme,
        typography = ReefDeckTypography,
        content = content,
    )
}
