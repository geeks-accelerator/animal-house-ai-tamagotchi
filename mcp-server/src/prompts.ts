import type { McpServer } from "@modelcontextprotocol/server";
import prompts from "./prompts.json" with { type: "json" };

// The prompt text lives in prompts.json so the hosted endpoint at
// animalhouse.ai/mcp serves exactly the same prompts.
export function registerPrompts(server: McpServer) {
  for (const prompt of prompts) {
    server.registerPrompt(prompt.name, { description: prompt.description }, () => ({
      messages: [{ role: "user", content: { type: "text", text: prompt.text } }],
    }));
  }
}
