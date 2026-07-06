package com.comiclearn.ai.ui

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
}
