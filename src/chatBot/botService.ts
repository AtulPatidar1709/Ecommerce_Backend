import Chat from './ChatModel';
import { buildContext, callTool } from './botController';
import { config } from '../config/config';
import { Types } from 'mongoose';

export async function processAiMessage(userId: Types.ObjectId, message: string) {
  try {
    // 1. Persist User Message
    const sessionKey = userId || "GUEST_SESSION";

    const isGuest = !userId;

    await Chat.create({ user: sessionKey, role: 'user', content: message });

    // 2. Build AI Environment
    const policyContext = await buildContext();
    const history = await Chat.find({ user: sessionKey }).sort({ createdAt: 1 }).limit(10);
    
    // 3. Optimized Prompt
    const systemPrompt = `
      # IDENTITY
      You are ShopBot, a highly professional and empathetic e-commerce expert. Your goal is to assist users with orders, product discovery, and store inquiries.

      # AUTHENTICATION STATUS
      - ${isGuest ? "USER STATUS: GUEST. Access to personal data is restricted." : "USER STATUS: LOGGED_IN."}

      # INTENT LOGIC (STRICT COMPLIANCE REQUIRED)
      1. SPECIFIC SEARCH: If the user mentions ANY specific noun, brand, or item (e.g., "apple", "watch"), you MUST use <tool>searchProducts(keyword)</tool>.
      2. GENERAL POPULARITY: Use <tool>popularProducts()</tool> ONLY if the user asks for "popular", "trending", "latest", or "what's hot" WITHOUT naming a specific product.
      3. TOOL-ONLY FIRST RESPONSE: When a tool is required, your entire response must consist ONLY of the tool tag. DO NOT say "Searching for you..." or "One moment".
      4. GUEST RESTRICTION: If a GUEST asks for order details or "my orders", politely inform them: "I'd love to help with that! Please [Login](/login) to view your personal order history.". DO NOT call 'listRecentOrders' for guests.

      # CORE RULES
      - NO HALLUCINATION: Only describe products returned by the tools. If the tool returns "No products found", inform the user we do not carry that item.
      - KEYWORD CLEANING: Extract only the essential brand or item name. Strip words like "a", "an", "the", "find", "show".
      - CONTEXT: ${policyContext}

      # CAPABILITIES (TOOLS)
      - <tool>listRecentOrders()</tool>: Use for "status", "my orders", or "recent purchases" (Logged-in users only).
      - <tool>searchProducts(keyword)</tool>: Use for specific item/brand queries.
      - <tool>popularProducts()</tool>: Use for general trending requests. Note: This tool takes NO arguments.

      # RESPONSE FORMATTING
      When displaying products, use this exact Markdown structure:
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
        body: JSON.stringify({ 
          model: "openai/gpt-4o-mini", 
          messages: currentMessages, 
          temperature: 0.3 
        }),
      });
      if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
      const data = await res.json();
      return data.choices[0]?.message.content ?? '';
    };

    // 4. Initial AI Call
    let reply = await getAiCompletion(messages);

    // 5. Tool Handling Loop
    const toolMatch = reply.match(/<tool>(\w+)\((.*?)\)<\/tool>/);
    if (toolMatch) {
      const [, tool, arg] = toolMatch;
      let toolRes;

      if( tool === "listRecentOrders" && isGuest) {
        toolRes = "I'd love to help with that! Please Login to view your personal order history.";
      } else {
        toolRes = await callTool(tool, arg, userId);
      }
      console.log("Tool response Popular Products :", toolRes);
      
      const toolOutput = toolRes || "No products found in the database. Tell the user we don't carry this item.";
      
      messages.push({ role: 'assistant', content: reply });
      
      messages.push({ role: 'user', content: `DATABASE_OUTPUT: ${toolOutput}` });
      
      reply = await getAiCompletion(messages);
    }

    // 6. Persist Assistant Reply
    await Chat.create({ user: sessionKey, role: 'assistant', content: reply });
    return reply;
  } catch (error) {
    console.error("processAiMessage Error:", error);
    return "I'm having a bit of trouble right now. Could you try asking me again in a moment? 🛍️";
  }
}