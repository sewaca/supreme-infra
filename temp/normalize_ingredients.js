const fs = require('node:fs');

// Правила нормализации ингредиентов
const normalizationRules = {
  // Яйца
  Яйцо: 'Яйца',

  // Масло
  'Сливочное масло': 'Масло сливочное',
  'Масло оливковое': 'Оливковое масло',
  Масло: 'Масло сливочное',
  'Масло растительное': 'Растительное масло',

  // Овощи
  Томаты: 'Помидоры',
  Огурец: 'Огурцы',

  // Мясо
  'Фарш говяжий': 'Фарш мясной',
  'Говяжий фарш': 'Фарш мясной',
  Фарш: 'Фарш мясной',

  // Другие нормализации
  Kakao: 'Какао',
  Тклапи: 'Ткемали', // Предполагаю, что это опечатка
};

// Функция нормализации
function normalizeIngredient(name) {
  return normalizationRules[name] || name;
}

// Читаем файл
const recipes = JSON.parse(
  fs.readFileSync('services/backend/src/shared/recipes-mock.json', 'utf8'),
);

// Нормализуем ингредиенты
let changedCount = 0;
recipes.forEach((recipe) => {
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipe.ingredients = recipe.ingredients.map((ing) => {
      const normalized = normalizeIngredient(ing);
      if (normalized !== ing) {
        console.log(`Нормализовано: "${ing}" → "${normalized}"`);
        changedCount++;
      }
      return normalized;
    });
  }
});

console.log(`\nВсего нормализовано ${changedCount} ингредиентов`);

// Записываем обратно
fs.writeFileSync(
  'services/backend/src/shared/recipes-mock.json',
  JSON.stringify(recipes, null, 2),
);

// Подсчитываем статистику после нормализации
const allIngredients = [];
recipes.forEach((recipe) => {
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    allIngredients.push(...recipe.ingredients);
  }
});

const ingredientCount = {};
allIngredients.forEach((ing) => {
  ingredientCount[ing] = (ingredientCount[ing] || 0) + 1;
});

const sortedIngredients = Object.entries(ingredientCount)
  .sort(([, a], [, b]) => b - a)
  .map(([name, count]) => ({ name, count }));

console.log('\nТОП 30 самых популярных ингредиентов после нормализации:');
sortedIngredients.slice(0, 30).forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} (${item.count})`);
});
