import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { Order } from '../orders/orderModel';
import { User } from '../user/userTypes';
import openai from '../utils/openaiClient';
import Chat from './ChatModel';
import { Types } from 'mongoose';
import { Product } from '../product/productModel';

export async function buildContext() {
  return 'Store Policy: 30-day free returns for unused items. Refunds processed in 5 days.';
}

export async function callTool(toolName: string, arg: string, userId: Types.ObjectId) {
  if (toolName === 'listRecentOrders') {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(1);
    if (!orders.length) return "User has no recent orders.";
    return orders.map(o => `OrderID: ${o._id} | Status: ${o.shipping_status} | Payment: ${o.payment_status}  | totalAmount : ₹${o.totalAmount} | Date: ${o.createdAt}`).join(' || ');
  }

  if (toolName === 'popularProducts') {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(3);

    console.log("Search popularProducts results: ", products);

    if (products.length === 0) return 'No products found matching that requirement.';

    return products.map(p => 
        `![${p.title}](${p.thumbnail}) \n **${p.title}** \n ₹${p.price} \n [View Product Details](/products/${p._id})`
      ).join('\n\n---\n\n');
  }

  // --- NEW SEARCH TOOL ---
  if (toolName === 'searchProducts') {

    const cleanArg = arg.replace(/\b(find|me|a|the|show|search|for|want)\b/gi, '')
    .replace(/['"]+/g, '')
    .trim();

    const keywords = cleanArg.split(/\s+/).filter(word => word.length > 0);

    console.log("Search results keywords: ", keywords);

    let products = await Product.find({
      $and: keywords.map(word => ({
        title: { $regex: word, $options: 'i' }
      }))
    }).limit(3);

    // STEP 2: Fallback to Description ONLY if Title search returns nothing
    if (products.length === 0) {
      products = await Product.find({
        $and: keywords.map(word => ({
          $or: [
            { description: { $regex: word, $options: 'i' } }
          ]
        }))
      }).limit(3);
    }

    console.log("Search results: ", products);

    if (products.length === 0) return 'No products found matching that requirement.';

    return products.map(p => 
        `![${p.title}](${p.thumbnail}) \n **${p.title}** \n ₹${p.price} \n [View Product Details](/products/${p._id})`
      ).join('\n\n---\n\n');
  }
  return 'Tool not implemented';
}

export const postBotMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message } = req.body;
    const user = req.user as User;
    if (!user) return next(createHttpError(401, 'Unauthorized'));

    const userId = user._id;

    // save user message
    await Chat.create({ user: userId, role: 'user', content: message });

    // build context & history
    const context = await buildContext();
    const history = await Chat.find({ user: userId })
      .sort({ createdAt: 1 })
      .limit(10);

    const messages = [
      { role: 'system', content: `Context: ${context}` },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // first OpenAI call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
    });
    let reply = completion.choices[0]?.message.content || '';

    console.log("Completion reply is ", reply);

    // tool parser
    const toolMatch = reply.match(/<tool>(\w+)\((.*?)\)<\/tool>/);
    if (toolMatch) {
      const [, tool, arg] = toolMatch as [string, string, string];;
      const toolRes = await callTool(tool, arg, userId);
      messages.push({ role: 'tool', content: toolRes });
    
      const second = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
      });
      reply = second.choices[0]?.message.content || '';
    }

    // save assistant reply
    await Chat.create({ user: userId, role: 'assistant', content: reply });
    res.json({ reply });
  } catch (err) {
    next(err); // → global error handler
  }
};