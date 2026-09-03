package com.reefdeck.app.data

import com.reefdeck.app.data.api.HubClient
import com.reefdeck.app.data.models.AuthRequest
import com.reefdeck.app.data.models.AuthResponse
import com.reefdeck.app.data.models.HubSettingsPublic
import com.reefdeck.app.data.models.OutletCommand
import com.reefdeck.app.data.models.TankStatus
import com.reefdeck.app.data.models.DemoRequest
import com.reefdeck.app.data.models.DemoResponse
import com.reefdeck.app.data.models.OtaPushRequest
import com.reefdeck.app.data.models.OtaStatus
import com.reefdeck.app.data.models.VersionInfo
import com.reefdeck.app.data.store.SessionStore
import retrofit2.HttpException

class HubRepository(private val session: SessionStore) {
    private val client = HubClient(session)

    fun hubUrl(): String = session.hubUrl()

    fun email(): String = session.email()

    fun hasToken(): Boolean = session.token().isNotBlank()

    fun setHubUrl(url: String) {
        session.setHubUrl(url)
        client.invalidate()
    }

    fun logout() {
        session.clearToken()
    }

    fun errorMessage(err: Throwable): String = client.parseError(err)

    suspend fun login(email: String, password: String): AuthResponse {
        val res = client.api().login(AuthRequest(email.trim(), password))
        persistAuth(res, email)
        return res
    }

    suspend fun register(email: String, password: String): AuthResponse {
        val res = client.api().register(AuthRequest(email.trim(), password))
        persistAuth(res, email)
        return res
    }

    suspend fun refreshMe(): AuthResponse? {
        if (!hasToken()) return null
        return try {
            val me = client.api().me()
            val email = me.resolvedEmail()
            if (email.isNotBlank()) {
                session.setSession(session.token(), email)
            }
            me
        } catch (err: HttpException) {
            if (err.code() == 401) {
                session.clearToken()
            }
            throw err
        }
    }

    suspend fun status(): TankStatus = client.api().status()

    suspend fun feed(id: String): TankStatus = client.api().feed(id)

    suspend fun setOutlet(id: String, mode: String): TankStatus =
        client.api().setOutlet(id, OutletCommand(mode))

    suspend fun settings(): HubSettingsPublic = client.api().settings()

    suspend fun version(): VersionInfo = client.api().version()

    suspend fun ota(): OtaStatus = client.api().ota()

    suspend fun pushOta(target: String): OtaStatus = client.api().pushOta(OtaPushRequest(target))

    suspend fun demo(): DemoResponse = client.api().demo()

    suspend fun demoAction(action: String, name: String? = null): DemoResponse =
        client.api().demoAction(DemoRequest(action, name))

    private fun persistAuth(res: AuthResponse, fallbackEmail: String) {
        val token = res.token?.takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("Hub did not return a token")
        session.setSession(token, res.resolvedEmail(fallbackEmail.trim()))
    }
}
