import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { activities as activityPresets } from "./activities";
import { foods as starterFoods } from "./foods";
import { calculateNutrition, getPeriodStart, round, todayISO } from "./nutrition";

const STORAGE_KEY = "@dieta-controlada:v1";

function formatSigned(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${number}` : `${number}`;
}

function normalizeText(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sortByName(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

const legacyStarterFoods = [
  {
    id: "arroz",
    name: "Arroz branco cozido",
    category: "Carboidrato",
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3
  },
  {
    id: "frango",
    name: "Peito de frango grelhado",
    category: "Proteína",
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6
  },
  {
    id: "feijao",
    name: "Feijão cozido",
    category: "Carboidrato",
    caloriesPer100g: 76,
    proteinPer100g: 4.8,
    carbsPer100g: 13.6,
    fatPer100g: 0.5
  }
];

const legacyActivityPresets = [
  {
    id: "caminhada",
    name: "Caminhada",
    caloriesPerHour: 240
  },
  {
    id: "trabalho-sentado",
    name: "Trabalho sentado",
    caloriesPerHour: 90
  },
  {
    id: "academia",
    name: "Academia",
    caloriesPerHour: 420
  },
  {
    id: "sono",
    name: "Sono",
    caloriesPerHour: 60
  },
  {
    id: "trabalho-em-pe",
    name: "Trabalho em pé",
    caloriesPerHour: 140
  }
];

const initialState = {
  foods: starterFoods,
  meals: [],
  expenses: []
};

export default function App() {
  const [state, setState] = useState(initialState);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState("day");
  const [foodMode, setFoodMode] = useState("popular");
  const [foodSearch, setFoodSearch] = useState("");
  const [mealForm, setMealForm] = useState({
    date: todayISO(),
    foodId: starterFoods[0].id,
    grams: ""
  });
  const [expenseForm, setExpenseForm] = useState({
    date: todayISO(),
    activityId: activityPresets[0].id,
    time: "",
    unit: "minutes"
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  async function loadData() {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setState({
        ...parsed,
        foods: starterFoods
      });
    }
  }

  const totals = useMemo(() => {
    const startDate = period === "all" ? "" : period === "day" ? todayISO() : getPeriodStart(period);
    const meals = state.meals.filter((meal) => period === "all" || meal.date >= startDate);
    const expenses = state.expenses.filter((item) => period === "all" || item.date >= startDate);

    return meals.reduce(
      (acc, meal) => ({
        calories: round(acc.calories + meal.calories),
        protein: round(acc.protein + meal.protein),
        carbs: round(acc.carbs + meal.carbs),
        fat: round(acc.fat + meal.fat),
        spent: acc.spent
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        spent: round(expenses.reduce((sum, item) => sum + Number(item.calories), 0))
      }
    );
  }, [period, state]);

  const balanceSeries = useMemo(() => {
    const dateMap = {};

    state.meals.forEach((meal) => {
      dateMap[meal.date] = dateMap[meal.date] || { consumed: 0, spent: 0 };
      dateMap[meal.date].consumed += Number(meal.calories) || 0;
    });

    state.expenses.forEach((expense) => {
      dateMap[expense.date] = dateMap[expense.date] || { consumed: 0, spent: 0 };
      dateMap[expense.date].spent += Number(expense.calories) || 0;
    });

    const allDates = Object.keys(dateMap).sort();
    const periodStart = period === "all" ? "" : period === "day" ? todayISO() : getPeriodStart(period);
    const dates = period === "all" ? allDates : allDates.filter((date) => date >= periodStart);
    let runningBalance = 0;

    const realData = dates.map((date) => {
      const dailyBalance = round(dateMap[date].consumed - dateMap[date].spent);
      runningBalance = round(runningBalance + dailyBalance);
      return {
        date: date.slice(5),
        dailyBalance,
        cumulativeBalance: runningBalance
      };
    });

    if (realData.length > 0) {
      return realData;
    }

    return [];
  }, [period, state]);

  const balance = round(totals.calories - totals.spent);
  const balanceStatus =
    balance > 0 ? "Superávit calórico" : balance < 0 ? "Déficit calórico" : "Manutenção calórica";
  const periodLabel = {
    day: "hoje",
    week: "semana",
    last7: "últimos 7 dias",
    month: "mês",
    all: "sempre"
  }[period];
  const periodStart = period === "all" ? "" : period === "day" ? todayISO() : getPeriodStart(period);
  const periodMeals = state.meals.filter((meal) => period === "all" || meal.date >= periodStart);
  const periodExpenses = state.expenses.filter((expense) => period === "all" || expense.date >= periodStart);
  const selectedDateMeals = state.meals.filter((meal) => meal.date === mealForm.date);
  const selectedDateExpenses = state.expenses.filter((expense) => expense.date === expenseForm.date);
  const selectedDateMealTotals = selectedDateMeals.reduce(
    (acc, meal) => ({
      calories: round(acc.calories + (Number(meal.calories) || 0)),
      protein: round(acc.protein + (Number(meal.protein) || 0)),
      carbs: round(acc.carbs + (Number(meal.carbs) || 0))
    }),
    { calories: 0, protein: 0, carbs: 0 }
  );
  const selectedDateExpenseTotal = round(
    selectedDateExpenses.reduce((sum, expense) => sum + (Number(expense.calories) || 0), 0)
  );
  const visibleFoods = useMemo(() => {
    if (foodMode === "popular") {
      const usage = state.meals.reduce((acc, meal) => {
        if (meal.foodId) acc[meal.foodId] = (acc[meal.foodId] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(usage)
        .map(([foodId, count]) => {
          const food = state.foods.find((item) => item.id === foodId);
          return food ? { ...food, usageCount: count } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name, "pt-BR"))
        .slice(0, 80);
    }

    const search = normalizeText(foodSearch.trim());
    const foods = search
      ? state.foods.filter((food) => normalizeText(food.name).includes(search))
      : state.foods;

    return sortByName(foods).slice(0, search ? 120 : 80);
  }, [foodMode, foodSearch, state.foods]);
  const consumptionByFood = Object.values(
    periodMeals.reduce((acc, meal) => {
      const food = state.foods.find((item) => item.id === meal.foodId);
      const name = food?.name || meal.foodName || "Alimento";

      acc[name] = acc[name] || {
        name,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        grams: 0
      };
      acc[name].calories = round(acc[name].calories + meal.calories);
      acc[name].protein = round(acc[name].protein + meal.protein);
      acc[name].carbs = round(acc[name].carbs + meal.carbs);
      acc[name].fat = round(acc[name].fat + meal.fat);
      acc[name].grams = round(acc[name].grams + meal.grams);

      return acc;
    }, {})
  );
  const expensesByActivity = Object.values(
    periodExpenses.reduce((acc, expense) => {
      const activity = activityPresets.find((item) => item.id === expense.activityId);
      const name = activity?.name || expense.description || "Atividade";

      acc[name] = acc[name] || {
        name,
        minutes: 0,
        calories: 0
      };
      acc[name].minutes = round(acc[name].minutes + (Number(expense.minutes) || 0));
      acc[name].calories = round(acc[name].calories + (Number(expense.calories) || 0));

      return acc;
    }, {})
  );

  function addMeal() {
    const food = state.foods.find((item) => item.id === mealForm.foodId);

    if (!food || !mealForm.grams) {
      Alert.alert("Faltou algo", "Escolha um alimento e informe a quantidade.");
      return;
    }

    const nutrition = calculateNutrition(food, mealForm.grams);
    const newMeal = {
      id: `${Date.now()}`,
      date: mealForm.date,
      foodId: food.id,
      foodName: food.name,
      grams: Number(mealForm.grams),
      ...nutrition
    };

    setState((current) => ({ ...current, meals: [newMeal, ...current.meals] }));
    setMealForm((current) => ({ ...current, grams: "" }));
  }

  function addExpense() {
    const activity = activityPresets.find((item) => item.id === expenseForm.activityId);

    if (!activity || !expenseForm.time) {
      Alert.alert("Faltou algo", "Escolha uma atividade e informe o tempo.");
      return;
    }

    const minutes = expenseForm.unit === "hours" ? Number(expenseForm.time) * 60 : Number(expenseForm.time);
    const calories = round((minutes / 60) * activity.caloriesPerHour);
    const newExpense = {
      id: `${Date.now()}`,
      date: expenseForm.date,
      activityId: activity.id,
      description: activity.name,
      minutes,
      calories
    };

    setState((current) => ({ ...current, expenses: [newExpense, ...current.expenses] }));
    setExpenseForm((current) => ({ ...current, time: "" }));
  }

  function deleteMeal(id) {
    Alert.alert("Excluir consumo", "Tem certeza que quer excluir este consumo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          setState((current) => ({
            ...current,
            meals: current.meals.filter((meal) => meal.id !== id)
          }))
      }
    ]);
  }

  function deleteExpense(id) {
    Alert.alert("Excluir gasto", "Tem certeza que quer excluir este gasto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          setState((current) => ({
            ...current,
            expenses: current.expenses.filter((expense) => expense.id !== id)
          }))
      }
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>Dieta Controlada</Text>
        </View>

        <View style={styles.tabs}>
          <Tab label="Resumo" active={activeTab === "dashboard"} onPress={() => setActiveTab("dashboard")} />
          <Tab label="Consumo" active={activeTab === "meal"} onPress={() => setActiveTab("meal")} />
          <Tab label="Gasto" active={activeTab === "expense"} onPress={() => setActiveTab("expense")} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === "dashboard" && (
            <>
              <View style={styles.cardHero}>
                <Text style={styles.cardTitle}>Saldo de {periodLabel}</Text>
                <View style={styles.heroPeriods}>
                  <PeriodButton label="Hoje" active={period === "day"} onPress={() => setPeriod("day")} />
                  <PeriodButton label="Semana" active={period === "week"} onPress={() => setPeriod("week")} />
                  <PeriodButton label="Últ. 7 dias" active={period === "last7"} onPress={() => setPeriod("last7")} />
                  <PeriodButton label="Mês" active={period === "month"} onPress={() => setPeriod("month")} />
                  <PeriodButton label="Sempre" active={period === "all"} onPress={() => setPeriod("all")} />
                </View>
                <Text style={[styles.balance, balance > 0 ? styles.balancePositive : styles.balanceNegative]}>
                  {formatSigned(balance)} kcal
                </Text>
                <Text style={styles.muted}>{balanceStatus}</Text>
              </View>

              <Section title="Evolução do saldo acumulado">
                {balanceSeries.length === 0 ? (
                  <Text style={styles.muted}>Registre consumo e gasto para gerar o gráfico.</Text>
                ) : (
                  <>
                    <BalanceEvolutionChart data={balanceSeries} />
                    <Text style={styles.muted}>
                      Colunas mostram o saldo do dia. A linha mostra o saldo acumulado.
                    </Text>
                  </>
                )}
              </Section>

              <View style={styles.grid}>
                <Metric title="Consumido" value={`${totals.calories} kcal`} />
                <Metric title="Gasto" value={`${totals.spent} kcal`} />
                <Metric title="Proteínas" value={`${totals.protein} g`} />
                <Metric title="Carboidratos" value={`${totals.carbs} g`} />
              </View>

              <Section title={`Consumo de ${periodLabel}`}>
                {consumptionByFood.length === 0 ? (
                  <Text style={styles.muted}>Nenhum consumo registrado neste período.</Text>
                ) : (
                  consumptionByFood.map((item) => <ConsumptionFoodItem key={item.name} item={item} />)
                )}
              </Section>

              <Section title={`Gastos de ${periodLabel}`}>
                {expensesByActivity.length === 0 ? (
                  <Text style={styles.muted}>Nenhuma atividade registrada neste período.</Text>
                ) : (
                  expensesByActivity.map((expense) => <ExpenseActivitySummary key={expense.name} expense={expense} />)
                )}
              </Section>
            </>
          )}

          {activeTab === "meal" && (
            <Section title="Registrar consumo">
              <Input label="Data" value={mealForm.date} onChangeText={(date) => setMealForm({ ...mealForm, date })} />
              <Text style={styles.label}>Item consumido</Text>
              <View style={styles.selectorTabs}>
                <TouchableOpacity
                  style={[styles.selectorTab, foodMode === "popular" && styles.selectorTabActive]}
                  onPress={() => setFoodMode("popular")}
                >
                  <Text style={[styles.selectorTabText, foodMode === "popular" && styles.selectorTabTextActive]}>
                    Mais usados
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorTab, foodMode === "all" && styles.selectorTabActive]}
                  onPress={() => setFoodMode("all")}
                >
                  <Text style={[styles.selectorTabText, foodMode === "all" && styles.selectorTabTextActive]}>
                    Todos itens
                  </Text>
                </TouchableOpacity>
              </View>
              {foodMode === "all" && (
                <Input
                  label="Buscar alimento"
                  value={foodSearch}
                  onChangeText={setFoodSearch}
                  placeholder="Ex: arroz, frango, banana..."
                />
              )}
              <ScrollView style={styles.foodListScroll} nestedScrollEnabled>
                <View style={styles.foodList}>
                  {visibleFoods.length === 0 ? (
                    <Text style={styles.muted}>
                      {foodMode === "popular"
                        ? "Nenhum item usado ainda. Entre em Todos itens para lançar o primeiro consumo."
                        : "Nenhum alimento encontrado nessa busca."}
                    </Text>
                  ) : visibleFoods.map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      style={[styles.foodPill, mealForm.foodId === food.id && styles.foodPillActive]}
                      onPress={() => setMealForm({ ...mealForm, foodId: food.id })}
                    >
                      <Text style={[styles.foodPillText, mealForm.foodId === food.id && styles.foodPillTextActive]}>
                        {food.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {foodMode === "all" && !foodSearch && (
                <Text style={styles.muted}>Mostrando os primeiros 80 itens. Use a busca para encontrar outros alimentos.</Text>
              )}
              <Input
                label="Quantidade em gramas/ml"
                keyboardType="numeric"
                value={mealForm.grams}
                onChangeText={(grams) => setMealForm({ ...mealForm, grams })}
              />
              <Button label="Salvar consumo" onPress={addMeal} />
              <View style={styles.inlineLog}>
                <View style={styles.logSummary}>
                  <Text style={styles.cardTitle}>Consumos lançados hoje</Text>
                  <View style={styles.macroSummary}>
                    <Text style={styles.macroSummaryText}>{selectedDateMealTotals.calories} kcal</Text>
                    <Text style={styles.macroSummaryText}>{selectedDateMealTotals.protein}g pro</Text>
                    <Text style={styles.macroSummaryText}>{selectedDateMealTotals.carbs}g carb</Text>
                  </View>
                </View>
                {selectedDateMeals.length === 0 ? (
                  <Text style={styles.muted}>Nenhum consumo lançado nesta data.</Text>
                ) : (
                  selectedDateMeals.map((meal) => <MealItem key={meal.id} meal={meal} onDelete={() => deleteMeal(meal.id)} />)
                )}
              </View>
            </Section>
          )}

          {activeTab === "food" && (
            <Section title="Cadastrar item">
              <Input label="Nome" value={foodForm.name} onChangeText={(name) => setFoodForm({ ...foodForm, name })} />
              <Input
                label="Categoria"
                value={foodForm.category}
                onChangeText={(category) => setFoodForm({ ...foodForm, category })}
              />
              <Input
                label="Calorias por 100g"
                keyboardType="numeric"
                value={foodForm.caloriesPer100g}
                onChangeText={(caloriesPer100g) => setFoodForm({ ...foodForm, caloriesPer100g })}
              />
              <Input
                label="Proteína por 100g"
                keyboardType="numeric"
                value={foodForm.proteinPer100g}
                onChangeText={(proteinPer100g) => setFoodForm({ ...foodForm, proteinPer100g })}
              />
              <Input
                label="Carboidrato por 100g"
                keyboardType="numeric"
                value={foodForm.carbsPer100g}
                onChangeText={(carbsPer100g) => setFoodForm({ ...foodForm, carbsPer100g })}
              />
              <Input
                label="Gordura por 100g"
                keyboardType="numeric"
                value={foodForm.fatPer100g}
                onChangeText={(fatPer100g) => setFoodForm({ ...foodForm, fatPer100g })}
              />
              <Button label="Salvar alimento" onPress={addFood} />
            </Section>
          )}

          {activeTab === "expense" && (
            <Section title="Registrar gasto diário">
              <Input label="Data" value={expenseForm.date} onChangeText={(date) => setExpenseForm({ ...expenseForm, date })} />
              <Text style={styles.label}>Atividade</Text>
              <View style={styles.foodList}>
                {activityPresets.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[styles.foodPill, expenseForm.activityId === activity.id && styles.foodPillActive]}
                    onPress={() => setExpenseForm({ ...expenseForm, activityId: activity.id })}
                  >
                    <Text style={[styles.foodPillText, expenseForm.activityId === activity.id && styles.foodPillTextActive]}>
                      {activity.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.selectorTabs}>
                <TouchableOpacity
                  style={[styles.selectorTab, expenseForm.unit === "minutes" && styles.selectorTabActive]}
                  onPress={() => setExpenseForm({ ...expenseForm, unit: "minutes" })}
                >
                  <Text style={[styles.selectorTabText, expenseForm.unit === "minutes" && styles.selectorTabTextActive]}>
                    Min
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorTab, expenseForm.unit === "hours" && styles.selectorTabActive]}
                  onPress={() => setExpenseForm({ ...expenseForm, unit: "hours" })}
                >
                  <Text style={[styles.selectorTabText, expenseForm.unit === "hours" && styles.selectorTabTextActive]}>
                    Hora
                  </Text>
                </TouchableOpacity>
              </View>
              <Input
                label="Tempo"
                keyboardType="numeric"
                value={expenseForm.time}
                onChangeText={(time) => setExpenseForm({ ...expenseForm, time })}
              />
              <Text style={styles.muted}>
                O app calcula as calorias usando uma média pré-programada por hora para cada atividade.
              </Text>
              <Button label="Salvar atividade" onPress={addExpense} />
              <View style={styles.inlineLog}>
                <View style={styles.logSummary}>
                  <Text style={styles.cardTitle}>Gastos lançados hoje</Text>
                  <View style={styles.macroSummary}>
                    <Text style={styles.macroSummaryText}>{selectedDateExpenseTotal} kcal</Text>
                  </View>
                </View>
                {selectedDateExpenses.length === 0 ? (
                  <Text style={styles.muted}>Nenhum gasto lançado nesta data.</Text>
                ) : (
                  selectedDateExpenses.map((expense) => (
                    <ActivityItem key={expense.id} activity={expense} onDelete={() => deleteExpense(expense.id)} />
                  ))
                )}
              </View>
            </Section>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PeriodButton({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.periodButton, active && styles.periodButtonActive]} onPress={onPress}>
      <Text style={[styles.periodButtonText, active && styles.periodButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Metric({ title, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#8A9382" {...props} />
    </View>
  );
}

function Button({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function MealItem({ meal, onDelete }) {
  return (
    <View style={styles.mealItem}>
      <View>
        <Text style={styles.mealTitle}>{meal.foodName}</Text>
        <Text style={styles.muted}>
          {meal.date} • {meal.grams}g/ml
        </Text>
      </View>
      <View style={styles.itemActions}>
        <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
        {onDelete && <DeleteButton onPress={onDelete} />}
      </View>
    </View>
  );
}

function ConsumptionFoodItem({ item }) {
  return (
    <View style={styles.mealItem}>
      <View style={styles.mealText}>
        <Text style={styles.mealTitle}>{item.name}</Text>
        <Text style={styles.muted}>{item.grams}g/ml consumidos</Text>
      </View>
      <View style={styles.macroSummary}>
        <Text style={styles.macroSummaryText}>{item.calories} kcal</Text>
        <Text style={styles.macroSummaryText}>{item.protein}g pro</Text>
        <Text style={styles.macroSummaryText}>{item.carbs}g carb</Text>
      </View>
    </View>
  );
}

function ActivityItem({ activity, onDelete }) {
  return (
    <View style={styles.mealItem}>
      <View>
        <Text style={styles.mealTitle}>{activity.description}</Text>
        <Text style={styles.muted}>
          {activity.date} • {activity.minutes || 0} min
        </Text>
      </View>
      <View style={styles.itemActions}>
        <Text style={styles.mealCalories}>{activity.calories} kcal</Text>
        {onDelete && <DeleteButton onPress={onDelete} />}
      </View>
    </View>
  );
}

function DeleteButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.deleteButton} onPress={onPress}>
      <Text style={styles.deleteButtonText}>Excluir</Text>
    </TouchableOpacity>
  );
}

function ExpenseActivitySummary({ expense }) {
  const hours = round(expense.minutes / 60);

  return (
    <View style={styles.mealItem}>
      <View style={styles.mealText}>
        <Text style={styles.mealTitle}>{expense.name}</Text>
        <Text style={styles.muted}>{expense.minutes} min acumulados</Text>
      </View>
      <View style={styles.macroSummary}>
        <Text style={styles.macroSummaryText}>{expense.calories} kcal</Text>
        <Text style={styles.macroSummaryText}>{hours}h total</Text>
      </View>
    </View>
  );
}

function BalanceEvolutionChart({ data }) {
  const chartWidth = 300;
  const chartHeight = 128;
  const barAreaHeight = 92;
  const values = data.flatMap((item) => [item.dailyBalance, item.cumulativeBalance]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = Math.max(max - min, 1);
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
  const yFromValue = (value) => chartHeight - 20 - ((value - min) / range) * (chartHeight - 28);
  const chartPoints = data.map((point, index) => ({
    x: data.length > 1 ? index * xStep : chartWidth / 2,
    y: yFromValue(point.cumulativeBalance),
    value: point.cumulativeBalance
  }));

  return (
    <View style={styles.chart}>
      <View style={styles.zeroLine} />
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={styles.chartLine}>
        <Line x1="0" y1={yFromValue(0)} x2={chartWidth} y2={yFromValue(0)} stroke="#E2E9D6" strokeWidth="1" />
        {chartPoints.slice(1).map((point, index) => {
          const previous = chartPoints[index];
          return (
            <Line
              key={`${previous.x}-${point.x}`}
              x1={previous.x}
              y1={previous.y}
              x2={point.x}
              y2={point.y}
              stroke={point.value > previous.value ? "#FF6B6B" : "#466B2D"}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        {data.map((point, index) => (
          <Circle
            key={point.date}
            cx={chartPoints[index].x}
            cy={chartPoints[index].y}
            r="3.5"
            fill={point.cumulativeBalance > 0 ? "#FF6B6B" : "#466B2D"}
          />
        ))}
      </Svg>
      {data.map((point) => {
        const height = Math.max(8, (Math.abs(point.dailyBalance) / range) * barAreaHeight);
        return (
          <View key={point.date} style={styles.chartColumn}>
            <Text style={[styles.chartValue, point.dailyBalance > 0 ? styles.chartPositiveText : styles.chartNegativeText]}>
              {formatSigned(point.dailyBalance)}
            </Text>
            <View
              style={[
                styles.chartBar,
                {
                  height,
                  backgroundColor: point.dailyBalance > 0 ? "#FF6B6B" : "#466B2D"
                }
              ]}
            />
            <Text style={styles.chartDate}>{point.date}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F7EF"
  },
  keyboard: {
    flex: 1
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8
  },
  appName: {
    color: "#243119",
    fontSize: 20,
    fontWeight: "800"
  },
  subtitle: {
    color: "#607052",
    marginTop: 4
  },
  tabs: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  periods: {
    flexDirection: "row",
    gap: 8
  },
  tab: {
    backgroundColor: "#E6ECD8",
    borderRadius: 999,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 9
  },
  tabActive: {
    backgroundColor: "#466B2D"
  },
  tabText: {
    color: "#466B2D",
    fontWeight: "700",
    fontSize: 10
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  content: {
    padding: 16,
    paddingBottom: 36,
    gap: 14
  },
  cardHero: {
    backgroundColor: "#243119",
    borderRadius: 24,
    padding: 22
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  cardTitle: {
    color: "#243119",
    fontSize: 18,
    fontWeight: "800"
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "900",
    marginVertical: 8
  },
  heroPeriods: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 5,
    marginTop: 12
  },
  periodButton: {
    backgroundColor: "#334923",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 7
  },
  periodButtonActive: {
    backgroundColor: "#9FE870"
  },
  periodButtonText: {
    color: "#DCE9CF",
    fontSize: 10,
    fontWeight: "800"
  },
  periodButtonTextActive: {
    color: "#243119"
  },
  balancePositive: {
    color: "#FF6B6B"
  },
  balanceNegative: {
    color: "#9FE870"
  },
  muted: {
    color: "#748167"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metric: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16
  },
  metricTitle: {
    color: "#748167",
    fontSize: 13
  },
  metricValue: {
    color: "#243119",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6
  },
  inputGroup: {
    gap: 6
  },
  label: {
    color: "#39492D",
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#F5F7EF",
    borderColor: "#D8E2C6",
    borderWidth: 1,
    borderRadius: 14,
    color: "#243119",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  button: {
    backgroundColor: "#466B2D",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800"
  },
  selectorTabs: {
    flexDirection: "row",
    gap: 8
  },
  selectorTab: {
    flex: 1,
    borderColor: "#D8E2C6",
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "#F5F7EF"
  },
  selectorTabActive: {
    backgroundColor: "#466B2D",
    borderColor: "#466B2D"
  },
  selectorTabText: {
    color: "#466B2D",
    fontSize: 13,
    fontWeight: "900"
  },
  selectorTabTextActive: {
    color: "#FFFFFF"
  },
  inlineLog: {
    gap: 10,
    marginTop: 8
  },
  logSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  foodList: {
    gap: 8
  },
  foodListScroll: {
    maxHeight: 260
  },
  foodPill: {
    borderColor: "#D8E2C6",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#F5F7EF"
  },
  foodPillActive: {
    backgroundColor: "#466B2D",
    borderColor: "#466B2D"
  },
  foodPillText: {
    color: "#466B2D",
    fontWeight: "800"
  },
  foodPillTextActive: {
    color: "#FFFFFF"
  },
  mealItem: {
    borderTopColor: "#EEF2E6",
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  mealText: {
    flex: 1
  },
  mealTitle: {
    color: "#243119",
    fontWeight: "800"
  },
  mealCalories: {
    color: "#466B2D",
    fontWeight: "900"
  },
  itemActions: {
    alignItems: "flex-end",
    gap: 6
  },
  deleteButton: {
    backgroundColor: "#FFE8E8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  deleteButtonText: {
    color: "#C03939",
    fontSize: 12,
    fontWeight: "900"
  },
  macroSummary: {
    alignItems: "flex-end",
    gap: 2
  },
  macroSummaryText: {
    color: "#466B2D",
    fontSize: 12,
    fontWeight: "900"
  },
  chart: {
    minHeight: 154,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
    position: "relative",
    paddingTop: 14
  },
  chartLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 4,
    zIndex: 2
  },
  zeroLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 34,
    height: 1,
    backgroundColor: "#E2E9D6"
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6
  },
  chartBar: {
    width: "70%",
    borderRadius: 999
  },
  chartValue: {
    fontSize: 10,
    fontWeight: "800"
  },
  chartPositiveText: {
    color: "#D94B4B"
  },
  chartNegativeText: {
    color: "#466B2D"
  },
  chartDate: {
    color: "#748167",
    fontSize: 10,
    fontWeight: "700"
  }
});

