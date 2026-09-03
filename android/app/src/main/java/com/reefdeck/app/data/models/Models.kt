package com.reefdeck.app.data.models

import kotlinx.serialization.Serializable

@Serializable
data class AuthRequest(
    val email: String,
    val password: String,
)

@Serializable
data class PublicUser(
    val id: String = "",
    val email: String = "",
    val owner: Boolean = false,
    val createdAt: Long = 0,
)

@Serializable
data class AuthResponse(
    val token: String? = null,
    val email: String? = null,
    val user: PublicUser? = null,
) {
    fun resolvedEmail(fallback: String = ""): String =
        user?.email?.takeIf { it.isNotBlank() }
            ?: email?.takeIf { it.isNotBlank() }
            ?: fallback
}

@Serializable
data class ErrorBody(
    val error: String = "Request failed",
)

@Serializable
data class OutletCommand(
    val mode: String,
)

@Serializable
data class ReleaseNote(
    val version: String = "",
    val date: String = "",
    val title: String = "",
    val highlights: List<String> = emptyList(),
)

@Serializable
data class OtaTargetStatus(
    val current: String = "",
    val target: String = "",
    val status: String = "idle",
    val lastError: String? = null,
    val binaryPresent: Boolean = false,
    val hostUpdater: Boolean = false,
    val url: String = "",
)

@Serializable
data class OtaDevice(
    val id: String = "",
    val kind: String = "",
    val version: String = "",
    val seenAt: Long = 0,
)

@Serializable
data class OtaStatus(
    val version: String = "0.1.1-alpha",
    val hub: OtaTargetStatus = OtaTargetStatus(),
    val panel: OtaTargetStatus = OtaTargetStatus(),
    val devices: List<OtaDevice> = emptyList(),
)

@Serializable
data class OtaPushRequest(
    val target: String,
)

@Serializable
data class VersionInfo(
    val version: String = "0.1.1-alpha",
    val channel: String = "alpha",
    val revision: String = "",
    val released: String = "",
    val codename: String = "",
    val notes: List<ReleaseNote> = emptyList(),
)

@Serializable
data class Probe(
    val id: String = "",
    val name: String = "",
    val kind: String = "other",
    val value: Double? = null,
    val unit: String = "",
    val display: String = "—",
    val band: String = "ok",
)

@Serializable
data class Outlet(
    val id: String = "",
    val name: String = "",
    val mode: String = "auto",
    val running: Boolean = false,
    val device: String = "other",
    val detail: String? = null,
)

@Serializable
data class FeedStatus(
    val active: String? = null,
    val remainingSec: Int = 0,
    val totalSec: Int = 0,
    val label: String = "",
)

@Serializable
data class LightChannel(
    val id: String = "",
    val name: String = "",
    val intensity: Int = 0,
    val schedule: String = "",
    val on: Boolean = false,
)

@Serializable
data class RoomSensors(
    val available: Boolean = false,
    val temperatureF: Double? = null,
    val humidity: Double? = null,
    val co2: Double? = null,
    val voc: Double? = null,
)

@Serializable
data class Alert(
    val id: String = "",
    val level: String = "info",
    val title: String = "",
    val detail: String = "",
)

@Serializable
data class HistoryPoint(
    val t: Long = 0,
    val temp: Double = 0.0,
    val ph: Double = 0.0,
)

@Serializable
data class DemoGlass(
    val id: String = "",
    val name: String = "",
    val serial: String = "",
    val pairingCode: String = "",
    val adopted: Boolean = false,
    val pairing: Boolean = false,
    val online: Boolean = false,
)

@Serializable
data class DemoProvision(
    val dummy: Boolean = true,
    val booted: Boolean = false,
    val paired: Boolean = false,
    val serial: String = "",
    val ssid: String? = null,
    val accountEmail: String? = null,
    val provisioned: Boolean = false,
    val panels: List<DemoGlass> = emptyList(),
)

@Serializable
data class DemoRequest(
    val action: String,
    val name: String? = null,
)

@Serializable
data class DemoResponse(
    val demo: Boolean = true,
    val provision: DemoProvision? = null,
    val panel: DemoGlass? = null,
    val error: String? = null,
)

@Serializable
data class HubInfo(
    val dummy: Boolean = false,
    val provisioned: Boolean = false,
    val serial: String = "",
    val ssid: String? = null,
    val accountEmail: String? = null,
    val panelsAdopted: Int = 0,
    val panels: List<DemoGlass> = emptyList(),
)

@Serializable
data class TankStatus(
    val tankName: String = "Connecting",
    val source: String = "mock",
    val connected: Boolean = false,
    val stale: Boolean = false,
    val updatedAt: Long = 0,
    val ageMs: Long = 0,
    val probes: List<Probe> = emptyList(),
    val outlets: List<Outlet> = emptyList(),
    val feed: FeedStatus = FeedStatus(),
    val lights: List<LightChannel> = emptyList(),
    val room: RoomSensors = RoomSensors(),
    val alerts: List<Alert> = emptyList(),
    val history: List<HistoryPoint> = emptyList(),
    val controlsEnabled: Boolean = true,
    val hub: HubInfo = HubInfo(),
)

@Serializable
data class HubSettingsPublic(
    val tankName: String = "",
    val source: String = "mock",
    val apexHost: String = "",
    val apexUser: String = "",
    val apexPasswordSet: Boolean = false,
    val controlsEnabled: Boolean = false,
    val tempUnit: String = "F",
)
