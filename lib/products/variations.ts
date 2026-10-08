/**
 * Product variations: pure helpers shared by the form (client) and the Server
 * Actions (server). No database or React here.
 *
 * A vendor defines attribute groups — any names, e.g. Color, Size, Material,
 * Storage — each with values. Every combination of one value per group (the
 * Cartesian product) is a potential variation; the vendor may drop some.
 * Each kept combination is one ProductVariation row whose `attributes` JSON is
 * `{ [groupName]: value }` and whose `name` is the values joined in group
 * order ("Red / M"). No Attribute/Option tables exist: the JSON is the model.
 *
 * Identity: a variation is its set of attribute pairs (`comboKey`), so an edit
 * that keeps "Color=Red, Size=M" keeps that row — and its price, stock, SKU and
 * image — even if other values were added or removed around it.
 */

/**
 * `valueLength` also bounds the stored variation name: at most 5 values of 30
 * characters joined by " / " is 162 characters, inside the VARCHAR(191) column.
 */
export const VARIATION_LIMITS = {
  groups: 5,
  valuesPerGroup: 20,
  combinations: 100,
  nameLength: 30,
  valueLength: 30,
} as const;

export type AttributeGroup = { name: string; values: string[] };
export type Attributes = Record<string, string>;

export const NAME_SEPARATOR = " / ";

/** Order-independent identity of a combination. */
export function comboKey(attributes: Attributes): string {
  return JSON.stringify(
    Object.keys(attributes)
      .sort()
      .map((key) => [key, attributes[key]]),
  );
}

/** Every combination of one value per group, in group/value order. */
export function combinations(groups: AttributeGroup[]): Attributes[] {
  const usable = groups.filter((g) => g.name && g.values.length);
  if (!usable.length) return [];
  return usable.reduce<Attributes[]>(
    (acc, group) => acc.flatMap((combo) => group.values.map((value) => ({ ...combo, [group.name]: value }))),
    [{}],
  );
}

/** "Red / M" — the values in group order. */
export function variationName(groups: AttributeGroup[], attributes: Attributes): string {
  return groups.map((g) => attributes[g.name]).join(NAME_SEPARATOR);
}

export function combinationCount(groups: AttributeGroup[]): number {
  const usable = groups.filter((g) => g.name && g.values.length);
  return usable.length ? usable.reduce((n, g) => n * g.values.length, 1) : 0;
}

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;

/** Problems with the groups themselves (names, values, limits), keyed for display. */
export function groupProblems(groups: AttributeGroup[]): string[] {
  const problems: string[] = [];
  if (!groups.length) problems.push("Add at least one attribute, e.g. Color or Size.");
  if (groups.length > VARIATION_LIMITS.groups) problems.push(`Use at most ${VARIATION_LIMITS.groups} attributes.`);
  groups.forEach((group, i) => {
    const label = group.name || `Attribute ${i + 1}`;
    if (!group.name) problems.push(`Attribute ${i + 1} needs a name.`);
    else if (group.name.length > VARIATION_LIMITS.nameLength) problems.push(`"${label}" must be ${VARIATION_LIMITS.nameLength} characters or fewer.`);
    if (groups.some((other, j) => j < i && other.name && group.name && same(other.name, group.name))) {
      problems.push(`"${label}" is used twice. Attribute names must be unique.`);
    }
    if (!group.values.length) problems.push(`"${label}" needs at least one value.`);
    if (group.values.length > VARIATION_LIMITS.valuesPerGroup) problems.push(`"${label}" can have at most ${VARIATION_LIMITS.valuesPerGroup} values.`);
    group.values.forEach((value, k) => {
      if (!value) problems.push(`"${label}" has an empty value.`);
      if (value.length > VARIATION_LIMITS.valueLength) problems.push(`"${value.slice(0, 20)}…" is too long (max ${VARIATION_LIMITS.valueLength}).`);
      if (group.values.some((other, m) => m < k && same(other, value))) problems.push(`"${label}" lists "${value}" twice.`);
    });
  });
  if (combinationCount(groups) > VARIATION_LIMITS.combinations) {
    problems.push(`These attributes make ${combinationCount(groups)} combinations; the limit is ${VARIATION_LIMITS.combinations}.`);
  }
  return [...new Set(problems)];
}

/**
 * Rebuild the attribute groups from saved variations, for the edit form.
 * MySQL stores JSON object keys in its own order, so the group order is
 * recovered from each variation's `name` (values joined in group order);
 * value order follows the variations' creation order.
 */
export function groupsFromVariations(variations: Array<{ name: string; attributes: Attributes }>): AttributeGroup[] {
  if (!variations.length) return [];
  const keys = Object.keys(variations[0].attributes);
  const order = orderKeys(keys, variations[0]) ?? keys;
  return order.map((name) => ({
    name,
    values: [...new Set(variations.map((v) => v.attributes[name]).filter((v): v is string => typeof v === "string"))],
  }));
}

function orderKeys(keys: string[], variation: { name: string; attributes: Attributes }): string[] | null {
  for (const perm of permutations(keys)) {
    if (perm.map((k) => variation.attributes[k]).join(NAME_SEPARATOR) === variation.name) return perm;
  }
  return null;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}
