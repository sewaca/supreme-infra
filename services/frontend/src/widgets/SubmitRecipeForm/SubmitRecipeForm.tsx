'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  backendApi,
  RecipeDetails,
  RecipeIngredient,
  RecipeStep,
} from '../../shared/api/backendApi';
import { decodeToken, getAuthToken } from '../../shared/lib/auth.client';
import styles from './SubmitRecipeForm.module.css';

type SubmitStatus = 'idle' | 'success' | 'error';

interface SubmitRecipeFormProps {
  recipe?: RecipeDetails;
  onSuccess?: () => void;
}

export function SubmitRecipeForm({ recipe, onSuccess }: SubmitRecipeFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const isEditMode = !!recipe;
  const [formData, setFormData] = useState({
    title: recipe?.title || '',
    description: recipe?.description || '',
    ingredients:
      recipe?.ingredients.length && recipe?.ingredients.length > 0
        ? recipe.ingredients
        : [''],
    cookingTime: recipe?.cookingTime || 0,
    difficulty: (recipe?.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
    imageUrl: recipe?.imageUrl || '',
    servings: recipe?.servings || 0,
    calories: recipe?.calories || 0,
    detailedIngredients:
      recipe?.detailedIngredients.length &&
      recipe?.detailedIngredients.length > 0
        ? recipe.detailedIngredients
        : ([{ name: '', amount: '' }] as RecipeIngredient[]),
    steps:
      recipe?.steps.length && recipe?.steps.length > 0
        ? recipe.steps
        : ([{ stepNumber: 1, instruction: '' }] as RecipeStep[]),
    author: recipe?.author || '',
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [''],
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl,
        servings: recipe.servings,
        calories: recipe.calories,
        detailedIngredients:
          recipe.detailedIngredients.length > 0
            ? recipe.detailedIngredients
            : [{ name: '', amount: '' }],
        steps:
          recipe.steps.length > 0
            ? recipe.steps
            : [{ stepNumber: 1, instruction: '' }],
        author: recipe.author,
      });
    }
  }, [recipe]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded) {
      router.replace('/login');
      return;
    }
    setCurrentUserName(decoded.name);
    if (!isEditMode) {
      setFormData((prev) => ({ ...prev, author: decoded.name }));
    }
  }, [router, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setIsLoading(true);

    const token = getAuthToken();
    if (!token) {
      setStatus('error');
      setIsLoading(false);
      return;
    }

    try {
      const recipeData = {
        title: formData.title,
        description: formData.description,
        ingredients: formData.ingredients.filter((ing) => ing.trim() !== ''),
        cookingTime: formData.cookingTime,
        difficulty: formData.difficulty,
        imageUrl: formData.imageUrl,
        servings: formData.servings,
        calories: formData.calories,
        detailedIngredients: formData.detailedIngredients.filter(
          (ing) => ing.name.trim() !== '' && ing.amount.trim() !== '',
        ),
        steps: formData.steps.filter((step) => step.instruction.trim() !== ''),
        author: formData.author,
      };

      if (isEditMode && recipe) {
        await backendApi.updateRecipe(recipe.id, recipeData, token);
        setStatus('success');
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            router.refresh();
          }, 1000);
        }
      } else {
        await backendApi.submitRecipe(recipeData);
        setStatus('success');
      }
    } catch (_err) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, ''],
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addDetailedIngredient = () => {
    setFormData({
      ...formData,
      detailedIngredients: [
        ...formData.detailedIngredients,
        { name: '', amount: '' },
      ],
    });
  };

  const removeDetailedIngredient = (index: number) => {
    setFormData({
      ...formData,
      detailedIngredients: formData.detailedIngredients.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const updateDetailedIngredient = (
    index: number,
    field: 'name' | 'amount',
    value: string,
  ) => {
    const newIngredients = [...formData.detailedIngredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, detailedIngredients: newIngredients });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        { stepNumber: formData.steps.length + 1, instruction: '' },
      ],
    });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({
        ...step,
        stepNumber: i + 1,
      }));
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], instruction: value };
    setFormData({ ...formData, steps: newSteps });
  };

  if (status === 'success') {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.successMessage}>
          {isEditMode
            ? 'Успешно сохранено'
            : 'Приняли предложение. В ближайшее время всё проверим и опубликуем'}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.errorMessage}>
          Что-то пошло не так. Попробуйте позже
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>
        {isEditMode ? 'Редактировать рецепт' : 'Предложить рецепт'}
      </h2>

      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>
          Название рецепта *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="description" className={styles.label}>
          Описание *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className={styles.textarea}
          rows={5}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Автор</label>
        <div className={styles.authorDisplay}>
          {isEditMode ? formData.author : currentUserName}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="imageUrl" className={styles.label}>
          URL изображения *
        </label>
        <input
          id="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={(e) =>
            setFormData({ ...formData, imageUrl: e.target.value })
          }
          className={styles.input}
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="cookingTime" className={styles.label}>
            Время приготовления (мин) *
          </label>
          <input
            id="cookingTime"
            type="number"
            min="1"
            value={formData.cookingTime || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                cookingTime: Number.parseInt(e.target.value, 10) || 0,
              })
            }
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="servings" className={styles.label}>
            Количество порций *
          </label>
          <input
            id="servings"
            type="number"
            min="1"
            value={formData.servings || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                servings: Number.parseInt(e.target.value, 10) || 0,
              })
            }
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="calories" className={styles.label}>
            Калории *
          </label>
          <input
            id="calories"
            type="number"
            min="0"
            value={formData.calories || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                calories: Number.parseInt(e.target.value, 10) || 0,
              })
            }
            className={styles.input}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="difficulty" className={styles.label}>
            Сложность *
          </label>
          <select
            id="difficulty"
            value={formData.difficulty}
            onChange={(e) =>
              setFormData({
                ...formData,
                difficulty: e.target.value as 'easy' | 'medium' | 'hard',
              })
            }
            className={styles.input}
            required
          >
            <option value="easy">Легко</option>
            <option value="medium">Средне</option>
            <option value="hard">Сложно</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        {/** biome-ignore lint/a11y/noLabelWithoutControl: TODO: */}
        <label className={styles.label}>Ингредиенты (список) *</label>
        {formData.ingredients.map((ingredient, index) => (
          <div key={`${index}-${ingredient}`} className={styles.ingredientRow}>
            <input
              type="text"
              value={ingredient}
              onChange={(e) => updateIngredient(index, e.target.value)}
              className={styles.input}
              placeholder="Название ингредиента"
              required={index === 0}
            />
            {formData.ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className={styles.removeButton}
              >
                Удалить
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          className={styles.addButton}
        >
          + Добавить ингредиент
        </button>
      </div>

      <div className={styles.field}>
        {/** biome-ignore lint/a11y/noLabelWithoutControl: TODO: */}
        <label className={styles.label}>Детальные ингредиенты *</label>
        {formData.detailedIngredients.map((ingredient, index) => (
          <div
            key={`${ingredient.name}-${index}`}
            className={styles.detailedIngredientRow}
          >
            <input
              type="text"
              value={ingredient.name}
              onChange={(e) =>
                updateDetailedIngredient(index, 'name', e.target.value)
              }
              className={styles.input}
              placeholder="Название"
              required={index === 0}
            />
            <input
              type="text"
              value={ingredient.amount}
              onChange={(e) =>
                updateDetailedIngredient(index, 'amount', e.target.value)
              }
              className={styles.input}
              placeholder="Количество"
              required={index === 0}
            />
            {formData.detailedIngredients.length > 1 && (
              <button
                type="button"
                onClick={() => removeDetailedIngredient(index)}
                className={styles.removeButton}
              >
                Удалить
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addDetailedIngredient}
          className={styles.addButton}
        >
          + Добавить детальный ингредиент
        </button>
      </div>

      <div className={styles.field}>
        {/** biome-ignore lint/a11y/noLabelWithoutControl: TODO: */}
        <label className={styles.label}>Шаги приготовления *</label>
        {formData.steps.map((step, index) => (
          <div key={step.stepNumber} className={styles.stepRow}>
            <div className={styles.stepNumber}>Шаг {step.stepNumber}</div>
            <textarea
              value={step.instruction}
              onChange={(e) => updateStep(index, e.target.value)}
              className={styles.textarea}
              rows={3}
              placeholder="Описание шага"
              required={index === 0}
            />
            {formData.steps.length > 1 && (
              <button
                type="button"
                onClick={() => removeStep(index)}
                className={styles.removeButton}
              >
                Удалить
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addStep} className={styles.addButton}>
          + Добавить шаг
        </button>
      </div>

      <button type="submit" className={styles.submit} disabled={isLoading}>
        {isLoading
          ? isEditMode
            ? 'Сохранение...'
            : 'Отправка...'
          : isEditMode
            ? 'Сохранить изменения'
            : 'Отправить рецепт'}
      </button>
    </form>
  );
}
