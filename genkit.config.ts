// genkit.config.ts
import { configureGenkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

export default configureGenkit({
  plugins: [ollama()],
  logLevel: 'debug',
  // Add this to disable file watching issues on Windows
  dev: {
    watch: false
  }
});