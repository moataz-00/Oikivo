module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: { colors: { brand: '#FF385C', 'brand-dark': '#E31C5F' } } },
  plugins: [],
};
