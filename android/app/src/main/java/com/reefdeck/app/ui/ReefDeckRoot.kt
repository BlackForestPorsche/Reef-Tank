package com.reefdeck.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.SetMeal
import androidx.compose.material.icons.outlined.WaterDrop
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.reefdeck.app.ReefDeckApp
import com.reefdeck.app.ui.screens.AboutScreen
import com.reefdeck.app.ui.screens.DemoScreen
import com.reefdeck.app.ui.screens.FeedScreen
import com.reefdeck.app.ui.screens.GlanceScreen
import com.reefdeck.app.ui.screens.LightsScreen
import com.reefdeck.app.ui.screens.LoginScreen
import com.reefdeck.app.ui.screens.MoreScreen
import com.reefdeck.app.ui.screens.OutletsScreen
import com.reefdeck.app.ui.screens.RegisterScreen
import com.reefdeck.app.ui.screens.SetupScreen
import com.reefdeck.app.ui.theme.OceanBlack
import com.reefdeck.app.ui.theme.OceanFoam
import com.reefdeck.app.ui.theme.OceanMuted
import com.reefdeck.app.ui.theme.OceanTeal

object Routes {
    const val Login = "login"
    const val Register = "register"
    const val Glance = "glance"
    const val Feed = "feed"
    const val Outlets = "outlets"
    const val Lights = "lights"
    const val More = "more"
    const val Setup = "setup"
    const val About = "about"
    const val Demo = "demo"
}

private data class Tab(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

@Composable
fun ReefDeckRoot() {
    val app = LocalContext.current.applicationContext as ReefDeckApp
    val factory = remember(app) { ReefViewModelFactory(app) }
    val sessionVm: SessionViewModel = viewModel(factory = factory)
    val tankVm: TankViewModel = viewModel(factory = factory)
    val setupVm: SetupViewModel = viewModel(factory = factory)
    val aboutVm: AboutViewModel = viewModel(factory = factory)
    val demoVm: DemoViewModel = viewModel(factory = factory)

    val session by sessionVm.ui.collectAsStateWithLifecycle()
    val tank by tankVm.ui.collectAsStateWithLifecycle()

    LaunchedEffect(tank.error) {
        if (!app.hub.hasToken() && sessionVm.ui.value.loggedIn) {
            sessionVm.syncAuth()
        }
    }

    val nav = rememberNavController()
    LaunchedEffect(session.loggedIn) {
        val target = if (session.loggedIn) Routes.Glance else Routes.Login
        val current = nav.currentDestination?.route
        if (current == null || current == target) return@LaunchedEffect
        if (!session.loggedIn && current == Routes.Register) return@LaunchedEffect
        runCatching {
            nav.navigate(target) {
                popUpTo(0) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    val tabs = listOf(
        Tab(Routes.Glance, "Glance", Icons.Outlined.Dashboard),
        Tab(Routes.Feed, "Feed", Icons.Outlined.SetMeal),
        Tab(Routes.Outlets, "Outlets", Icons.Outlined.WaterDrop),
        Tab(Routes.Lights, "Lights", Icons.Outlined.Lightbulb),
        Tab(Routes.More, "More", Icons.Outlined.MoreHoriz),
    )

    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val showBar = session.loggedIn && currentRoute !in setOf(Routes.Login, Routes.Register)

    val barColors = NavigationBarItemDefaults.colors(
        selectedIconColor = OceanTeal,
        selectedTextColor = OceanTeal,
        unselectedIconColor = OceanMuted,
        unselectedTextColor = OceanMuted,
        indicatorColor = Color.White.copy(alpha = 0.06f),
    )

    Scaffold(
        containerColor = OceanBlack,
        bottomBar = {
            if (showBar) {
                NavigationBar(
                    containerColor = OceanBlack.copy(alpha = 0.94f),
                    contentColor = OceanFoam,
                ) {
                    tabs.forEach { tab ->
                        val selected = when (tab.route) {
                            Routes.More -> currentRoute in setOf(Routes.More, Routes.Setup, Routes.About, Routes.Demo)
                            else -> backStack?.destination?.hierarchy?.any { it.route == tab.route } == true
                        }
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label, fontSize = 11.sp) },
                            colors = barColors,
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = if (app.hub.hasToken()) Routes.Glance else Routes.Login,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.Login) {
                LoginScreen(
                    session = session,
                    vm = sessionVm,
                    demoVm = demoVm,
                    onRegister = { nav.navigate(Routes.Register) },
                    onDemo = { nav.navigate(Routes.Demo) },
                )
            }
            composable(Routes.Register) {
                RegisterScreen(
                    session = session,
                    vm = sessionVm,
                    onBack = { nav.popBackStack() },
                )
            }
            composable(Routes.Glance) { GlanceScreen(tank = tank) }
            composable(Routes.Feed) { FeedScreen(tank = tank, vm = tankVm) }
            composable(Routes.Outlets) { OutletsScreen(tank = tank, vm = tankVm) }
            composable(Routes.Lights) { LightsScreen(tank = tank) }
            composable(Routes.More) {
                MoreScreen(
                    tank = tank,
                    session = session,
                    onSetup = { nav.navigate(Routes.Setup) },
                    onAbout = { nav.navigate(Routes.About) },
                    onDemo = { nav.navigate(Routes.Demo) },
                )
            }
            composable(Routes.Setup) {
                SetupScreen(
                    session = session,
                    sessionVm = sessionVm,
                    setupVm = setupVm,
                    aboutVm = aboutVm,
                    onAbout = { nav.navigate(Routes.About) },
                    onDemo = { nav.navigate(Routes.Demo) },
                )
            }
            composable(Routes.Demo) {
                DemoScreen(demoVm = demoVm)
            }
            composable(Routes.About) {
                AboutScreen(
                    aboutVm = aboutVm,
                    onBack = { nav.popBackStack() },
                )
            }
        }
    }
}
