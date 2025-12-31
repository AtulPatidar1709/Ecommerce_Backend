import Chat from './ChatModel';
import { buildContext, callTool } from './botController';
import { config } from '../config/config';
import { Types } from 'mongoose';

export async function processAiMessage(userId: Types.ObjectId, message: string) {
  // 1. Persist User Message
  await Chat.create({ user: userId, role: 'user', content: message });

  const chats = await Chat.find({ user: userId });

  console.log("User chat history:", chats);

  // 2. Build AI Environment
  const policyContext = await buildContext();
  const history = await Chat.find({ user: userId }).sort({ createdAt: 1 }).limit(10);
  
  // 3. Optimized Prompt
  const systemPrompt = `
    # IDENTITY
    You are ShopBot, a highly professional e-commerce assistant.

    # INTENT LOGIC (STRICT COMPLIANCE REQUIRED)
    1. SPECIFIC SEARCH: If the user mentions ANY specific noun, brand, or item (e.g., "apple", "watch", "keyboard"), you MUST use <tool>searchProducts(keyword)</tool>.
    2. GENERAL POPULARITY: Use <tool>popularProducts()</tool> ONLY if the user asks for "popular", "trending", "latest", or "what's hot" WITHOUT naming a specific product.
    3. TOOL-ONLY FIRST RESPONSE: When a tool is required, your entire response must consist ONLY of the tool tag. DO NOT say "Searching for you..." or "One moment".

    # CORE RULES
    - NO HALLUCINATION: Only describe products returned by the tools. If the tool returns "No products found", inform the user we do not carry that item.
    - KEYWORD CLEANING: Extract only the essential brand or item name. Strip words like "a", "an", "the", "find", "show".
    - CONTEXT: ${policyContext}

    # CAPABILITIES (TOOLS)
    - <tool>listRecentOrders()</tool>: For order status/history.
    - <tool>searchProducts(keyword)</tool>: For specific brand or item queries.
    - <tool>popularProducts()</tool>: For general requests about what is trending. (Note: Takes NO arguments).

    # RESPONSE FORMATTING
    ![title](image_url) 
    **Title** Price: ₹X,XXX 
    [View Product Details](/products/id)
    `.trim();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

  // 3. Helper for API Calls
  const getAiCompletion = async (currentMessages: any[]) => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${config.OPENAI_API_KEY}` 
      },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: currentMessages, temperature: 0.3 }),
    });
    const data = await res.json();
    return data.choices[0]?.message.content ?? '';
  };

  // 4. Initial AI Call
  let reply = await getAiCompletion(messages);

  // 5. Tool Handling Loop
  const toolMatch = reply.match(/<tool>(\w+)\((.*?)\)<\/tool>/);
  if (toolMatch) {
    const [, tool, arg] = toolMatch;
    const toolRes = await callTool(tool, arg, userId);

    console.log("Tool response Popular Products :", toolRes);
    const toolOutput = toolRes || "No products found in the database. Tell the user we don't carry this item.";
    
    messages.push({ role: 'assistant', content: reply });
    
    messages.push({ role: 'user', content: `DATABASE_OUTPUT: ${toolOutput}` });
    
    reply = await getAiCompletion(messages);
  }

  // 6. Persist Assistant Reply
  await Chat.create({ user: userId, role: 'assistant', content: reply });
  return reply;
}
