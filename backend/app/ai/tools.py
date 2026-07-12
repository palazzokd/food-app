TOOL_DEFINITIONS = [
    {
        "name": "quiz_options",
        "description": (
            "Present the user with tappable option buttons on their mobile device. "
            "Use this when asking structured questions like cuisine preferences, "
            "dietary restrictions, or meal choices. The options will render as "
            "tappable pill-shaped buttons in the chat UI."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "The question to display above the options",
                },
                "options": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "label": {"type": "string"},
                        },
                        "required": ["id", "label"],
                    },
                    "description": "The selectable options (2-6 options)",
                },
                "allow_multiple": {
                    "type": "boolean",
                    "description": "Whether the user can select multiple options",
                    "default": False,
                },
            },
            "required": ["question", "options"],
        },
    },
    {
        "name": "save_family_member",
        "description": (
            "Save a new household member to the family profile. Use this when "
            "you learn about a new person in the household during conversation."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Person's name"},
                "age_months": {
                    "type": "integer",
                    "description": "Age in months (e.g., 36 for 3 years old, 12 for 1 year old)",
                },
                "role": {
                    "type": "string",
                    "enum": ["adult", "toddler", "infant"],
                    "description": "Role in household",
                },
                "nutritional_stage": {
                    "type": "string",
                    "enum": ["adult", "palate_expansion", "allergen_introduction"],
                },
                "dietary_restrictions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of dietary restrictions",
                },
            },
            "required": ["name", "role"],
        },
    },
    {
        "name": "save_preference",
        "description": (
            "Persist a learned preference about the family. Use this when you "
            "discover something about their tastes, cooking habits, or preferences "
            "during conversation."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": [
                        "flavor",
                        "ingredient",
                        "cuisine",
                        "technique",
                        "schedule",
                        "restriction",
                    ],
                    "description": "Category of the preference",
                },
                "key": {
                    "type": "string",
                    "description": "What the preference is about (e.g., 'cilantro', 'spice_level')",
                },
                "value": {
                    "type": "string",
                    "description": "The preference value (e.g., 'dislikes', 'medium', 'loves')",
                },
            },
            "required": ["category", "key", "value"],
        },
    },
    {
        "name": "get_family_profile",
        "description": "Retrieve the current family profile including all household members and preferences.",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]
