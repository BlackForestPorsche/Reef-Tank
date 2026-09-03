package com.reefdeck.app.data.api

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
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface HubApi {
    @POST("api/auth/register")
    suspend fun register(@Body body: AuthRequest): AuthResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: AuthRequest): AuthResponse

    @GET("api/auth/me")
    suspend fun me(): AuthResponse

    @GET("api/status")
    suspend fun status(): TankStatus

    @POST("api/feed/{id}")
    suspend fun feed(@Path("id") id: String): TankStatus

    @PUT("api/outlets/{id}")
    suspend fun setOutlet(
        @Path("id") id: String,
        @Body body: OutletCommand,
    ): TankStatus

    @GET("api/settings")
    suspend fun settings(): HubSettingsPublic

    @GET("api/version")
    suspend fun version(): VersionInfo

    @GET("api/ota")
    suspend fun ota(): OtaStatus

    @POST("api/ota")
    suspend fun pushOta(@Body body: OtaPushRequest): OtaStatus

    @GET("api/demo")
    suspend fun demo(): DemoResponse

    @POST("api/demo")
    suspend fun demoAction(@Body body: DemoRequest): DemoResponse
}
