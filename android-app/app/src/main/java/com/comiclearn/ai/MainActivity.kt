package com.comiclearn.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.comiclearn.ai.ui.ComicLearnViewModel
import com.comiclearn.ai.ui.ComicViewerScreen
import com.comiclearn.ai.ui.DashboardScreen

class MainActivity : ComponentActivity() {
    private val viewModel: ComicLearnViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                ComicLearnApp(viewModel)
            }
        }
    }
}

@Composable
fun ComicLearnApp(viewModel: ComicLearnViewModel) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "dashboard") {
        composable("dashboard") {
            DashboardScreen(
                onNavigateToComic = { topic, character ->
                    viewModel.generateComic(topic, character)
                    navController.navigate("comic_viewer")
                }
            )
        }
        composable("comic_viewer") {
            ComicViewerScreen(
                viewModel = viewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
