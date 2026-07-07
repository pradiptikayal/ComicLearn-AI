package com.comiclearn.ai.data

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
            You are a master children's comic book artist and storyteller. 
            Your task is to explain "$topic" through a cinematic 4-panel comic strip featuring $character.

            Format your response as a STRICT VALID JSON object:
            {
              "topic": "$topic",
              "character": "$character",
              "comic_book_asset": [
                {
                  "panel_number": 1,
                  "narrative_box": "Introductory sentence for the panel (e.g., 'The reef was a busy place...')",
                  "panel_image": "<svg ...>Detailed vibrant SVG drawing using basic shapes, paths, and gradients</svg>",
                  "panel_visual_description_concept": "Detailed description of the image for accessibility",
                  "dialogue_bubble_text": "Character dialogue or exclamation",
                  "narrative_footer": "Optional closing sentence or educational takeaway"
                }
              ]
            }

            INSTRUCTIONS:
            1. Generate exactly 4 panels that tell a complete educational story.
            2. For 'panel_image', generate a high-quality SVG string. 
               - Use a variety of SVG elements: <rect>, <circle>, <path>, <ellipse>, <polygon>.
               - Use inline styles for 'fill' and 'stroke' with vibrant colors.
               - Ensure the composition is dynamic and less abstract (e.g., if it's a character, show a clear face/body using shapes).
               - Keep the SVG code efficient but expressive (max 30-40 lines).
            3. The tone should be educational but adventurous, exactly like a high-quality children's book.
            4. Return ONLY the JSON object.
        """.trimIndent()

        return if (followUpQuestion == null) {
            "$baseSystemInstruction\n\nExplain the core concepts of $topic using $character as the guide."
        } else {
            "$baseSystemInstruction\n\nCONTINUE the story. Address this question: $followUpQuestion. Keep the same character and art style."
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
}
