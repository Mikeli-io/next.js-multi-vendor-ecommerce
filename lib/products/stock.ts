/**
 * The one rule for a product's available stock, used by every list, view and
 * query: a product WITH variations is the sum of its variations' stock; a
 * product without them uses `Product.stock`. `Product.stock` is never read for
 * a product that has variations.
 */
export function productStock(product: { stock: number; variations: ReadonlyArray<{ stock: number }> }): number {
  return product.variations.length
    ? product.variations.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;
}
