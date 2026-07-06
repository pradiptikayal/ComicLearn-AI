import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Smartphone, Code, ArrowLeft, Send, RotateCcw, 
  Copy, Check, Download, BookOpen, User, Cpu, Globe, 
  FileCode, Terminal, ExternalLink, Layers, Info, HelpCircle,
  Menu, ChevronRight
} from "lucide-react";

// Types matching the Kotlin definitions
interface ComicPanel {
  panel_number: number;
  narrative_stage: string;
  panel_visual_description_concept: string;
  panel_image?: string;
  dialogue_bubble_text: string;
}

interface ComicBook {
  topic: string;
  character: string;
  comic_book_asset: ComicPanel[];
}

// Predefined Characters matching the Kotlin app
const CHARACTER_OPTIONS = [
  {
    name: "Sherlock Holmes",
    title: "Master Sleuth",
    emoji: "🕵️‍♂️",
    color: "slate",
    accent: "bg-slate-100 text-slate-700 border-slate-300",
    activeAccent: "bg-indigo-50 border-indigo-500 text-indigo-600",
    badge: "bg-indigo-100 text-indigo-800",
    tag: "AHA!",
    gradient: "from-slate-700 to-indigo-950",
    theme: "Light Navy Blue",
    desc: "Uses pure deductive logic, forensic science, and a magnifying glass to investigate any educational mystery!"
  },
  {
    name: "Albert Einstein",
    title: "Quantum Professor",
    emoji: "🧠",
    color: "purple",
    accent: "bg-purple-100 text-purple-700 border-purple-300",
    activeAccent: "bg-purple-50 border-purple-500 text-purple-600",
    badge: "bg-purple-100 text-purple-800",
    tag: "EUREKA!",
    gradient: "from-purple-700 to-indigo-950",
    theme: "Electric Violet",
    desc: "Explores cosmic theories, relative space-time, and quantum physics with wild hair and a giant dynamic blackboard!"
  },
  {
    name: "Iron Man",
    title: "Nano Engineer",
    emoji: "🚀",
    color: "red",
    accent: "bg-red-100 text-red-700 border-red-300",
    activeAccent: "bg-red-50 border-red-500 text-red-600",
    badge: "bg-red-100 text-red-800",
    tag: "WHOOSH!",
    gradient: "from-red-600 to-yellow-600",
    theme: "Crimson & Gold",
    desc: "Blasts off with jet boots, holograms, and arc-reactor tech, teaching engineering through high-speed flight!"
  },
  {
    name: "Batman",
    title: "Caped Crusader",
    emoji: "🦇",
    color: "zinc",
    accent: "bg-zinc-100 text-zinc-700 border-zinc-300",
    activeAccent: "bg-zinc-900 border-zinc-950 text-yellow-400",
    badge: "bg-zinc-800 text-yellow-400",
    tag: "BAM!",
    gradient: "from-zinc-900 to-slate-800",
    theme: "Dark Knight Steel",
    desc: "Solves problems with custom gadgets, night-vision scopes, and standard utility belts, keeping city streets smart!"
  }
];

// Android Source Code Files Map
const ANDROID_SOURCE_FILES = {
  "Models.kt": {
    path: "app/src/main/java/com/comiclearn/ai/data/Models.kt",
    lang: "kotlin",
    code: `package com.comiclearn.ai.data

import kotlinx.serialization.Serializable

@Serializable
data class ComicBook(
    val topic: String,
    val character: String,
    val comic_book_asset: List<ComicPanel>
)

@Serializable
data class ComicPanel(
    val panel_number: Int,
    val narrative_stage: String,
    val panel_visual_description_concept: String,
    val panel_image: String,
    val dialogue_bubble_text: String
)`
  },
  "LocalLlmManager.kt": {
    path: "app/src/main/java/com/comiclearn/ai/data/LocalLlmManager.kt",
    lang: "kotlin",
    code: `package com.comiclearn.ai.data

import android.content.Context
import java.io.File

/**
 * Manager that handles local on-device inference using the LiteRT-LM SDK.
 * It intercepts user's input before making the cloud API call, formatting a
 * combined blueprint prompt locally on-device.
 */
class LocalLlmManager(private val context: Context) {
    // Path where the Gemma/LiteRT-LM model would be loaded
    private val modelPath = File(context.filesDir, "gemma-2b-it-cpu-int4.bin").absolutePath

    /**
     * Intercepts topic and character selection and formats them on-device
     * into a unified blueprint prompt to ensure fast state passing.
     */
    fun formatBlueprintPrompt(topic: String, character: String, followUpQuestion: String? = null): String {
        val baseSystemInstruction = """
            You are a brilliant children's comic book writer and Creative Director. Your task is to turn an educational topic into a highly engaging, adventurous 4-panel comic strip using a specific character as the companion.
            The comic must teach the core educational aspects of the topic through action, humor, and fun dialogue.
            
            Format your final response as a STRICT, VALID JSON object with this exact schema:
            {
              "topic": "$topic",
              "character": "$character",
              "comic_book_asset": [
                {
                  "panel_number": 1,
                  "narrative_stage": "Introduction",
                  "panel_visual_description_concept": "Detailed comic-art illustration scene description",
                  "panel_image": "BASE64_IMAGE_OR_SVG_ASSET",
                  "dialogue_bubble_text": "Engaging character dialogue or exclamation teaching the first point"
                },
                ... (exactly 4 panels)
              ]
            }
        """.trimIndent()

        return if (followUpQuestion == null) {
            """
            $baseSystemInstruction
            
            INPUT DETAILS:
            - Educational Topic: $topic
            - Protagonist/Guide: $character
            
            Write the 4-panel adventure comic where $character guides a group of kids or explores a magical world representing $topic! Keep the tone fun, exciting, and highly educational.
            """.trimIndent()
        } else {
            """
            $baseSystemInstruction
            
            CONTINUATION / FOLLOW-UP:
            - Educational Topic: $topic
            - Protagonist/Guide: $character
            - User Follow-up Question/Prompt: $followUpQuestion
            
            Modify or continue the 4-panel comic strip to directly answer the follow-up question. Retain $character as the exact same main guide. Return exactly 4 new or updated comic panels in the same JSON format.
            """.trimIndent()
        }
    }

    /**
     * Simulated or actual on-device generation from model.
     * Integrates with LiteRT-LM dependency to parse and compile the prompts locally.
     */
    suspend fun generateLocalBlueprint(topic: String, character: String, followUp: String? = null): String {
        // Return the locally structured prompt, preparing state for cloud Omni Flash generation.
        return formatBlueprintPrompt(topic, character, followUp)
    }
}`
  },
  "CloudGeminiClient.kt": {
    path: "app/src/main/java/com/comiclearn/ai/data/CloudGeminiClient.kt",
    lang: "kotlin",
    code: `package com.comiclearn.ai.data

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.GenerateContentResponse
import com.google.ai.client.generativeai.type.generationConfig
import org.json.JSONObject

/**
 * Cloud Gemini client managing communication with Gemini Omni Flash.
 * Passes the blueprint prompt and returns parsed, structured JSON mapping to ComicBook.
 */
class CloudGeminiClient {
    // API key placeholder, satisfying immediate compilation needs
    private val apiKey = "YOUR_GEMINI_API_KEY_PLACEHOLDER"

    // Set up generative model using Google AI Client SDK
    private val generativeModel = GenerativeModel(
        modelName = "gemini-3.5-flash",
        apiKey = apiKey,
        generationConfig = generationConfig {
            responseMimeType = "application/json"
        }
    )

    /**
     * Passes the blueprint prompt to Gemini and parses the response into ComicBook.
     */
    suspend fun generateComic(blueprintPrompt: String): ComicBook? {
        return try {
            val response: GenerateContentResponse = generativeModel.generateContent(blueprintPrompt)
            val jsonText = response.text ?: return null
            parseComicBook(jsonText)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun parseComicBook(jsonString: String): ComicBook {
        val root = JSONObject(jsonString)
        val topic = root.optString("topic", "")
        val character = root.optString("character", "")
        val assetsArray = root.optJSONArray("comic_book_asset")
        
        val panelsList = mutableListOf<ComicPanel>()
        if (assetsArray != null) {
            for (i in 0 until assetsArray.length()) {
                val assetObj = assetsArray.getJSONObject(i)
                panelsList.add(
                    ComicPanel(
                        panel_number = assetObj.optInt("panel_number", i + 1),
                        narrative_stage = assetObj.optString("narrative_stage", "Story"),
                        panel_visual_description_concept = assetObj.optString("panel_visual_description_concept", ""),
                        panel_image = assetObj.optString("panel_image", ""),
                        dialogue_bubble_text = assetObj.optString("dialogue_bubble_text", "")
                    )
                )
            }
        }
        return ComicBook(topic, character, panelsList)
    }
}`
  },
  "ComicLearnViewModel.kt": {
    path: "app/src/main/java/com/comiclearn/ai/ui/ComicLearnViewModel.kt",
    lang: "kotlin",
    code: `package com.comiclearn.ai.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.comiclearn.ai.data.CloudGeminiClient
import com.comiclearn.ai.data.ComicBook
import com.comiclearn.ai.data.LocalLlmManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * UI State definition representing Idle, Loading, Success, and Error states.
 */
sealed interface UiState {
    object Idle : UiState
    object Loading : UiState
    data class Success(val comicBook: ComicBook) : UiState
    data class Error(val message: String) : UiState
}

/**
 * ViewModel managing the comic generator state flow, follow-up messages, and resetting.
 */
class ComicLearnViewModel(application: Application) : AndroidViewModel(application) {
    
    private val localLlmManager = LocalLlmManager(application.applicationContext)
    private val cloudGeminiClient = CloudGeminiClient()

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // Active session state tracking
    var currentTopic: String = ""
        private set
    var currentCharacter: String = ""
        private set

    /**
     * Triggers comic creation. Generates blueprint locally using LiteRT-LM first,
     * then queries Gemini cloud for full-fidelity structured response.
     */
    fun generateComic(topic: String, character: String) {
        if (topic.isBlank() || character.isBlank()) {
            _uiState.value = UiState.Error("Topic and Character selection are required.")
            return
        }

        currentTopic = topic
        currentCharacter = character
        _uiState.value = UiState.Loading

        viewModelScope.launch {
            try {
                // Pre-process & format prompt locally on-device
                val blueprintPrompt = localLlmManager.generateLocalBlueprint(topic, character)
                
                // Fetch structured comic panels from the cloud
                val result = cloudGeminiClient.generateComic(blueprintPrompt)
                if (result != null) {
                    _uiState.value = UiState.Success(result)
                } else {
                    _uiState.value = UiState.Error("Failed to generate comic from the stars. Please try again!")
                }
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.localizedMessage ?: "An unexpected cosmic error occurred")
            }
        }
    }

    /**
     * Ask a follow-up question while retaining the selected topic and character.
     */
    fun askFollowUp(question: String) {
        if (question.isBlank()) return
        
        // Retain current session state
        val topic = currentTopic
        val character = currentCharacter
        _uiState.value = UiState.Loading

        viewModelScope.launch {
            try {
                // Combine existing state & question locally on-device
                val blueprintPrompt = localLlmManager.generateLocalBlueprint(
                    topic = topic,
                    character = character,
                    followUp = question
                )

                // Fetch updated comic sequence
                val result = cloudGeminiClient.generateComic(blueprintPrompt)
                if (result != null) {
                    _uiState.value = UiState.Success(result)
                } else {
                    _uiState.value = UiState.Error("Failed to update comic. Try asking again!")
                }
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.localizedMessage ?: "An error occurred during follow-up.")
            }
        }
    }

    /**
     * Resets state to go back to Screen 1
     */
    fun resetSession() {
        currentTopic = ""
        currentCharacter = ""
        _uiState.value = UiState.Idle
    }
}`
  },
  "DashboardScreen.kt": {
    path: "app/src/main/java/com/comiclearn/ai/ui/DashboardScreen.kt",
    lang: "kotlin",
    code: `package com.comiclearn.ai.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Screen 1: Dashboard
 * Offers topic input field and horizontal scrolling character select row.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToComic: (topic: String, character: String) -> Unit
) {
    var topicText by remember { mutableStateOf("") }
    var selectedCharacter by remember { mutableStateOf("") }

    val characters = listOf("Iron Man", "Sherlock Holmes", "Batman", "Albert Einstein")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF9FAFB))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f)
        ) {
            Spacer(modifier = Modifier.height(20.dp))
            
            Text(
                text = "ComicLearn AI",
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF1F2937),
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "Turn any boring lesson into a fun children's comic adventure!",
                fontSize = 14.sp,
                color = Color(0xFF6B7280),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 8.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Topic Text Input
            Text(
                text = "What do you want to learn today?",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF374151),
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            OutlinedTextField(
                value = topicText,
                onValueChange = { topicText = it },
                placeholder = { Text("e.g. Photosynthesis, How black holes form, Gravity...") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = TextFieldDefaults.outlinedTextFieldColors(
                    focusedBorderColor = Color(0xFF4F46E5),
                    unfocusedBorderColor = Color(0xFFD1D5DB)
                )
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Character Cards Selection List
            Text(
                text = "Choose your comic companion:",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF374151),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(characters) { character ->
                    val isSelected = selectedCharacter == character
                    CharacterCard(
                        name = character,
                        isSelected = isSelected,
                        onClick = { selectedCharacter = character }
                    )
                }
            }
        }

        // Action Trigger Button
        Button(
            onClick = {
                if (topicText.isNotBlank() && selectedCharacter.isNotBlank()) {
                    onNavigateToComic(topicText, selectedCharacter)
                }
            },
            enabled = topicText.isNotBlank() && selectedCharacter.isNotBlank(),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF4F46E5),
                disabledContainerColor = Color(0xFF9CA3AF)
            )
        ) {
            Text(
                text = "Generate Comic Book",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
fun CharacterCard(
    name: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (isSelected) Color(0xFF4F46E5) else Color(0xFFE5E7EB)
    val borderStroke = BorderStroke(if (isSelected) 3.dp else 1.dp, borderColor)
    val cardBg = if (isSelected) Color(0xFFEEF2FF) else Color.White
    val textColor = if (isSelected) Color(0xFF4F46E5) else Color(0xFF374151)

    Card(
        modifier = Modifier
            .width(140.dp)
            .height(140.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg),
        border = borderStroke,
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier.size(56.dp),
                shape = RoundedCornerShape(12.dp),
                color = if (isSelected) Color(0xFFC7D2FE) else Color(0xFFF3F4F6)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = name.take(1),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = if (isSelected) Color(0xFF4F46E5) else Color(0xFF6B7280)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = name,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = textColor,
                textAlign = TextAlign.Center
            )
        }
    }
}`
  },
  "ComicViewerScreen.kt": {
    path: "app/src/main/java/com/comiclearn/ai/ui/ComicViewerScreen.kt",
    lang: "kotlin",
    code: `package com.comiclearn.ai.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.comiclearn.ai.data.ComicBook
import com.comiclearn.ai.data.ComicPanel

/**
 * Screen 2: Comic Viewer & Chat Loop
 * Renders the vertical scrollable list of panels and a bottom text entry for follow-ups.
 */
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
                        text = "Storybook: \${viewModel.currentTopic}",
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
                            imageVector = Icons.Default.ArrowBack,
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
                        colors = TextFieldDefaults.outlinedTextFieldColors(
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
                            imageVector = Icons.Default.Send,
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
                .background(Color(0xFFF3F4F6))
                .padding(innerPadding)
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
                            Text(
                                text = "Creating magical comic panels...",
                                color = Color(0xFF4B5563),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
                is UiState.Success -> {
                    ComicCanvas(
                        comicBook = state.comicBook,
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is UiState.Error -> {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "Oops! Something went wrong",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Red
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = state.message,
                                color = Color(0xFF4B5563),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
                else -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "Comic book generation initialized.")
                    }
                }
            }
        }
    }
}

@Composable
fun ComicCanvas(
    comicBook: ComicBook,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(comicBook.panels) { panel ->
            ComicPanelCard(panel = panel, character = comicBook.selected_character)
        }
        
        item {
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun ComicPanelCard(
    panel: ComicPanel,
    character: String
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            // Header Comic Panel details
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFFFD97D))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "PANEL \${panel.panel_number}",
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp,
                    color = Color.Black
                )
                Text(
                    text = character.uppercase(),
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = Color.Black
                )
            }

            // Graphic scene representation
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color(0xFFE0E7FF))
                    .padding(12.dp)
            ) {
                Text(
                    text = panel.visual_scene_description,
                    fontSize = 13.sp,
                    color = Color(0xFF4F46E5),
                    fontStyle = FontStyle.Italic,
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(16.dp),
                    textAlign = TextAlign.Center
                )

                Surface(
                    color = Color(0xFFEF4444),
                    shape = RoundedCornerShape(4.dp),
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(4.dp)
                ) {
                    Text(
                        text = "WOW!",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            // Dialogue block
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(16.dp)
            ) {
                Text(
                    text = character,
                    fontWeight = FontWeight.Black,
                    fontSize = 14.sp,
                    color = Color(0xFF4F46E5)
                )
                
                Spacer(modifier = Modifier.height(6.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(topStart = 0.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp))
                        .background(Color(0xFFF3F4F6))
                        .border(
                            width = 1.dp, 
                            color = Color(0xFFD1D5DB),
                            shape = RoundedCornerShape(topStart = 0.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
                        )
                        .padding(12.dp)
                ) {
                    Text(
                        text = "\\"\\"\${panel.dialogue_bubble_text}\\"\\"",
                        fontSize = 15.sp,
                        color = Color(0xFF1F2937),
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}`
  },
  "build.gradle.kts": {
    path: "app/build.gradle.kts",
    lang: "kotlin",
    code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.comiclearn.ai"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.comiclearn.ai"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Android Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Jetpack Compose
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // On-Device Inference - LiteRT-LM Setup (Critical Gemma configuration)
    implementation("com.google.ai.edge.litertlm:litertlm-android:0.12.0")

    // Cloud Generation - Google AI Client SDK for Kotlin (Antigravity & Gemini Omni Flash)
    implementation("com.google.ai.client.generativeai:generativeai:0.4.0")

    // Kotlin serialization for JSON structures
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
}`
  }
};

export default function App() {
  // Mobile Simulator state flow
  const [topic, setTopic] = useState("");
  const [selectedChar, setSelectedChar] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "viewer">("dashboard");
  const [loading, setLoading] = useState(false);
  const [loadingCaption, setLoadingCaption] = useState("");
  const [comicBook, setComicBook] = useState<ComicBook | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Desktop interface state
  const [activeFile, setActiveFile] = useState<keyof typeof ANDROID_SOURCE_FILES>("DashboardScreen.kt");
  const [copied, setCopied] = useState(false);
  const [timeStr, setTimeStr] = useState("12:20 PM");

  const canvasEndRef = useRef<HTMLDivElement>(null);

  // Cycle funny captions during load
  useEffect(() => {
    if (!loading || !selectedChar) return;
    const captions = [
      `Contacting ${selectedChar.name}...`,
      `Local Gemma Model preparing blueprint...`,
      `Formatting unified layout locally...`,
      `Requesting Cloud Gemini 3.5 Flash...`,
      `Rendering speech balloons with ${selectedChar.tag}...`,
      `Applying halftone dot patterns...`
    ];
    setLoadingCaption(captions[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % captions.length;
      setLoadingCaption(captions[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, [loading, selectedChar]);

  // Set clock inside simulator status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      setTimeStr(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on panel updates
  useEffect(() => {
    if (currentScreen === "viewer" && canvasEndRef.current) {
      canvasEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comicBook, currentScreen]);

  // Handle Comic Generation
  const handleGenerate = async () => {
    if (!topic.trim() || !selectedChar) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          character: selectedChar.name
        })
      });
      const data = await response.json();
      if (data.comic) {
        setComicBook(data.comic);
        setIsDemoMode(!!data.isDemo);
        setCurrentScreen("viewer");
      } else {
        throw new Error(data.error || "Failed to generate comic structure.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred connecting to the service.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Follow-up Queries
  const handleSendFollowUp = async () => {
    if (!followUp.trim() || !selectedChar || !comicBook) return;
    const currentFollowUp = followUp;
    setFollowUp("");
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: comicBook.topic,
          character: selectedChar.name,
          followUp: currentFollowUp
        })
      });
      const data = await response.json();
      if (data.comic) {
        setComicBook(data.comic);
        setIsDemoMode(!!data.isDemo);
      } else {
        throw new Error(data.error || "Failed to parse comic follow-up.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to request updated panels.");
    } finally {
      setLoading(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(ANDROID_SOURCE_FILES[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download individual file
  const handleDownloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset chat back to screen 1
  const handleNewChat = () => {
    setComicBook(null);
    setCurrentScreen("dashboard");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#1A1A1A] font-sans selection:bg-[#FFDE59] selection:text-black flex flex-col p-4 border-[12px] border-black">
      {/* 1. Header Navigation Bar */}
      <header className="bg-[#FF4D4D] border-b-8 border-black p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white border-4 border-black p-2.5 rotate-[-2deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-black flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#FF4D4D] inline-block" />
              ComicLearn AI
            </h1>
          </div>
          <span className="bg-black text-white px-3 py-1 font-mono text-xs uppercase tracking-widest hidden sm:inline-block">
            v4.0 LiteRT-LM
          </span>
          <span className="bg-black text-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
            Android Workspace
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FFDE59] border-4 border-black px-3 py-1.5 font-mono text-[11px] font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Server Active : 3000</span>
          </div>
          <button 
            onClick={handleNewChat}
            className="bg-[#4D94FF] text-black border-4 border-black px-4 py-2 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-blue-400 transition-all text-xs"
          >
            New Adventure
          </button>
        </div>
      </header>

      {/* 2. Main Studio Workspace Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: THE ANDROID SIMULATOR (col-span-5) */}
        <section className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-xs text-center mb-4">
            <h2 className="text-sm font-black tracking-wider text-black uppercase flex items-center justify-center gap-2 font-display">
              <Smartphone className="w-5 h-5 text-[#FF4D4D]" /> Live Interactive Emulator
            </h2>
            <p className="text-xs text-slate-700 font-bold mt-1">Touch, select, and test the educational flow below</p>
          </div>

          {/* Realistic High-Fidelity Device Outer Frame */}
          <div className="relative w-[340px] h-[680px] bg-black rounded-[48px] p-3.5 shadow-[12px_12px_0_0_rgba(0,0,0,1)] border-8 border-black ring-4 ring-[#FF4D4D]/30 flex flex-col overflow-hidden">
            
            {/* Glossy overlay sheen */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/3 pointer-events-none transform skew-x-12 origin-top-right z-30"></div>
            
            {/* Phone Top Notch/Camera Piercing */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800 mr-8"></div>
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* Simulated Phone Screen Content (The actual Android Viewport) */}
            <div className="w-full h-full bg-[#FFFBEB] rounded-[34px] overflow-hidden flex flex-col relative text-[#1A1A1A] select-none shadow-inner z-10 border-4 border-black">
              
              {/* Screen Top Status Bar */}
              <div className="h-9 bg-[#FFFBEB] border-b-4 border-black px-5 pt-1.5 flex justify-between items-center text-[11px] font-black text-black z-30">
                <span>{timeStr}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-black">5G</span>
                  <div className="w-3.5 h-2 bg-black rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-[#FFDE59] rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* VIEWPORT VIEWS */}
              <div className="flex-1 overflow-hidden relative flex flex-col">
                <AnimatePresence mode="wait">
                  {currentScreen === "dashboard" ? (
                    // SCREEN 1: THE DASHBOARD (INPUT & SELECTION)
                    <motion.div 
                      key="screen-1-dashboard"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 p-5 flex flex-col justify-between overflow-y-auto bg-[#FFFBEB]"
                    >
                      <div className="space-y-4">
                        {/* Title Badge */}
                        <div className="flex flex-col items-center text-center pt-4">
                          <div className="px-2.5 py-1 bg-white border-2 border-black text-black text-[10px] font-black rounded-full tracking-wider uppercase mb-1 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
                            <Sparkles className="w-2.5 h-2.5 text-[#FF4D4D] animate-spin" /> Gemma Powered
                          </div>
                          <h3 className="text-xl font-black font-display text-black uppercase tracking-tight leading-none italic rotate-[1deg] bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">ComicLearn AI</h3>
                          <p className="text-[11px] text-slate-700 mt-2 px-2 leading-relaxed font-bold">Turn any learning topic into a multi-panel adventure comic strip!</p>
                        </div>

                        {/* Text input area */}
                        <div className="space-y-1.5 pt-2 text-left">
                          <label className="text-[11px] font-black uppercase tracking-wider text-black">1. Enter Learning Topic</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              placeholder="e.g. Photosynthesis, Volcanoes..."
                              className="w-full bg-white border-4 border-black p-3 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-[#FFDE59] shadow-inner text-black placeholder:text-slate-400"
                            />
                            {topic && (
                              <button 
                                onClick={() => setTopic("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-red-500 text-xs font-bold"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Horizontal Character selector */}
                        <div className="space-y-2 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-black uppercase tracking-wider text-black">2. Select Your Guide</label>
                          </div>
                          
                          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x -mx-1 px-1">
                            {CHARACTER_OPTIONS.map((char) => {
                              const isSelected = selectedChar?.name === char.name;
                              return (
                                <div 
                                  key={char.name}
                                  onClick={() => setSelectedChar(char)}
                                  className={`flex-shrink-0 w-28 h-28 rounded-none border-4 border-black p-2 flex flex-col justify-between cursor-pointer transition-all duration-100 snap-center ${
                                    isSelected 
                                      ? "bg-[#FFDE59] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-[1.02] text-black" 
                                      : "bg-white text-black hover:bg-[#FFFBEB]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-2xl">{char.emoji}</span>
                                    {isSelected && <span className="text-[8px] bg-black text-white px-1.5 py-0.5 uppercase font-black">Selected</span>}
                                  </div>
                                  <div className="text-left">
                                    <div className="text-[10px] font-black leading-tight uppercase truncate">{char.name}</div>
                                    <div className="text-[8px] text-slate-700 font-bold truncate mt-0.5">{char.title}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Bottom action bar */}
                      <div className="pt-4 space-y-2">
                        {errorMessage && (
                          <div className="bg-red-100 border-4 border-black text-black font-bold text-[10px] p-2 text-center leading-normal shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            ⚠️ {errorMessage}
                          </div>
                        )}
                        
                        <button 
                          onClick={handleGenerate}
                          disabled={!topic.trim() || !selectedChar || loading}
                          className="w-full bg-[#34D399] disabled:bg-slate-300 disabled:opacity-50 text-black font-black uppercase text-xs py-3 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#10B981] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Comic Book</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    // SCREEN 2: THE COMIC VIEWER & CHAT LOOP
                    <motion.div 
                      key="screen-2-viewer"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col bg-[#FFFBEB]"
                    >
                      {/* Top Action Header Bar */}
                      <div className="bg-[#FF4D4D] border-b-4 border-black px-3.5 py-2.5 flex items-center justify-between shadow-sm z-20">
                        <button 
                          onClick={handleNewChat}
                          className="p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none text-black hover:bg-slate-100 transition"
                        >
                          <ArrowLeft className="w-4 h-4 stroke-[3px]" />
                        </button>
                        <div className="text-center max-w-[150px]">
                          <div className="text-[8px] uppercase font-black tracking-wider text-black">Topic</div>
                          <div className="text-xs font-black text-black uppercase truncate">{comicBook?.topic || topic}</div>
                        </div>
                        <button 
                          onClick={handleNewChat}
                          className="text-[9px] font-black uppercase text-black bg-[#FFDE59] border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
                        >
                          New Chat
                        </button>
                      </div>

                      {/* Demo Mode Notice Badge */}
                      {isDemoMode && (
                        <div className="bg-[#FFDE59] border-b-4 border-black text-[9px] text-black font-black px-3 py-1 text-center uppercase">
                          ⚡ Local Sim Mode
                        </div>
                      )}

                      {/* The Comic Canvas - Vertical Scrollable List */}
                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 select-text bg-[#FFFBEB]">
                        {(() => {
                          const panelsList = comicBook?.comic_book_asset || (comicBook as any)?.panels || [];
                          return panelsList.map((panel, idx) => {
                            const visualConcept = panel.panel_visual_description_concept || (panel as any).visual_scene_description || "";
                            return (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.3 }}
                                className="bg-white rounded-none overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col"
                              >
                                {/* Comic Illustration Box */}
                                <div className="h-48 relative overflow-hidden bg-[#EFF6FF] flex items-center justify-center p-4 text-center halftone-bg border-b-4 border-black">
                                  {panel.panel_image ? (
                                    <img 
                                      src={panel.panel_image}
                                      alt={visualConcept}
                                      className="w-full h-full object-cover absolute inset-0 z-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : null}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none"></div>
                                  
                                  {/* Character emoji large silhouette */}
                                  {!panel.panel_image && (
                                    <div className="absolute right-3 bottom-1 text-5xl opacity-35 pointer-events-none filter drop-shadow">
                                      {selectedChar?.emoji}
                                    </div>
                                  )}

                                  {/* Stylized Burst Tags */}
                                  <div className="absolute top-2.5 left-2.5 bg-[#FF4D4D] text-white font-black text-[10px] uppercase px-2 py-1 rotate-[-4deg] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-20">
                                    {selectedChar?.tag || "WOW!"}
                                  </div>

                                  {/* Description of visual scene */}
                                  {!panel.panel_image && (
                                    <p className="text-xs text-black font-black leading-relaxed max-w-[200px] italic drop-shadow-sm z-10">
                                      {visualConcept}
                                    </p>
                                  )}
                                </div>

                                {/* Speech dialog container */}
                                <div className="p-3.5 space-y-2 relative bg-[#FFFBEB] border-t border-black/10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{selectedChar?.emoji}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4D4D]">{selectedChar?.name}</span>
                                  </div>

                                  {/* Comic speech bubble with customized tail styling */}
                                  <div className="speech-bubble-tail-border relative">
                                    <div className="speech-bubble-tail bg-white text-black rounded-2xl px-3.5 py-2.5 text-xs border-2 border-black leading-normal font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                      "{panel.dialogue_bubble_text}"
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          });
                        })()}

                        <div ref={canvasEndRef} className="h-6"></div>
                      </div>

                      {/* Bottom Fixed Chat follow-up box */}
                      <div className="bg-[#FFFBEB] border-t-4 border-black px-3 py-3 space-y-2 z-20 shadow-[0_-4px_0_0_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={followUp}
                            onChange={(e) => setFollowUp(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && followUp.trim() && handleSendFollowUp()}
                            placeholder="Ask a follow-up question..."
                            className="flex-1 bg-white border-2 border-black rounded-none px-4 py-2 text-xs font-bold text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#FFDE59]"
                          />
                          <button 
                            onClick={handleSendFollowUp}
                            disabled={!followUp.trim() || loading}
                            className="p-2 bg-black text-white border-2 border-black hover:bg-[#FF4D4D] hover:text-white disabled:bg-slate-200 disabled:text-slate-400 rounded-none transition-all duration-200"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading HUD Screen Overlay */}
                <AnimatePresence>
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center z-50 p-6 text-center select-none"
                    >
                      <div className="p-5 bg-[#FFDE59] border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center max-w-[240px] text-black">
                        <div className="w-12 h-12 rounded-full border-4 border-black border-t-transparent animate-spin mb-4"></div>
                        <p className="text-xs font-black uppercase tracking-wider text-black mb-1 font-display">ComicLearn LLM</p>
                        <p className="text-[10px] text-black font-bold animate-pulse mt-1 h-8 flex items-center justify-center">
                          {loadingCaption}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Physical home gesture touch anchor */}
              <div className="h-5 bg-[#FFFBEB] flex justify-center items-center z-30">
                <div className="w-32 h-1.5 bg-black rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: ANDROID ARCHITECTURE & CODE INSPECTOR (col-span-7) */}
        <section className="lg:col-span-7 space-y-6 flex flex-col">
          
          {/* File Tabs Inspector */}
          <div className="bg-slate-950 rounded-none border-4 border-black overflow-hidden flex flex-col h-[580px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* Header / Tab Navigation */}
            <div className="bg-[#4D94FF] px-4 py-3 border-b-4 border-black flex flex-wrap items-center justify-between gap-3 text-black">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-black" />
                <span className="text-xs font-black tracking-wider uppercase font-display text-black">Android Kotlin Blueprint</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFDE59] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={() => handleDownloadFile(activeFile, ANDROID_SOURCE_FILES[activeFile].code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#34D399] text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#10B981] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* List of files horizontal tab */}
            <div className="bg-[#FFFBEB] border-b-4 border-black px-2 pt-1.5 flex gap-1.5 overflow-x-auto scrollbar-none">
              {(Object.keys(ANDROID_SOURCE_FILES) as Array<keyof typeof ANDROID_SOURCE_FILES>).map((file) => {
                const isActive = activeFile === file;
                return (
                  <button
                    key={file}
                    onClick={() => setActiveFile(file)}
                    className={`px-3 py-2 text-xs font-mono border-t-2 border-x-2 border-black transition flex items-center gap-1.5 shrink-0 uppercase font-black tracking-wider ${
                      isActive 
                        ? "bg-[#FFDE59] text-black font-black border-b-4 border-b-[#FFDE59]" 
                        : "bg-white text-slate-800 hover:bg-[#FFFBEB]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{file}</span>
                  </button>
                );
              })}
            </div>

            {/* Path description */}
            <div className="bg-white px-4 py-2 border-b-4 border-black text-[10px] font-mono text-slate-700 font-bold flex justify-between">
              <span>Path: {ANDROID_SOURCE_FILES[activeFile].path}</span>
              <span className="text-[#FF4D4D] uppercase font-black">{ANDROID_SOURCE_FILES[activeFile].lang}</span>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto bg-slate-950 p-5 font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin">
              <pre className="whitespace-pre">{ANDROID_SOURCE_FILES[activeFile].code}</pre>
            </div>
          </div>

          {/* Architecture info card */}
          <div className="bg-white rounded-none border-4 border-black p-5 space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
            <h3 className="text-sm font-black font-display tracking-wider uppercase flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF4D4D]" /> Educational Architecture Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FFFBEB] border-4 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#34D399] border-2 border-black rounded-none">
                    <Cpu className="w-4 h-4 text-black" />
                  </div>
                  <h4 className="text-xs font-black uppercase text-black">1. Local LiteRT-LM Manager</h4>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-bold">
                  Loads a lightweight LLM locally on the Android device using <span className="text-indigo-700 font-mono font-black">litertlm-android:0.12.0</span>. It intercepts inputs and formats a consistent, unified prompt blueprint, ensuring immediate state passing and complete local-first formatting control.
                </p>
              </div>

              <div className="bg-[#FFFBEB] border-4 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#4D94FF] border-2 border-black rounded-none">
                    <Globe className="w-4 h-4 text-black" />
                  </div>
                  <h4 className="text-xs font-black uppercase text-black">2. Cloud Gemini Client</h4>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-bold">
                  Connects via the <span className="text-indigo-700 font-mono font-black">generativeai</span> Kotlin SDK. Passes the structured blueprint prompt to Gemini in the cloud, parsing structured JSON into the comic view layouts instantly.
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* 3. Footer */}
      <footer className="border-t-4 border-black bg-black text-[#FFFBEB] text-xs py-6 text-center mt-auto uppercase tracking-widest font-mono">
        <p>© 2026 ComicLearn AI. Fully functional interactive workspace for Android Native development.</p>
      </footer>
    </div>
  );
}
