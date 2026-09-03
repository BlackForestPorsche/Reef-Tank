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
fun RegisterScreen(
    session: SessionUi,
    vm: SessionViewModel,
    onBack: () -> Unit,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var confirm by rememberSaveable { mutableStateOf("") }
    var localError by rememberSaveable { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 28.dp),
    ) {
        Text(
            text = "HUB ACCOUNT",
            color = OceanTeal.copy(alpha = 0.85f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            letterSpacing = 2.4.sp,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = "Create account",
            color = OceanFoam,
            fontSize = 28.sp,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "This lives on Helm, not a Linux login and not a required cloud. First account on a Helm is the owner.",
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
        Spacer(Modifier.height(12.dp))
        OceanField(
            value = email,
            onValueChange = {
                email = it
                localError = null
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
                localError = null
                vm.clearMessages()
            },
            label = "Password",
            password = true,
        )
        Spacer(Modifier.height(12.dp))
        OceanField(
            value = confirm,
            onValueChange = {
                confirm = it
                localError = null
            },
            label = "Confirm password",
            password = true,
        )

        val error = localError ?: session.error
        if (error != null) {
            Spacer(Modifier.height(14.dp))
            OceanCard {
                Text(error, color = OceanAlarm, fontSize = 14.sp)
            }
        }

        Spacer(Modifier.height(20.dp))
        OceanButton(
            text = if (session.busy) "Creating…" else "Register",
            busy = session.busy,
            onClick = {
                localError = when {
                    email.isBlank() || password.isBlank() -> "Email and password are required"
                    password != confirm -> "Passwords do not match"
                    password.length < 8 -> "Use at least 8 characters"
                    else -> null
                }
                if (localError == null) vm.register(email, password)
            },
        )

        TextButton(
            onClick = onBack,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        ) {
            Text("Already have an account", color = OceanTeal)
        }
    }
}
