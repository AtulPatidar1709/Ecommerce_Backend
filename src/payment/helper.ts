import { cartItems } from "../cart/cartTypes";
import { Product } from "../product/productModel";

export async function getCartSummary(items : cartItems[]) {
    console.log("Cart Items ", ...items);
    const ids = items.map(i => i.productId);
    const products = await Product
        .find({ _id: { $in: ids } })
        .select("price discount stock title")
        .lean();

    console.log("Products at Cart Summart ", products);
    const map = products.reduce((m : any, p : any) => ((m[p._id.toString()] = p), m), {});

    let total = 0;
    for (const it of items) {
        const p = map[it.productId.toString()];
        if (!p) throw new Error(`Product ${it.productId} deleted`);
        if (p.stock < it.quantity)
            throw new Error(`Product ${p.name} out of stock`);
        const priceAfterDiscount = p.price * (1 - (p.discount || 0) / 100);
        total += priceAfterDiscount * it.quantity;
    }

    console.log("Products at Cart Summart total", total);

    return {
        totalAmountInPaise: Math.round(total * 100),
        productMap: map,
    };
}

/*  helper: reserve stock atomically  */
export async function reserveItems(items : cartItems[]) {
    const reserved = [];                // keep track for rollback
    for (const it of items) {
        const product = await Product.findOneAndUpdate(
            { _id: it.productId, stock: { $gte: it.quantity } },
            { $inc: { stock: -it.quantity } },
            { new: true }                   // return updated doc
        ); 
        if (!product) {                   // ← out of stock
            // rollback previous reservations
            await Promise.all(
                reserved.map(r =>
                    Product.updateOne(
                        { _id: r.productId },
                        { $inc: { stock: r.quantity } }
                    )
                )
            );
            return null;     // signal failure
        }
        reserved.push({ productId: it.productId, quantity: it.quantity });
    }
    return reserved;            // success
}
