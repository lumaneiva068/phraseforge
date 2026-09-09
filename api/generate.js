const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

function extractText(response) {
  if (typeof response?.output_text === "string") return response.output_text;
  const chunks = [];
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

function safeOpenAIMessage(data) {
  const message = data?.error?.message;
  if (typeof message !== "string") return "A OpenAI API não retornou uma mensagem de erro.";
  return message.slice(0, 240);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      code: "MISSING_API_KEY",
      error: "A OPENAI_API_KEY não está disponível nesta implantação."
    });
  }

  try {
    const { structure } = req.body || {};
    const clean = String(structure || "").trim().slice(0, 80);
    if (!clean) return res.status(400).json({ code: "INVALID_INPUT", error: "Digite uma estrutura em inglês." });

    const prompt = `You create practical English examples for a Brazilian learner who wants to build Anki cards.\n\nStructure to practice: "${clean}"\n\nGenerate EXACTLY 5 short, natural, useful English sentences that contain the given structure exactly or naturally in context.\nRules:\n- Prioritize real-life situations: work, travel, home, shopping, conversations, feelings, plans, daily routines.\n- Keep the sentences around A2-B2 unless the structure itself requires otherwise.\n- Avoid artificial textbook sentences, obscure vocabulary, duplicates, and overly regional slang.\n- Do not number the sentences.\n- Return ONLY valid JSON in this exact shape:\n{"phrases":["sentence 1","sentence 2","sentence 3","sentence 4","sentence 5"]}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        max_output_tokens: 500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error", { status: response.status, error: data?.error });
      return res.status(502).json({
        code: "OPENAI_ERROR",
        error: `A OpenAI recusou a solicitação (${response.status}). ${safeOpenAIMessage(data)}`
      });
    }

    const rawText = extractText(data).replace(/```json|```/g, "").trim();
    if (!rawText) throw new Error("Empty OpenAI response");

    const parsed = JSON.parse(rawText);
    const phrases = Array.isArray(parsed.phrases)
      ? parsed.phrases.map((p) => String(p).trim()).filter(Boolean).slice(0, 5)
      : [];

    if (phrases.length !== 5) throw new Error("Invalid phrase count");

    return res.status(200).json({ phrases });
  } catch (error) {
    console.error("PhraseForge generation error", error);
    return res.status(500).json({
      code: "GENERATION_ERROR",
      error: "A resposta da OpenAI não pôde ser processada. Tente novamente."
    });
  }
}
