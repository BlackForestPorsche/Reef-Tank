package com.reefdeck.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.reefdeck.app.ReefDeckApp
import com.reefdeck.app.data.HubRepository
import com.reefdeck.app.data.models.DemoProvision
import com.reefdeck.app.data.models.HubSettingsPublic
import com.reefdeck.app.data.models.OtaStatus
import com.reefdeck.app.data.models.TankStatus
import com.reefdeck.app.data.models.VersionInfo
import com.reefdeck.app.data.store.SessionStore
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import retrofit2.HttpException

data class SessionUi(
    val loggedIn: Boolean = false,
    val email: String = "",
    val hubUrl: String = SessionStore.DEFAULT_HUB_URL,
    val busy: Boolean = false,
    val error: String? = null,
    val notice: String? = null,
)

class SessionViewModel(
    private val hub: HubRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(
        SessionUi(
            loggedIn = hub.hasToken(),
            email = hub.email(),
            hubUrl = hub.hubUrl(),
        ),
    )
    val ui: StateFlow<SessionUi> = _ui

    init {
        if (hub.hasToken()) {
            viewModelScope.launch {
                runCatching { hub.refreshMe() }
                    .onSuccess { me ->
                        _ui.update {
                            it.copy(
                                loggedIn = hub.hasToken(),
                                email = me?.resolvedEmail(hub.email()) ?: hub.email(),
                            )
                        }
                    }
                    .onFailure {
                        _ui.update {
                            it.copy(
                                loggedIn = hub.hasToken(),
                                email = hub.email(),
                            )
                        }
                    }
            }
        }
    }

    fun setHubUrlDraft(url: String) {
        _ui.update { it.copy(hubUrl = url, error = null) }
    }

    fun saveHubUrl() {
        hub.setHubUrl(_ui.value.hubUrl)
        _ui.update {
            it.copy(
                hubUrl = hub.hubUrl(),
                notice = "Helm URL saved",
                error = null,
            )
        }
    }

    fun syncAuth() {
        _ui.update {
            it.copy(
                loggedIn = hub.hasToken(),
                email = hub.email(),
                hubUrl = hub.hubUrl(),
            )
        }
    }

    fun login(email: String, password: String) = authenticate(email, password, register = false)

    fun register(email: String, password: String) = authenticate(email, password, register = true)

    fun logout() {
        hub.logout()
        _ui.update {
            it.copy(
                loggedIn = false,
                email = "",
                busy = false,
                error = null,
                notice = null,
            )
        }
    }

    fun clearMessages() {
        _ui.update { it.copy(error = null, notice = null) }
    }

    private fun authenticate(email: String, password: String, register: Boolean) {
        val trimmed = email.trim()
        if (trimmed.isEmpty() || password.isEmpty()) {
            _ui.update { it.copy(error = "Email and password are required") }
            return
        }
        if (register && password.length < 8) {
            _ui.update { it.copy(error = "Password must be at least 8 characters") }
            return
        }
        viewModelScope.launch {
            hub.setHubUrl(_ui.value.hubUrl)
            _ui.update { it.copy(busy = true, error = null, hubUrl = hub.hubUrl()) }
            val result = runCatching {
                if (register) hub.register(trimmed, password) else hub.login(trimmed, password)
            }
            result
                .onSuccess { res ->
                    _ui.update {
                        it.copy(
                            loggedIn = true,
                            email = res.resolvedEmail(trimmed),
                            busy = false,
                            error = null,
                        )
                    }
                }
                .onFailure { err ->
                    _ui.update {
                        it.copy(
                            busy = false,
                            loggedIn = false,
                            error = hub.errorMessage(err),
                        )
                    }
                }
        }
    }
}

data class TankUi(
    val status: TankStatus? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val actionError: String? = null,
    val actionNotice: String? = null,
    val busyAction: Boolean = false,
)

class TankViewModel(
    private val hub: HubRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(TankUi())
    val ui: StateFlow<TankUi> = _ui
    private var poll: Job? = null

    init {
        start()
    }

    fun start() {
        if (poll?.isActive == true) return
        poll = viewModelScope.launch {
            while (isActive) {
                refresh(silent = _ui.value.status != null)
                delay(2_000)
            }
        }
    }

    fun refresh(silent: Boolean = false) {
        viewModelScope.launch {
            if (!silent) _ui.update { it.copy(loading = it.status == null) }
            runCatching { hub.status() }
                .onSuccess { status ->
                    _ui.update {
                        it.copy(status = status, loading = false, error = null)
                    }
                }
                .onFailure { err ->
                    _ui.update {
                        it.copy(
                            loading = false,
                            error = hub.errorMessage(err),
                        )
                    }
                    if (err is HttpException && err.code() == 401) {
                        hub.logout()
                    }
                }
        }
    }

    fun feed(id: String) {
        viewModelScope.launch {
            _ui.update { it.copy(busyAction = true, actionError = null, actionNotice = null) }
            runCatching { hub.feed(id) }
                .onSuccess { status ->
                    val notice = if (id == "cancel") "Feed cancelled" else "Feed $id started"
                    _ui.update {
                        it.copy(
                            status = status,
                            busyAction = false,
                            actionNotice = notice,
                        )
                    }
                }
                .onFailure { err ->
                    _ui.update {
                        it.copy(busyAction = false, actionError = hub.errorMessage(err))
                    }
                }
        }
    }

    fun setOutlet(id: String, name: String, mode: String) {
        viewModelScope.launch {
            _ui.update { it.copy(busyAction = true, actionError = null, actionNotice = null) }
            runCatching { hub.setOutlet(id, mode) }
                .onSuccess { status ->
                    _ui.update {
                        it.copy(
                            status = status,
                            busyAction = false,
                            actionNotice = "$name → $mode",
                        )
                    }
                }
                .onFailure { err ->
                    _ui.update {
                        it.copy(busyAction = false, actionError = hub.errorMessage(err))
                    }
                }
        }
    }

    fun clearActionMessages() {
        _ui.update { it.copy(actionError = null, actionNotice = null) }
    }
}

data class SetupUi(
    val hubUrl: String = SessionStore.DEFAULT_HUB_URL,
    val settings: HubSettingsPublic? = null,
    val testing: Boolean = false,
    val testResult: String? = null,
    val testOk: Boolean = false,
    val ota: OtaStatus? = null,
    val otaBusy: Boolean = false,
    val otaNotice: String? = null,
    val otaError: String? = null,
)

class SetupViewModel(
    private val hub: HubRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(SetupUi(hubUrl = hub.hubUrl()))
    val ui: StateFlow<SetupUi> = _ui

    init {
        viewModelScope.launch {
            runCatching { hub.settings() }
                .onSuccess { settings -> _ui.update { it.copy(settings = settings) } }
            runCatching { hub.ota() }
                .onSuccess { ota -> _ui.update { it.copy(ota = ota) } }
        }
    }

    fun setHubUrl(url: String) {
        _ui.update { it.copy(hubUrl = url, testResult = null) }
    }

    fun saveHubUrl() {
        hub.setHubUrl(_ui.value.hubUrl)
        _ui.update {
            it.copy(
                hubUrl = hub.hubUrl(),
                testResult = "Saved ${hub.hubUrl()}",
                testOk = true,
            )
        }
    }

    fun testConnection() {
        hub.setHubUrl(_ui.value.hubUrl)
        viewModelScope.launch {
            _ui.update { it.copy(testing = true, testResult = null) }
            runCatching { hub.status() }
                .onSuccess { status ->
                    _ui.update {
                        it.copy(
                            testing = false,
                            testOk = true,
                            testResult = "Reached ${status.tankName} (${status.source})",
                            hubUrl = hub.hubUrl(),
                        )
                    }
                }
                .onFailure { err ->
                    _ui.update {
                        it.copy(
                            testing = false,
                            testOk = false,
                            testResult = hub.errorMessage(err),
                            hubUrl = hub.hubUrl(),
                        )
                    }
                }
        }
    }

    fun pushFirmware(target: String) {
        viewModelScope.launch {
            _ui.update { it.copy(otaBusy = true, otaError = null, otaNotice = null) }
            runCatching { hub.pushOta(target) }
                .onSuccess { ota ->
                    val notice = when (target) {
                        "hub" -> "Helm update queued"
                        "panel" -> "Sightglass update queued"
                        else -> "Helm and Sightglass queued"
                    }
                    _ui.update { it.copy(ota = ota, otaBusy = false, otaNotice = notice) }
                }
                .onFailure { err ->
                    _ui.update {
                        it.copy(otaBusy = false, otaError = hub.errorMessage(err))
                    }
                }
        }
    }
}

data class AboutUi(
    val appVersion: String = "0.1.1-alpha",
    val hub: VersionInfo? = null,
    val error: String? = null,
)

data class DemoUi(
    val provision: DemoProvision? = null,
    val glassName: String = "",
    val busy: Boolean = false,
    val notice: String? = null,
    val error: String? = null,
)

class DemoViewModel(
    private val hub: HubRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(DemoUi())
    val ui: StateFlow<DemoUi> = _ui

    init {
        refresh()
    }

    fun setGlassName(name: String) {
        _ui.update { it.copy(glassName = name) }
    }

    fun refresh() {
        viewModelScope.launch {
            runCatching { hub.demo() }
                .onSuccess { res ->
                    _ui.update { it.copy(provision = res.provision, error = null) }
                }
                .onFailure { err ->
                    _ui.update { it.copy(error = hub.errorMessage(err)) }
                }
        }
    }

    fun run(action: String) {
        viewModelScope.launch {
            _ui.update { it.copy(busy = true, error = null, notice = null) }
            runCatching { hub.demoAction(action, _ui.value.glassName.ifBlank { null }) }
                .onSuccess { res ->
                    val notice = when (action) {
                        "seed" -> "Demo Helm + three Sightglass units loaded"
                        "add-helm" -> "Fake Helm online"
                        "add-sightglass" -> "Fake Sightglass in pairing"
                        "clear" -> "Demo hardware cleared"
                        else -> "Demo updated"
                    }
                    _ui.update {
                        it.copy(
                            provision = res.provision,
                            busy = false,
                            notice = notice,
                            error = null,
                        )
                    }
                }
                .onFailure { err ->
                    _ui.update {
                        it.copy(busy = false, error = hub.errorMessage(err))
                    }
                }
        }
    }
}

class AboutViewModel(
    private val hub: HubRepository,
) : ViewModel() {
    private val _ui = MutableStateFlow(AboutUi())
    val ui: StateFlow<AboutUi> = _ui

    init {
        viewModelScope.launch {
            runCatching { hub.version() }
                .onSuccess { version -> _ui.update { it.copy(hub = version, error = null) } }
                .onFailure { err -> _ui.update { it.copy(error = hub.errorMessage(err)) } }
        }
    }
}

class ReefViewModelFactory(
    private val app: ReefDeckApp,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        val hub = app.hub
        return when {
            modelClass.isAssignableFrom(SessionViewModel::class.java) -> SessionViewModel(hub) as T
            modelClass.isAssignableFrom(TankViewModel::class.java) -> TankViewModel(hub) as T
            modelClass.isAssignableFrom(SetupViewModel::class.java) -> SetupViewModel(hub) as T
            modelClass.isAssignableFrom(AboutViewModel::class.java) -> AboutViewModel(hub) as T
            modelClass.isAssignableFrom(DemoViewModel::class.java) -> DemoViewModel(hub) as T
            else -> throw IllegalArgumentException("Unknown ViewModel ${modelClass.name}")
        }
    }
}
