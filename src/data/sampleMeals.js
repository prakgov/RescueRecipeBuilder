/**
 * Small offline dataset in TheMealDB's response shape.
 * Used ONLY when the live API can't be reached (offline, CORS, rate limit),
 * so the prototype still demos. These are simple generic recipes written for
 * this project, not copied from TheMealDB.
 */
const raw = [
  ['s1', 'Veggie Fried Rice', 'Asian', ['Rice', '2 cups cooked'], ['Egg', '2'], ['Carrots', '1'], ['Peas', '1/2 cup'], ['Onion', '1'], ['Soy Sauce', '2 tbsp'], ['Garlic', '2 cloves']],
  ['s2', 'Tomato & Garlic Pasta', 'Italian', ['Spaghetti', '200g'], ['Tomatoes', '4'], ['Garlic', '3 cloves'], ['Olive Oil', '2 tbsp'], ['Basil', 'handful'], ['Parmesan', '30g']],
  ['s3', 'Spinach Omelette', 'Breakfast', ['Egg', '3'], ['Spinach', '1 handful'], ['Cheese', '30g'], ['Butter', '1 tsp'], ['Milk', '2 tbsp']],
  ['s4', 'Chicken Stir Fry', 'Asian', ['Chicken', '300g'], ['Bell Pepper', '1'], ['Onion', '1'], ['Garlic', '2 cloves'], ['Soy Sauce', '3 tbsp'], ['Rice', 'to serve'], ['Ginger', '1 tsp']],
  ['s5', 'Leftover Veg Soup', 'Soup', ['Potatoes', '2'], ['Carrots', '2'], ['Onion', '1'], ['Celery', '2 sticks'], ['Vegetable Stock', '1 litre'], ['Garlic', '1 clove']],
  ['s6', 'Banana Pancakes', 'Dessert', ['Banana', '2'], ['Egg', '2'], ['Flour', '100g'], ['Milk', '150ml'], ['Butter', 'for frying']],
  ['s7', 'Cheesy Potato Bake', 'Side', ['Potatoes', '4'], ['Cheese', '100g'], ['Milk', '200ml'], ['Garlic', '2 cloves'], ['Butter', '1 tbsp']],
  ['s8', 'Chicken & Spinach Curry', 'Indian', ['Chicken', '400g'], ['Spinach', '2 handfuls'], ['Tomatoes', '2'], ['Onion', '1'], ['Garlic', '3 cloves'], ['Ginger', '1 tbsp'], ['Yogurt', '3 tbsp'], ['Rice', 'to serve']],
  ['s9', 'Mushroom Risotto', 'Italian', ['Rice', '250g'], ['Mushrooms', '200g'], ['Onion', '1'], ['Vegetable Stock', '1 litre'], ['Parmesan', '40g'], ['Butter', '1 tbsp']],
  ['s10', 'Yogurt Fruit Bowl', 'Breakfast', ['Yogurt', '200g'], ['Banana', '1'], ['Apple', '1'], ['Honey', '1 tbsp']],
];

export const SAMPLE_MEALS = raw.map(([id, name, category, ...ings]) => {
  const meal = {
    idMeal: id,
    strMeal: name,
    strCategory: category,
    strArea: 'Sample',
    strMealThumb: '',
    strInstructions:
      'Sample recipe (offline demo data). Prep the ingredients, cook the main items together over medium heat until done, season to taste and serve.',
    strSource: '',
    strYoutube: '',
  };
  ings.forEach(([ing, measure], i) => {
    meal[`strIngredient${i + 1}`] = ing;
    meal[`strMeasure${i + 1}`] = measure;
  });
  return meal;
});

export const SAMPLE_INGREDIENTS = [
  ...new Set(SAMPLE_MEALS.flatMap((m) => Object.keys(m).filter((k) => k.startsWith('strIngredient')).map((k) => m[k]))),
].sort();
