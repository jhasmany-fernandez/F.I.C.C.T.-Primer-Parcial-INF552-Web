package com.uagrm.smartaccess.model

import androidx.compose.ui.graphics.Color

data class ProblemTypeModel(
    val label: String,
    val category: String
)

enum class ReportPriorityModel(val label: String, val color: Color) {
    HIGH("Alta", Color(0xFFD71920)),
    MEDIUM("Media", Color(0xFFF4B400)),
    LOW("Baja", Color(0xFF34A853))
}

data class ReportFormState(
    val selectedProblem: String,
    val selectedState: String,
    val description: String = ""
)
