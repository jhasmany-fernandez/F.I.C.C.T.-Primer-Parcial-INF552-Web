package com.uagrm.smartaccess.model

enum class EntryMethodType {
    FACE,
    CODE_GENERATOR,
    FINGERPRINT
}

data class EntryMethodModel(
    val title: String,
    val subtitle: String,
    val type: EntryMethodType
)
