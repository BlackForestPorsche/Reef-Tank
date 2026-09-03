package com.reefdeck.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.ui.graphics.toArgb
import com.reefdeck.app.ui.ReefDeckRoot
import com.reefdeck.app.ui.theme.OceanBlack
import com.reefdeck.app.ui.theme.ReefDeckTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val ocean = OceanBlack.toArgb()
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(ocean),
            navigationBarStyle = SystemBarStyle.dark(ocean),
        )
        setContent {
            ReefDeckTheme {
                ReefDeckRoot()
            }
        }
    }
}
