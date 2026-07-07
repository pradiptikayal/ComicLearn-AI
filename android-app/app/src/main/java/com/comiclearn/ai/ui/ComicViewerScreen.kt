package com.comiclearn.ai.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.ImageLoader
import coil.compose.AsyncImage
import coil.decode.SvgDecoder
import com.comiclearn.ai.data.ComicBook
import com.comiclearn.ai.data.ComicPanel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ComicViewerScreen(
    viewModel: ComicLearnViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var followUpText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Storybook: ${viewModel.currentTopic}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1F2937)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        viewModel.resetSession()
                        onNavigateBack()
                    }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Go Back"
                        )
                    }
                },
                actions = {
                    TextButton(onClick = {
                        viewModel.resetSession()
                        onNavigateBack()
                    }) {
                        Text(
                            text = "New Chat",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF4F46E5)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White
                )
            )
        },
        bottomBar = {
            Surface(
                tonalElevation = 8.dp,
                modifier = Modifier.imePadding()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = followUpText,
                        onValueChange = { followUpText = it },
                        placeholder = { Text("Ask a follow-up question...") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(24.dp),
                        maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF4F46E5)
                        )
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    IconButton(
                        onClick = {
                            if (followUpText.isNotBlank()) {
                                viewModel.askFollowUp(followUpText)
                                followUpText = ""
                            }
                        },
                        enabled = followUpText.isNotBlank(),
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = Color(0xFF4F46E5),
                            contentColor = Color.White,
                            disabledContainerColor = Color(0xFFE5E7EB),
                            disabledContentColor = Color(0xFF9CA3AF)
                        )
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send Follow-up"
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFFF3F4F6))
        ) {
            when (val state = uiState) {
                is UiState.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = Color(0xFF4F46E5))
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Creating magical panels...", color = Color(0xFF4B5563))
                        }
                    }
                }
                is UiState.Success -> {
                    ComicCanvas(comicBook = state.comicBook)
                }
                is UiState.Error -> {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Error: ${state.message}",
                            color = Color.Red,
                            textAlign = TextAlign.Center
                        )
                    }
                }
                else -> {}
            }
        }
    }
}

@Composable
fun ComicCanvas(comicBook: ComicBook) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        items(comicBook.comic_book_asset) { panel ->
            ComicPanelCard(panel = panel, character = comicBook.character)
        }
        item {
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun ComicPanelCard(panel: ComicPanel, character: String) {
    val context = LocalContext.current
    val imageLoader = remember {
        ImageLoader.Builder(context)
            .components { add(SvgDecoder.Factory()) }
            .build()
    }

    Card(
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = borderStroke(2.dp, Color.Black),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(2.dp)) {
            // Narrative Box (Top)
            if (panel.narrative_box.isNotEmpty()) {
                Surface(
                    color = Color(0xFFFFF9C4), // Light yellow
                    border = borderStroke(1.dp, Color.Black),
                    modifier = Modifier.padding(8.dp)
                ) {
                    Text(
                        text = panel.narrative_box,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }
            }

            // Image Area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .background(Color.White)
            ) {
                if (panel.panel_image.contains("<svg", ignoreCase = true)) {
                    AsyncImage(
                        model = panel.panel_image.toByteArray(Charsets.UTF_8),
                        contentDescription = panel.panel_visual_description_concept,
                        imageLoader = imageLoader,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = androidx.compose.ui.layout.ContentScale.Fit
                    )
                }
                
                // Dialogue Bubble (Overlaid on image)
                if (panel.dialogue_bubble_text.isNotEmpty()) {
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(16.dp),
                        border = borderStroke(1.5.dp, Color.Black),
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(12.dp)
                            .widthIn(max = 180.dp)
                    ) {
                        Text(
                            text = panel.dialogue_bubble_text,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Narrative Footer (Bottom)
            if (panel.narrative_footer.isNotEmpty()) {
                Surface(
                    color = Color(0xFFFFF9C4), // Light yellow
                    border = borderStroke(1.dp, Color.Black),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {
                    Text(
                        text = panel.narrative_footer,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun borderStroke(width: androidx.compose.ui.unit.Dp, color: Color) = 
    androidx.compose.foundation.BorderStroke(width, color)
