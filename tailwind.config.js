/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/js/**/*.js',
    './src/**/*.html',
    './tests/**/*.html'
  ],
  corePlugins: { preflight: false }, // mantener estilos actuales sin reset
  theme: {
    extend: {}
  },
  plugins: []
};