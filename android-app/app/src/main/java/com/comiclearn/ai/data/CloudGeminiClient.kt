package com.comiclearn.ai.data

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
}
