package com.comiclearn.ai.ui

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
}
