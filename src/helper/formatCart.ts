export const formatCart = (cart: any) => {
  if (!cart || !cart.items) return { items: [], totalAmount: 0 };

  const items = cart.items
    .filter((item: any) => item.productId)
    .map((item: any) => ({
      productId: item.productId._id.toString(),
      title: item.productId.title,
      thumbnail: item.productId.thumbnail ?? [],
      price: item.productId.price ?? 0,
      quantity: item.quantity ?? 0,
      discount: item.productId.discount ?? 0,
      lineTotal:
        (item.productId.price ?? 0) *
        (item.quantity ?? 0) *
        (1 - (item.productId.discount ?? 0) / 100),
    }));

  const totalAmount = Math.floor(
    items.reduce((sum: number, item: any) => sum + item.lineTotal, 0)
  );

  return { items, totalAmount };
};
