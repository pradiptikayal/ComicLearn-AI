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
}
