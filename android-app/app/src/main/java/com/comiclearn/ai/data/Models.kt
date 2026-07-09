package com.comiclearn.ai.data

import kotlinx.serialization.Serializable

@Serializable
data class ComicCharacter(
    val name: String,
    val characterDescription: String
)

@Serializable
data class ComicBook(
    val topic: String,
    val character: String,
    val comic_book_asset: List<ComicPanel>
)

@Serializable
data class ComicPanel(
    val panel_number: Int,
    val narrative_box: String = "",
    val panel_visual_description_concept: String = "",
    val panel_image: String = "",
    val dialogue_bubble_text: String = "",
    val narrative_footer: String = ""
)
