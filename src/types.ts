export interface UserProfile {
  id: string;
  email: string;
  name: string;
  dob: string;
  gender: "male" | "female";
  height_cm: number;
  weight_kg: number;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  calorie_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snacks";
  serving_size: string;
  quantity: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

export interface CustomFood {
  id: string;
  user_id: string;
  name: string;
  barcode: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  activity_name: string;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export interface DiaryData {
  date: string;
  foods: FoodLog[];
  exercises: ExerciseLog[];
  water: WaterLog;
  goals: {
    calorie_goal: number;
    protein_goal_g: number;
    carbs_goal_g: number;
    fat_goal_g: number;
    weight_kg: number;
  };
}

export interface WeeklySummaryDay {
  date: string;
  target: number;
  consumed: number;
  burned: number;
  net: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  };
}

export interface AIProcessedRecipe {
  recipeName: string;
  servingSize: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
}
