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
            "Save a NEW household member to the family profile. Use this only for "
            "people not already in the profile — use update_family_member to change "
            "an existing member (check get_family_profile first)."
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
                    "description": "Dietary restrictions and allergies",
                },
                "flavor_preferences": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Foods and flavors this person loves",
                },
                "texture_preferences": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Texture likes/dislikes (mostly for young children)",
                },
                "allergens_introduced": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Allergens already safely introduced (for infants)",
                },
            },
            "required": ["name", "role"],
        },
    },
    {
        "name": "update_family_member",
        "description": (
            "Update an existing household member's details (age, allergies, "
            "preferences). Get member_id from get_family_profile. Array fields "
            "replace the stored value in full, so include existing items you "
            "want to keep."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "member_id": {"type": "string", "description": "UUID from get_family_profile"},
                "name": {"type": "string"},
                "age_months": {"type": "integer"},
                "role": {
                    "type": "string",
                    "enum": ["adult", "toddler", "infant"],
                },
                "nutritional_stage": {
                    "type": "string",
                    "enum": ["adult", "palate_expansion", "allergen_introduction"],
                },
                "dietary_restrictions": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "flavor_preferences": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "texture_preferences": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "allergens_introduced": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["member_id"],
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
    {
        "name": "save_recipe",
        "description": (
            "Save a recipe to the family's recipe library. Use this whenever you "
            "create or refine a recipe the family wants to keep, and when they ask "
            "you to remember a family favorite. Include toddler/infant adaptations "
            "when the household has young children."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "category": {
                    "type": "string",
                    "enum": ["breakfast", "lunch", "dinner", "snack"],
                },
                "cuisine": {"type": "string", "description": "e.g. Mediterranean, Mexican, Thai"},
                "protein": {"type": "string", "description": "Primary protein, e.g. Chicken, Shrimp, Tofu"},
                "season": {"type": "string", "description": "e.g. Summer, Winter, All"},
                "total_minutes": {"type": "integer"},
                "active_minutes": {
                    "type": "integer",
                    "description": "Active prep/cook time — must respect the family's max prep constraint",
                },
                "nutrition_tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": (
                        "Names of the family's nutrition targets this recipe hits — "
                        "use the exact target names from FAMILY CONTEXT"
                    ),
                },
                "ingredients": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "item": {"type": "string"},
                            "quantity": {"type": "string"},
                            "store_hint": {"type": "string", "description": "Best store to buy this at, if known"},
                        },
                        "required": ["item"],
                    },
                },
                "instructions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Ordered preparation steps",
                },
                "toddler_notes": {"type": "string", "description": "How to adapt for a toddler"},
                "infant_notes": {"type": "string", "description": "Finger-food adaptation for an infant"},
                "night2_notes": {"type": "string", "description": "How to refresh leftovers for night 2"},
                "is_favorite": {"type": "boolean"},
            },
            "required": ["title", "category", "ingredients", "instructions"],
        },
    },
    {
        "name": "get_recipes",
        "description": (
            "Search the family's saved recipe library. Use this before planning meals "
            "so you can reuse favorites, and to answer questions about saved recipes."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["breakfast", "lunch", "dinner", "snack"],
                },
                "favorites_only": {"type": "boolean"},
                "search": {"type": "string", "description": "Match against recipe titles"},
            },
        },
    },
    {
        "name": "save_meal_plan",
        "description": (
            "Save a weekly meal plan. Replaces any existing plan for the same week. "
            "Reference saved recipes by recipe_id where they exist (use get_recipes "
            "to look up IDs). day_of_week: 0=Monday through 6=Sunday."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "week_start_date": {
                    "type": "string",
                    "description": "The Monday of the week, YYYY-MM-DD",
                },
                "title": {"type": "string", "description": "e.g. 'Week of July 13'"},
                "entries": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "day_of_week": {"type": "integer", "minimum": 0, "maximum": 6},
                            "meal_type": {
                                "type": "string",
                                "enum": ["breakfast", "lunch", "dinner", "snack"],
                            },
                            "title": {"type": "string", "description": "Display text, e.g. 'Shrimp Tacos (night 2)'"},
                            "recipe_id": {"type": "string", "description": "UUID of a saved recipe, if one exists"},
                            "notes": {"type": "string"},
                        },
                        "required": ["day_of_week", "meal_type", "title"],
                    },
                },
            },
            "required": ["week_start_date", "entries"],
        },
    },
    {
        "name": "get_meal_plan",
        "description": "Get the current week's meal plan (or a specific week's). Use before modifying a plan or building a grocery list.",
        "input_schema": {
            "type": "object",
            "properties": {
                "week_start_date": {
                    "type": "string",
                    "description": "The Monday of the week, YYYY-MM-DD. Omit for the current week.",
                },
            },
        },
    },
    {
        "name": "save_grocery_list",
        "description": (
            "Save a new grocery list, replacing the currently active one. Group items "
            "by store based on the family's store memberships and flag known deals."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "e.g. 'Week of July 13'"},
                "strategy_note": {
                    "type": "string",
                    "description": "Shopping strategy tip, e.g. which day to hit which store for deals",
                },
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "quantity": {"type": "string"},
                            "store": {"type": "string", "description": "Store to buy at, e.g. 'Whole Foods'"},
                            "deal_note": {"type": "string", "description": "e.g. 'BOGO 50%', '$2 off Tuesday'"},
                        },
                        "required": ["name"],
                    },
                },
            },
            "required": ["items"],
        },
    },
    {
        "name": "get_grocery_list",
        "description": "Get the family's current active grocery list with item IDs. Use before adding, removing, or checking off items.",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "update_grocery_items",
        "description": (
            "Modify the active grocery list: add new items, remove items, or "
            "check/uncheck items. Match existing items by their name as shown in "
            "get_grocery_list."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "add": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "quantity": {"type": "string"},
                            "store": {"type": "string"},
                            "deal_note": {"type": "string"},
                        },
                        "required": ["name"],
                    },
                },
                "remove": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Names of items to remove",
                },
                "check": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Names of items to mark as purchased",
                },
                "uncheck": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Names of items to un-mark",
                },
            },
        },
    },
    {
        "name": "log_nutrition",
        "description": (
            "Record which of the family's nutrition targets were hit on a given "
            "date. Target names must match the family's configured targets (listed "
            "in FAMILY CONTEXT). Use when meals are planned or when the family "
            "reports what they ate."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "date": {"type": "string", "description": "YYYY-MM-DD"},
                "targets_hit": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Exact names of the targets hit on this date",
                },
                "source_note": {
                    "type": "string",
                    "description": "Where the targets came from, e.g. 'Black beans (tacos) · Spinach (lunch)'",
                },
            },
            "required": ["date", "targets_hit"],
        },
    },
    {
        "name": "web_search",
        "description": (
            "Search the web. Use ONLY when the answer needs current or external "
            "information you don't reliably know: seasonal produce questions, "
            "current food safety/allergen guidance, or when the family explicitly "
            "asks you to look something up or find recipes online. Do NOT search "
            "for routine meal planning, recipes you can compose yourself, or "
            "store deals (search can't see store prices)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "count": {
                    "type": "integer",
                    "description": "Number of results (default 5, max 10)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "fetch_page",
        "description": (
            "Fetch and read the text content of a web page — use after web_search "
            "when a result looks promising and you need the full content (e.g. an "
            "actual recipe, not just a snippet)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
            },
            "required": ["url"],
        },
    },
]
