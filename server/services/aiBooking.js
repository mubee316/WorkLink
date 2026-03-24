const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate the AI's opening message to a worker.
 */
async function generateOpeningMessage(conv, aiContext) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 256,
    system: buildSystemPrompt(conv, aiContext),
    messages: [{ role: 'user', content: 'Write your opening message to the worker. Be concise (2-4 sentences).' }],
  });
  return msg.content[0].text.trim();
}

/**
 * Generate the AI reply to a worker's message.
 * Returns { text, bookingConfirmed, bookingData }
 */
async function generateReply(conv, aiContext, history) {
  const historyMessages = history.map((m) => ({
    role: m.senderId === 'ai' ? 'assistant' : 'user',
    content: m.content,
  }));

  // Ensure alternating roles (Claude requires this)
  const filtered = [];
  for (const m of historyMessages) {
    if (filtered.length === 0 || filtered[filtered.length - 1].role !== m.role) {
      filtered.push(m);
    }
  }
  // Must start with user
  if (filtered.length === 0 || filtered[0].role !== 'user') {
    filtered.unshift({ role: 'user', content: '(conversation started)' });
  }

  const system = buildSystemPrompt(conv, aiContext) + `

If the worker has confirmed availability AND you have agreed on hours/price, end your reply with exactly:
[BOOKING_CONFIRMED]{"hours":<number>,"totalPrice":<number>,"date":"<date string>"}`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system,
    messages: filtered,
  });

  const text = msg.content[0].text.trim();

  const confirmMatch = text.match(/\[BOOKING_CONFIRMED\](\{.+\})/);
  if (confirmMatch) {
    try {
      const bookingData = JSON.parse(confirmMatch[1]);
      const cleanText = text.replace(/\[BOOKING_CONFIRMED\]\{.+\}/, '').trim();
      return { text: cleanText, bookingConfirmed: true, bookingData };
    } catch {
      // fall through
    }
  }

  return { text, bookingConfirmed: false, bookingData: null };
}

function buildSystemPrompt(conv, aiContext) {
  return `You are WorkLink AI, an automated booking assistant for the WorkLink platform in Nigeria. You are messaging a skilled worker on behalf of a customer.

Customer's request:
- Job description: ${aiContext.jobDescription}
- Preferred date: ${aiContext.preferredDate || 'flexible'}
- Budget: ₦${Number(aiContext.budget).toLocaleString()}
- Customer name: ${conv.customerName}

Worker details:
- Name: ${conv.workerName}
- Skills: ${(conv.workerSkills || []).join(', ')}
- Hourly rate: ₦${Number(conv.workerHourlyRate).toLocaleString()}/hr

Your goal:
1. Introduce yourself as WorkLink AI booking on behalf of the customer
2. Describe the job clearly
3. Confirm the worker's availability for the preferred date
4. Agree on number of hours and total price (within the customer's budget)
5. Once all details are confirmed, output the booking signal

Keep messages short, professional, and friendly. Always be clear you're representing the customer.`;
}

module.exports = { generateOpeningMessage, generateReply };
