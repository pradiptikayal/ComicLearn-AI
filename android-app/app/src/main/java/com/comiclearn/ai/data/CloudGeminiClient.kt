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
    private val apiKey = "YOUR API KEY"

    // Set up generative model using Google AI Client SDK
    // Using gemini-3.1-flash-lite as requested
    private val generativeModel = GenerativeModel(
        modelName = "gemini-3.1-flash-lite",
        apiKey = apiKey,
        generationConfig = generationConfig {
            responseMimeType = "application/json"
            maxOutputTokens = 8192 // Increased for high-detail SVG generation
        }
    )

    /**
     * Passes the blueprint prompt to Gemini and parses the response into ComicBook.
     */
    suspend fun generateComic(blueprintPrompt: String): ComicBook? {
        return try {
            val response: GenerateContentResponse = generativeModel.generateContent(blueprintPrompt)
            val jsonText = response.text ?: return null
            val cleanedJson = cleanJson(jsonText)
            val closedJson = ensureClosedJson(cleanedJson)
            parseComicBook(closedJson)
        } catch (e: Exception) {
            android.util.Log.e("CloudGeminiClient", "Generation error: ${e.message}", e)
            null
        }
    }

    private fun ensureClosedJson(json: String): String {
        var openBraces = 0
        var openBrackets = 0
        var inString = false
        var escaped = false

        for (char in json) {
            if (escaped) {
                escaped = false
                continue
            }
            if (char == '\\') {
                escaped = true
                continue
            }
            if (char == '"') {
                inString = !inString
                continue
            }
            if (!inString) {
                when (char) {
                    '{' -> openBraces++
                    '}' -> openBraces--
                    '[' -> openBrackets++
                    ']' -> openBrackets--
                }
            }
        }

        var result = json
        if (inString) result += '"'
        while (openBrackets > 0) {
            result += ']'
            openBrackets--
        }
        while (openBraces > 0) {
            result += '}'
            openBraces--
        }
        return result
    }

    private fun cleanJson(jsonString: String): String {
        return jsonString
            .trim()
            .removePrefix("```json")
            .removePrefix("```")
            .removeSuffix("```")
            .trim()
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
                        narrative_box = assetObj.optString("narrative_box", ""),
                        panel_visual_description_concept = assetObj.optString("panel_visual_description_concept", ""),
                        panel_image = assetObj.optString("panel_image", ""),
                        dialogue_bubble_text = assetObj.optString("dialogue_bubble_text", ""),
                        narrative_footer = assetObj.optString("narrative_footer", "")
                    )
                )
            }
        }
        return ComicBook(topic, character, panelsList)
    }
}
