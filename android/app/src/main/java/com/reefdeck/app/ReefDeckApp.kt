package com.reefdeck.app

import android.app.Application
import com.reefdeck.app.data.HubRepository
import com.reefdeck.app.data.store.SessionStore

class ReefDeckApp : Application() {
    lateinit var session: SessionStore
        private set
    lateinit var hub: HubRepository
        private set

    override fun onCreate() {
        super.onCreate()
        session = SessionStore(this)
        hub = HubRepository(session)
    }
}
