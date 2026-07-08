import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "./src/ai_prompt";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: "10mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/ai-config", (req, res) => {
    res.json({
      hasKey: !!process.env.GEMINI_API_KEY
    });
  });

  app.post("/api/generate-template", async (req, res) => {
    try {
      const { messages, currentTemplate } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "A lista de mensagens é obrigatória." });
      }

      let apiKey = process.env.GEMINI_API_KEY || (req.headers['x-gemini-key'] as string) || req.body.customApiKey;
      if (!apiKey) {
        return res.status(400).json({ error: "Chave de API do Gemini não configurada e nenhuma chave personalizada foi fornecida." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const contents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      let systemInstruction = SYSTEM_INSTRUCTION;
      if (currentTemplate) {
        systemInstruction += `\n\n### INSTRUÇÃO CRÍTICA DO MODELO ATUAL:
O usuário está visualizando e editando o seguinte modelo de e-mail atual (no formato JSON esperado):
${JSON.stringify(currentTemplate, null, 2)}

Toda vez que o usuário enviar uma nova mensagem:
1. Verifique se a mensagem está pedindo uma alteração, ajuste, adição de elemento ou estilização no modelo atual descrito acima.
2. Se sim, você DEVE apenas alterar este modelo atual diretamente (mantendo os dados, variáveis e elementos que não foram afetados ou que o usuário quer preservar).
3. NÃO crie um novo modelo do zero a menos que o usuário solicite explicitamente "criar um novo modelo" ou "limpar e recomeçar do zero".
4. Retorne o JSON com o modelo atualizado sob as modificações sugeridas pelo usuário, preservando o ID "${currentTemplate.id}" ou gerando modificações em cima dele.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "Nenhuma resposta retornada do modelo de IA." });
      }

      // Retorna a resposta parsed
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Error generating template:", error);
      const errorMessage = error.message || "";
      let errorType = "GENERIC_ERROR";

      if (
        errorMessage.includes("429") || 
        errorMessage.includes("Quota exceeded") || 
        errorMessage.includes("Resource exhausted") || 
        errorMessage.includes("limit") || 
        errorMessage.includes("rate")
      ) {
        errorType = "HIGH_DEMAND";
      } else if (
        errorMessage.includes("503") || 
        errorMessage.includes("Unavailable") || 
        errorMessage.includes("Overloaded") || 
        errorMessage.includes("unstable") || 
        errorMessage.includes("timeout") || 
        errorMessage.includes("504")
      ) {
        errorType = "UNSTABLE";
      }

      res.status(500).json({ 
        error: errorMessage || "Erro Interno no Servidor",
        errorType
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
