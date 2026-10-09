/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { primary: '#6366f1', 'primary-dark': '#4f46e5', secondary: '#e5e7eb', accent: '#10b981' }, fontFamily: { sans: ['Inter', 'sans-serif'], heading: ['Space Grotesk', 'sans-serif'] }, backgroundImage: { 'indigo-purple': 'linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%)' } } },
  plugins: []
};
