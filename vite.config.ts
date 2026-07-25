import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use relative asset paths so the same build works on localhost,
// GitHub Pages, forks, and repositories with different names.
export default defineConfig({
  plugins: [react()],
  // Relative assets work on localhost, GitHub Pages, and forks regardless of repo name.
  base: './',
})
