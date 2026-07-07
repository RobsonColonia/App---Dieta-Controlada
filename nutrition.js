export function calculateNutrition(food, grams) {
  const quantity = Number(grams) || 0;
  const factor = quantity / 100;

  return {
    calories: round((Number(food.caloriesPer100g) || 0) * factor),
    protein: round((Number(food.proteinPer100g) || 0) * factor),
    carbs: round((Number(food.carbsPer100g) || 0) * factor),
    fat: round((Number(food.fatPer100g) || 0) * factor)
  };
}

export function round(value) {
  return Math.round(value * 10) / 10;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function getPeriodStart(period) {
  const date = new Date();

  if (period === "last7") {
    date.setDate(date.getDate() - 6);
  }

  if (period === "week") {
    const day = date.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    date.setDate(date.getDate() - daysSinceMonday);
  }

  if (period === "month") {
    date.setDate(1);
  }

  return date.toISOString().slice(0, 10);
}
