export type IngredientRating = 'good' | 'neutral' | 'limit';

export type IngredientGuide = {
  id: string;
  name: string;
  rating: IngredientRating;
  ratingLabel: 'Good choice' | 'Neutral' | 'Limit';
  reason: string;
};

const ratingLabels: Record<IngredientRating, IngredientGuide['ratingLabel']> = {
  good: 'Good choice',
  neutral: 'Neutral',
  limit: 'Limit',
};

function cleanIngredient(value: string) {
  return value
    .replace(/^including\s+/i, '')
    .replace(/^(?:and\s+)?(?:smaller amounts of\s+)?/i, '')
    .replace(/^(?:plus\s+)?added\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.:;-]+|[\s.:;-]+$/g, '')
    .trim();
}

function parseLevel(value: string, parent = ''): string[] {
  const ingredients: string[] = [];
  let token = '';

  const add = (raw: string, context = parent) => {
    let name = cleanIngredient(raw);
    if (!name || /^(?:added )?to preserve freshness$/i.test(name)) return;
    if (/fruit juices?/i.test(context) && /^(?:organic )?(?:apple|pear|peach)$/i.test(name)) name = `${name} fruit juice`;
    ingredients.push(name);
  };

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '(') {
      const group = cleanIngredient(token);
      add(group);
      token = '';
      let depth = 1;
      let end = index + 1;
      while (end < value.length && depth > 0) {
        if (value[end] === '(') depth += 1;
        if (value[end] === ')') depth -= 1;
        end += 1;
      }
      const inside = value.slice(index + 1, Math.max(index + 1, end - 1));
      ingredients.push(...parseLevel(inside, group));
      index = end - 1;
    } else if (character === ',' || character === ';') {
      add(token);
      token = '';
    } else {
      token += character;
    }
  }
  add(token);
  return ingredients;
}

function classify(name: string): Pick<IngredientGuide, 'rating' | 'reason'> {
  const ingredient = name.toLowerCase().replace(/^organic\s+/, '');

  if (/\b(sugar|syrup|honey|molasses|dextrose|fructose|glucose|sucrose|malt flavor|fruit juice)\b/.test(ingredient)) {
    return { rating: 'limit', reason: 'Adds sweetness or added sugar. Check the product’s added-sugar amount.' };
  }
  if (/\bsalt\b|sodium chloride/.test(ingredient)) {
    return { rating: 'limit', reason: 'Adds sodium. Compare the sodium amount with similar products.' };
  }
  if (/enriched|bleached flour|refined|milled corn|corn starch|modified starch/.test(ingredient)) {
    return { rating: 'limit', reason: 'A refined grain or starch with less fiber than a whole-grain option.' };
  }
  if (/preservative|artificial (?:flavor|color)|\b(?:red|yellow|blue) \d+\b/.test(ingredient)) {
    return { rating: 'limit', reason: 'Used for shelf life, flavor, or color; current guidance favors limiting highly processed ingredients.' };
  }
  if (/whole (?:wheat|grain)|cracked whole wheat|rolled oats|oat fiber|\bflax\b|sunflower seeds|pumpkin seeds|\bquinoa\b|\bbarley\b|\bnuts?\b/.test(ingredient)) {
    return { rating: 'good', reason: 'A whole-grain, seed, or fiber-rich ingredient that can add useful nutrients.' };
  }
  if (/^water$/.test(ingredient)) return { rating: 'neutral', reason: 'Used to mix the ingredients and create the product’s texture.' };
  if (/yeast/.test(ingredient)) return { rating: 'neutral', reason: 'Helps bread rise and develop flavor.' };
  if (/gluten/.test(ingredient)) return { rating: 'neutral', reason: 'Adds structure and protein; it contains wheat gluten.' };
  if (/\boil\b|lecithin/.test(ingredient)) return { rating: 'neutral', reason: 'Helps texture and mixing; the amount in the finished food matters most.' };
  if (/vinegar|citric acid|enzyme|phosphate|carbonate|tocopherol/.test(ingredient)) return { rating: 'neutral', reason: 'Used for texture, freshness, acidity, or food preparation.' };
  if (/vitamin|mineral|niacin|iron|folic|riboflavin|thiamin/.test(ingredient)) return { rating: 'neutral', reason: 'Adds or restores a vitamin or mineral without defining the whole product.' };
  return { rating: 'neutral', reason: 'Its role depends on the amount used and the nutrition of the finished product.' };
}

export function getProductIngredients(value: string | null): IngredientGuide[] {
  if (!value) return [];
  const ingredientText = value
    .split(/\bcontains\b/i, 1)[0]
    .replace(/\.\s+(?=[A-Z])/g, ', ')
    .replace(/\.$/, '');
  const seen = new Set<string>();

  return parseLevel(ingredientText).flatMap((name) => {
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) return [];
    seen.add(normalized);
    const classification = classify(name);
    return [{
      id: normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name,
      ...classification,
      ratingLabel: ratingLabels[classification.rating],
    }];
  });
}
