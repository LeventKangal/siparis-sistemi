export function validateOrderUpdate({
  oldQuantity,
  newQuantity,
  stock,
  minQuantity,
  maxQuantity
}: {
  oldQuantity: number;
  newQuantity: number;
  stock: number;
  minQuantity: number;
  maxQuantity: number;
}) {
  if (newQuantity === oldQuantity) {
    return { valid: false, message: 'Miktarda değişiklik yok.'};
}

  if (newQuantity < minQuantity) {
    return {
      valid: false,
      message: `Bu üründen en az ${minQuantity} adet sipariş vermelisiniz.`
};
}

  if (newQuantity> maxQuantity) {
    return {
      valid: false,
      message: `Bu üründen en fazla ${maxQuantity} adet sipariş verebilirsiniz.`
};
}

  if (newQuantity> oldQuantity && newQuantity> stock) {
    return {
      valid: false,
      message: 'Yetersiz stok: Bu kadar ürün kalmadı.'
};
}

  return { valid: true};
}
