import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class GroceryList(Base, TimestampMixin):
    __tablename__ = "grocery_lists"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    family_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("family_profiles.id", ondelete="CASCADE"), nullable=False
    )
    meal_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("meal_plans.id", ondelete="SET NULL")
    )
    title: Mapped[str | None] = mapped_column(String(100))
    strategy_note: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    items: Mapped[list["GroceryItem"]] = relationship(
        back_populates="grocery_list", cascade="all, delete-orphan", lazy="selectin",
        order_by="GroceryItem.sort_order"
    )


class GroceryItem(Base, TimestampMixin):
    __tablename__ = "grocery_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    grocery_list_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("grocery_lists.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[str | None] = mapped_column(String(50))
    store: Mapped[str | None] = mapped_column(String(100))
    deal_note: Mapped[str | None] = mapped_column(String(200))
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    grocery_list: Mapped[GroceryList] = relationship(back_populates="items")
