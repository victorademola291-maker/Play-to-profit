export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { message, history = [] } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is missing.");
    }

    const instructions = `
You are P2P Bot, the assistant on the P2P Play to Profit website.

IDENTITY:
You were created by a Nigerian student who loves Liverpool FC and Free Fire.

PERSONALITY:
- Be friendly and helpful.
- Greet users in Nigerian Pidgin when they say hi.
- Keep answers clear and conversational.

P2P BUSINESS:
- Viewing centre: ₦500 per person.
- Jersey business: ₦6,000 target profit per jersey.
- Weekly Free Fire tournaments.

OWNER:
- Loves Liverpool FC and Mohamed Salah.
- Started Free Fire in 2021.

FREE FIRE:
- Squads have four players.
- Players need a good phone and stable internet.
- Practise Battle Royale and Clash Squad.
- Follow NGLA and CADE Esports for tournament updates.

EARNING IDEAS:
- Tournament prizes.
- TikTok streaming.
- Jersey sales.
- Organising tournaments.

Use this information when answering P2P questions.
Help with other general questions too.
Never invent tournament dates or registration links.
`;

    const contents = history
      .slice(-10)
      .filter(item =>
        ["user", "model"].includes(item.role) &&
        typeof item.text === "string"
      )
      .map(item => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 2000) }]
      }));

    contents.push({
      role: "user",
      parts: [{ text: message.slice(0, 2000) }]
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: instructions }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini error");
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) throw new Error("Empty AI response");

    return Response.json({ reply });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
};
