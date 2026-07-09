package com.comiclearn.ai.ui

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.tooling.preview.Preview
import com.comiclearn.ai.data.ComicCharacter
import java.util.Locale

/**
 * Screen 1: Dashboard
 * Offers topic input field and horizontal scrolling character select row.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToComic: (topic: String, character: ComicCharacter) -> Unit
) {
    var topicText by remember { mutableStateOf("") }
    var selectedCharacter by remember { mutableStateOf<ComicCharacter?>(null) }

    val speechLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult(),
        onResult = { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val data = result.data
                val results = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                if (!results.isNullOrEmpty()) {
                    topicText = results[0]
                }
            }
        }
    )

    val characters = listOf(
        ComicCharacter(
            name = "Iron Man",
            characterDescription = "A high-tech armored superhero in red and gold plating with a glowing circular chest piece (arc reactor)."
        ),
        ComicCharacter(
            name = "Sherlock Holmes",
            characterDescription = "A Victorian detective wearing a brown deerstalker hat and a long tweed coat, holding a magnifying glass."
        ),
        ComicCharacter(
            name = "Batman",
            characterDescription = "A dark-clad caped crusader with a bat-eared cowl, a utility belt, and a large black cape."
        ),
        ComicCharacter(
            name = "Albert Einstein",
            characterDescription = "An elderly scientist with wild white hair, a bushy mustache, and wearing a simple sweater and trousers."
        )
    )

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
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF4F46E5),
                    unfocusedBorderColor = Color(0xFFD1D5DB)
                ),
                trailingIcon = {
                    IconButton(onClick = {
                        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                            putExtra(RecognizerIntent.EXTRA_PROMPT, "What do you want to learn today?")
                        }
                        speechLauncher.launch(intent)
                    }) {
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = "Voice Input",
                            tint = Color(0xFF4F46E5)
                        )
                    }
                }
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
                    val isSelected = selectedCharacter?.name == character.name
                    CharacterCard(
                        name = character.name,
                        isSelected = isSelected,
                        onClick = { selectedCharacter = character }
                    )
                }
            }
        }

        // Action Trigger Button
        Button(
            onClick = {
                val char = selectedCharacter
                if (topicText.isNotBlank() && char != null) {
                    onNavigateToComic(topicText, char)
                }
            },
            enabled = topicText.isNotBlank() && selectedCharacter != null,
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
}

@Preview(showBackground = true)
@Composable
fun DashboardScreenPreview() {
    DashboardScreen(onNavigateToComic = { _, _ -> })
}
