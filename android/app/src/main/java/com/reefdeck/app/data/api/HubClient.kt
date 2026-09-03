package com.reefdeck.app.data.api

import com.reefdeck.app.data.models.ErrorBody
import com.reefdeck.app.data.store.SessionStore
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.io.IOException
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalSerializationApi::class)
class HubClient(private val session: SessionStore) {
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        encodeDefaults = true
    }

    @Volatile
    private var cachedBase: String? = null

    @Volatile
    private var cachedApi: HubApi? = null

    @Synchronized
    fun api(): HubApi {
        val base = SessionStore.normalizeHubUrl(session.hubUrl()) + "/"
        val existing = cachedApi
        if (existing != null && cachedBase == base) return existing
        val created = build(base)
        cachedBase = base
        cachedApi = created
        return created
    }

    fun invalidate() {
        cachedApi = null
        cachedBase = null
    }

    fun parseError(err: Throwable): String {
        when (err) {
            is HttpException -> {
                val raw = err.response()?.errorBody()?.string().orEmpty()
                if (raw.isNotBlank()) {
                    runCatching { json.decodeFromString(ErrorBody.serializer(), raw) }
                        .onSuccess { return it.error }
                }
                return when (err.code()) {
                    401 -> "Not signed in"
                    404 -> "Hub endpoint missing (${err.code()})"
                    else -> "Hub error ${err.code()}"
                }
            }
            is IOException -> return "Cannot reach Helm. Check the Helm URL and LAN."
            else -> return err.message ?: "Request failed"
        }
    }

    private fun build(baseUrl: String): HubApi {
        val auth = Interceptor { chain ->
            val token = session.token()
            val req = if (token.isBlank()) {
                chain.request()
            } else {
                chain.request().newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            }
            chain.proceed(req)
        }
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        val ok = OkHttpClient.Builder()
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .addInterceptor(auth)
            .addInterceptor(logging)
            .build()
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(ok)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(HubApi::class.java)
    }
}
