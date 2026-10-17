import { describe, expect, it } from 'vitest';
import { getProductIngredients, normalizeIngredientName } from '../src/lib/ingredients';

describe('ingredient guide', () => {
  it('normalizes case, spacing, and the organic label for glossary matching', () => {
    expect(normalizeIngredientName('  Organic   Whole Wheat Flour ')).toBe('whole wheat flour');
  });

  it('expands nested lists and excludes allergen statements', () => {
    const ingredients = getProductIngredients('Organic whole wheat (organic whole wheat flour, organic cracked whole wheat), water, organic fruit juices (apple, pear), salt. Contains wheat, soy.');
    const names = ingredients.map(ingredient => ingredient.name);

    expect(names).toContain('Organic whole wheat');
    expect(names).toContain('organic whole wheat flour');
    expect(names).toContain('organic cracked whole wheat');
    expect(names).toContain('apple fruit juice');
    expect(names).toContain('pear fruit juice');
    expect(names).not.toContain('wheat');
    expect(names).not.toContain('soy');
  });

  it('classifies every parsed ingredient with a concise reason', () => {
    const ingredients = getProductIngredients('Whole grain oats, water, sugar, salt, enriched wheat flour, yeast, soybean oil.');
    const byName = Object.fromEntries(ingredients.map(ingredient => [ingredient.name, ingredient]));

    expect(byName['Whole grain oats'].rating).toBe('good');
    expect(byName.water.rating).toBe('neutral');
    expect(byName.sugar.rating).toBe('limit');
    expect(byName.salt.rating).toBe('limit');
    expect(byName['enriched wheat flour'].rating).toBe('limit');
    expect(byName.yeast.rating).toBe('neutral');
    expect(byName['soybean oil'].rating).toBe('neutral');
    expect(ingredients.every(ingredient => ingredient.reason.length > 0 && ingredient.reason.length < 130)).toBe(true);
  });
});
