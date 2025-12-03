'use client';

import cx from 'classnames';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import styles from './RecipeFilters.module.css';

interface RecipeFiltersProps {
  initialSearch?: string;
  initialIngredients?: string[];
}

const AVAILABLE_INGREDIENTS = [
  'Мука',
  'Яйца',
  'Молоко',
  'Сахар',
  'Соль',
  'Масло',
  'Сметана',
  'Кефир',
  'Творог',
  'Сыр',
  'Курица',
  'Говядина',
  'Свинина',
  'Рыба',
  'Картофель',
  'Морковь',
  'Лук',
  'Чеснок',
  'Помидоры',
  'Огурцы',
  'Перец',
  'Капуста',
  'Рис',
  'Гречка',
  'Макароны',
  'Хлеб',
  'Мед',
  'Орехи',
  'Ягоды',
  'Фрукты',
];

export function RecipeFilters({
  initialSearch = '',
  initialIngredients = [],
}: RecipeFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [selectedIngredients, setSelectedIngredients] =
    useState<string[]>(initialIngredients);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (search.trim()) {
      params.set('search', search.trim());
    }
    if (selectedIngredients.length > 0) {
      params.set('ingredients', selectedIngredients.join(','));
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setSearch('');
    setSelectedIngredients([]);
    startTransition(() => {
      router.push('/');
    });
  };

  return (
    <form className={styles.filters} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="search" className={styles.label}>
          Поиск по названию
        </label>
        <input
          id="search"
          type="text"
          placeholder="Введите название рецепта..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="search" className={styles.label}>
          Поиск по ингредиентам
        </label>
        <button
          type="button"
          onClick={() => setIsIngredientsOpen(!isIngredientsOpen)}
          className={styles.collapseButton}
        >
          <span className={cx(styles.label, styles.collapseButtonText)}>
            Ингредиенты{' '}
            {selectedIngredients.length > 0 &&
              `(${selectedIngredients.length})`}
          </span>
          <span
            className={`${styles.collapseIcon} ${isIngredientsOpen ? styles.collapseIconOpen : ''}`}
          >
            ▼
          </span>
        </button>

        {isIngredientsOpen && (
          <div className={styles.checkboxContainer}>
            {AVAILABLE_INGREDIENTS.map((ingredient) => (
              <label key={ingredient} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedIngredients.includes(ingredient)}
                  onChange={() => toggleIngredient(ingredient)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{ingredient}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isPending}
        >
          {isPending ? 'Поиск...' : 'Найти рецепты'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={styles.resetButton}
          disabled={isPending}
        >
          Сбросить
        </button>
      </div>
    </form>
  );
}
