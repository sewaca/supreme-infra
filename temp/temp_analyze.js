const fs = require('node:fs');
const recipes = JSON.parse(
  fs.readFileSync('services/backend/src/shared/recipes-mock.json', 'utf8'),
);

// Собираем все ингредиенты
const allIngredients = [];
recipes.forEach((recipe) => {
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    allIngredients.push(...recipe.ingredients);
  }
});

// Подсчитываем частоту
const ingredientCount = {};
allIngredients.forEach((ing) => {
  ingredientCount[ing] = (ingredientCount[ing] || 0) + 1;
});

// Сортируем по частоте
const sortedIngredients = Object.entries(ingredientCount)
  .sort(([, a], [, b]) => b - a)
  .map(([name, count]) => ({ name, count }));

console.log('ТОП 30 самых популярных ингредиентов:');
sortedIngredients.slice(0, 30).forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} (${item.count})`);
});

console.log(`\nВсе уникальные ингредиенты (${sortedIngredients.length}):`);
sortedIngredients.forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} (${item.count})`);
});
