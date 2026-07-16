"""PDF rendering for recipe cards and grocery lists (fpdf2)."""

from fpdf import FPDF

from app.models.grocery import GroceryList
from app.models.recipe import Recipe

FOREST = (45, 80, 22)
SAGE = (122, 158, 90)
CHARCOAL = (44, 44, 44)
GRAY = (136, 136, 136)
MIST = (240, 237, 230)


class _BrandedPDF(FPDF):
    def __init__(self, title: str, subtitle: str | None = None):
        super().__init__()
        self._title = title
        self._subtitle = subtitle
        self.set_auto_page_break(auto=True, margin=18)
        self.add_page()

    def header(self):
        self.set_fill_color(*FOREST)
        self.rect(0, 0, self.w, 26, style="F")
        self.set_xy(10, 6)
        self.set_font("helvetica", "B", 16)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, "FamilyPlate", new_x="LMARGIN", new_y="NEXT")
        self.set_x(10)
        self.set_font("helvetica", "", 9)
        self.set_text_color(200, 215, 190)
        self.cell(0, 5, self._subtitle or "AI Meal Planning")
        self.set_y(32)

    def footer(self):
        self.set_y(-12)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")

    def section_title(self, text: str):
        self.set_font("helvetica", "B", 12)
        self.set_text_color(*FOREST)
        self.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*SAGE)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(2)

    def body_text(self, text: str):
        self.set_font("helvetica", "", 10)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)


def _clean(text: str) -> str:
    # helvetica is latin-1 only; drop emoji/unsupported chars
    return text.encode("latin-1", "replace").decode("latin-1")


def render_recipe_pdf(recipe: Recipe) -> bytes:
    pdf = _BrandedPDF(recipe.title, "Recipe Card")

    pdf.set_font("helvetica", "B", 18)
    pdf.set_text_color(*CHARCOAL)
    pdf.multi_cell(0, 9, _clean(recipe.title), new_x="LMARGIN", new_y="NEXT")

    meta_parts = [
        recipe.category.value.title(),
        recipe.cuisine,
        recipe.protein,
        f"{recipe.active_minutes} min active" if recipe.active_minutes else None,
        f"{recipe.total_minutes} min total" if recipe.total_minutes else None,
    ]
    meta = "  ·  ".join(p for p in meta_parts if p)
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(*GRAY)
    pdf.cell(0, 6, _clean(meta), new_x="LMARGIN", new_y="NEXT")

    if recipe.nutrition_tags:
        tags = ", ".join(t.replace("_", " ").title() for t in recipe.nutrition_tags)
        pdf.set_text_color(*SAGE)
        pdf.cell(0, 6, _clean(f"Nutrition targets: {tags}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.section_title("Ingredients")
    for ing in recipe.ingredients or []:
        line = ing.get("item", "")
        if ing.get("quantity"):
            line = f"{ing['quantity']} {line}"
        if ing.get("store_hint"):
            line += f"  ({ing['store_hint']})"
        pdf.body_text(_clean(f"- {line}"))
    pdf.ln(3)

    pdf.section_title("Method")
    for i, step in enumerate(recipe.instructions or [], start=1):
        pdf.body_text(_clean(f"{i}. {step}"))
    pdf.ln(3)

    for label, notes in [
        ("Toddler Adaptation", recipe.toddler_notes),
        ("Infant Finger Foods", recipe.infant_notes),
        ("Night 2 Refresh", recipe.night2_notes),
    ]:
        if notes:
            pdf.section_title(label)
            pdf.body_text(_clean(notes))
            pdf.ln(2)

    if recipe.source_name or recipe.source_url:
        pdf.ln(2)
        pdf.set_font("helvetica", "I", 9)
        pdf.set_text_color(*GRAY)
        attribution = f"Source: {recipe.source_name or ''}"
        if recipe.source_url:
            attribution += f" — {recipe.source_url}"
        pdf.multi_cell(0, 5, _clean(attribution), new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


def render_grocery_pdf(grocery_list: GroceryList) -> bytes:
    pdf = _BrandedPDF(grocery_list.title or "Grocery List", "Grocery List")

    pdf.set_font("helvetica", "B", 18)
    pdf.set_text_color(*CHARCOAL)
    pdf.multi_cell(0, 9, _clean(grocery_list.title or "Grocery List"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    if grocery_list.strategy_note:
        pdf.set_fill_color(*MIST)
        pdf.set_font("helvetica", "I", 10)
        pdf.set_text_color(*CHARCOAL)
        pdf.multi_cell(0, 6, _clean(f"Strategy: {grocery_list.strategy_note}"), fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

    by_store: dict[str, list] = {}
    for item in grocery_list.items:
        by_store.setdefault(item.store or "Other", []).append(item)

    for store, items in by_store.items():
        pdf.section_title(_clean(store))
        for item in items:
            line = item.name
            if item.quantity:
                line = f"{line} — {item.quantity}"
            if item.deal_note:
                line += f"  [{item.deal_note}]"
            box = "[x]" if item.is_checked else "[  ]"
            pdf.body_text(_clean(f"{box}  {line}"))
        pdf.ln(3)

    return bytes(pdf.output())
