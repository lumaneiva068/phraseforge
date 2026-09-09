const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

function extractText(response) {
  return response?.choices?.[0]?.message?.content || "";
}

function safeProviderMessage(data) {
  const message = data?.error?.message;
  if (typeof message !== "string") return "O provedor de IA não retornou uma mensagem de erro.";
  return message.slice(0, 240);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({
      code: "MISSING_API_KEY",
      error: "A OPENROUTER_API_KEY não está disponível nesta implantação."
    });
  }

  try {
    const { structure } = req.body || {};
    const clean = String(structure || "").trim().slice(0, 80);
    if (!clean) return res.status(400).json({ code: "INVALID_INPUT", error: "Digite uma estrutura em inglês." });

    const prompt = `You create practical English examples for a Brazilian learner who wants to build Anki cards.\n\nStructure to practice: "${clean}"\n\nGenerate EXACTLY 5 short, natural, useful English sentences that contain the given structure exactly or naturally in context, and provide a natural Brazilian Portuguese translation for each one.\nRules:\n- Prioritize real-life situations: work, travel, home, shopping, conversations, feelings, plans, daily routines.\n- Keep the sentences around A2-B2 unless the structure itself requires otherwise.\n- Translate meaning naturally into Brazilian Portuguese; do not make a word-for-word translation when it sounds unnatural.\n- Avoid artificial textbook sentences, obscure vocabulary, duplicates, and overly regional slang.\n- Do not number the sentences.\n- Return ONLY valid JSON in this exact shape:\n{"phrases":[{"en":"English sentence 1","pt":"Tradução em português 1"},{"en":"English sentence 2","pt":"Tradução em português 2"},{"en":"English sentence 3","pt":"Tradução em português 3"},{"en":"English sentence 4","pt":"Tradução em português 4"},{"en":"English sentence 5","pt":"Tradução em português 5"}]}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://phraseforge-alpha.vercel.app",
        "X-Title": "PhraseForge"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error", { status: response.status, error: data?.error });
      return res.status(502).json({
        code: "OPENROUTER_ERROR",
        error: `O OpenRouter recusou a solicitação (${response.status}). ${safeProviderMessage(data)}`
      });
    }

    const rawText = extractText(data).replace(/```json|```/g, "").trim();
    if (!rawText) throw new Error("Empty OpenRouter response");

    const parsed = JSON.parse(rawText);
    const phrases = Array.isArray(parsed.phrases)
      ? parsed.phrases
          .map((p) => ({ en: String(p?.en || "").trim(), pt: String(p?.pt || "").trim() }))
          .filter((p) => p.en && p.pt)
          .slice(0, 5)
      : [];

    if (phrases.length !== 5) throw new Error("Invalid phrase count or translation");

    return res.status(200).json({ phrases });
  } catch (error) {
    console.error("PhraseForge generation error", error);
    return res.status(500).json({
      code: "GENERATION_ERROR",
      error: "A resposta da IA não pôde ser processada. Tente novamente."
    });
  }
}
