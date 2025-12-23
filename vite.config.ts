
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Assicura che process.env.API_KEY sia disponibile nel browser come richiesto dalle linee guida Gemini
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
