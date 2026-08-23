import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Updated Vite config template
export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    // ✅ Use rolldownOptions instead of esbuildOptions/rollupOptions
    rolldownOptions: {
      // Example: externalize certain deps or tweak optimization
      // external: ['react', 'react-dom'],
    }
  },
  build: {
    // Optional: customize build output
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  }
});
