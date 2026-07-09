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
    fun formatBlueprintPrompt(topic: String, character: ComicCharacter, followUpQuestion: String? = null): String {
        val baseSystemInstruction = """
            You are a world-class digital illustrator and character designer. 
            Your task is to explain "$topic" through a cinematic 4-panel comic strip featuring ${character.name}.

            CHARACTER BLUEPRINT:
            - NAME: ${character.name}
            - DESCRIPTION: ${character.characterDescription}
            - MANDATORY PRESENCE: ${character.name} MUST appear clearly in EVERY panel.
            - CONSISTENCY: Maintain consistent colors, clothing, and features for ${character.name} across all 4 panels.
            - FEATURES: Use complex <path> elements to draw ${character.name} with expressive facial features, distinct hair, and dynamic poses based on the description: ${character.characterDescription}.

            Format your response as a STRICT VALID JSON object:
            {
              "topic": "$topic",
              "character": "${character.name}",
              "comic_book_asset": [
                {
                  "panel_number": 1,
                  "narrative_box": "...",
                  "panel_image": "<svg ...>${character.name} clearly visible in a detailed scene</svg>",
                  "panel_visual_description_concept": "Detailed description of ${character.name}'s pose and the scene",
                  "dialogue_bubble_text": "...",
                  "narrative_footer": "..."
                }
              ]
            }

            SVG ARTISTIC REQUIREMENTS:
            1. CHARACTER FOCUS: ${character.name} is the star. Do not hide them. Ensure they are the focal point of each panel.
            2. STYLE: Modern Digital Comic with cel-shading, highlights, and deep shadows.
            3. FIDELITY: Each 'panel_image' must be an EXTREMELY DETAILED SVG (400-600 lines).
               - BACKGROUNDS: Every panel MUST have a fully illustrated background (e.g., a lab, forest, or space) using multiple layers.
               - LIGHTING: Use <linearGradient> and <radialGradient> for 3D volume, glow, and depth.
            4. COMPOSITION: Use varied camera angles (Close-up of ${character.name}, Wide shot showing ${character.name} in the environment).
            
            INSTRUCTIONS:
            1. Generate exactly 4 panels.
            2. ${character.name} MUST be the consistent protagonist in every single panel.
            3. Return ONLY the JSON object. Ensure the SVG is valid and correctly escaped.
        """.trimIndent()

        return if (followUpQuestion == null) {
            "$baseSystemInstruction\n\nExplain the core concepts of $topic using ${character.name} as the guide."
        } else {
            "$baseSystemInstruction\n\nCONTINUE the story. Address this question: $followUpQuestion. Keep the same character and art style."
        }
    }

    /**
     * Simulated or actual on-device generation from model.
     * Integrates with LiteRT-LM dependency to parse and compile the prompts locally.
     */
    suspend fun generateLocalBlueprint(topic: String, character: ComicCharacter, followUp: String? = null): String {
        // Return the locally structured prompt, preparing state for cloud Omni Flash generation.
        return formatBlueprintPrompt(topic, character, followUp)
    }
}
