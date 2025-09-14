// genkit.config.ts
import { defineGenkitConfig } from 'genkit';
import { ollama } from 'genkitx-ollama';

export default defineGenkitConfig({
  plugins: [ollama()],
  logLevel: 'debug',
});