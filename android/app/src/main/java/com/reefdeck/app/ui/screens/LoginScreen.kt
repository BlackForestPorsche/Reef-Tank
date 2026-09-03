package com.reefdeck.app.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.reefdeck.app.ui.DemoViewModel
import com.reefdeck.app.ui.SessionUi
import com.reefdeck.app.ui.SessionViewModel
import com.reefdeck.app.ui.components.OceanButton
import com.reefdeck.app.ui.components.OceanCard
import com.reefdeck.app.ui.components.OceanField
import com.reefdeck.app.ui.theme.OceanAlarm
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanTeal

@Composable
fun LoginScreen(
    session: SessionUi,
    vm: SessionViewModel,
    demoVm: DemoViewModel,
    onRegister: () -> Unit,
    onDemo: () -> Unit,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 28.dp),
    ) {
        Text(
            text = "Sightglass 0.1.1-alpha",
            color = OceanTeal.copy(alpha = 0.85f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 2.4.sp,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = "Sign in",
            color = OceanFoam,
            fontSize = 28.sp,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Helm account. Lives on this box. Same login as the website.",
            color = OceanMuted,
            fontSize = 15.sp,
            lineHeight = 21.sp,
        )

        Spacer(Modifier.height(22.dp))
        OceanField(
            value = session.hubUrl,
            onValueChange = vm::setHubUrlDraft,
            label = "Helm URL",
            keyboardType = KeyboardType.Uri,
            placeholder = "http://10.0.2.2:43180",
        )
        Spacer(Modifier.height(6.dp))
        Text(
            "Emulator default is 10.0.2.2. On a phone use http://192.168.x.x:43180",
            color = OceanMuted,
            fontSize = 12.sp,
        )
        Spacer(Modifier.height(12.dp))
        OceanField(
            value = email,
            onValueChange = {
                email = it
                vm.clearMessages()
            },
            label = "Email",
            keyboardType = KeyboardType.Email,
        )
        Spacer(Modifier.height(12.dp))
        OceanField(
            value = password,
            onValueChange = {
                password = it
                vm.clearMessages()
            },
            label = "Password",
            password = true,
        )

        if (session.error != null) {
            Spacer(Modifier.height(14.dp))
            OceanCard {
                Text(session.error, color = OceanAlarm, fontSize = 14.sp)
            }
        }
        if (session.notice != null) {
            Spacer(Modifier.height(10.dp))
            Text(session.notice, color = OceanTeal, fontSize = 13.sp)
        }

        Spacer(Modifier.height(20.dp))
        OceanButton(
            text = if (session.busy) "Signing in…" else "Log in",
            onClick = { vm.login(email, password) },
            busy = session.busy,
            enabled = email.isNotBlank() && password.isNotBlank(),
        )

        TextButton(
            onClick = {
                vm.clearMessages()
                onRegister()
            },
            modifier = Modifier.align(Alignment.CenterHorizontally),
        ) {
            Text("Create a Helm account", color = OceanTeal)
        }
        TextButton(
            onClick = {
                demoVm.run("seed")
                onDemo()
            },
            modifier = Modifier.align(Alignment.CenterHorizontally),
        ) {
            Text("No hardware? Load a demo rack", color = OceanMuted)
        }
    }
}
