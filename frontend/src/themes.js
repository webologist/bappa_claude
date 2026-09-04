export const THEMES = {
  saffron: { label: 'Saffron', primary: '#f97316', secondary: '#7e22ce' },
  royal: { label: 'Royal Blue', primary: '#2563eb', secondary: '#7c3aed' },
  emerald: { label: 'Emerald', primary: '#059669', secondary: '#0d9488' },
  rose: { label: 'Rose', primary: '#e11d48', secondary: '#db2777' },
  sunflower: { label: 'Sunflower', primary: '#eab308', secondary: '#ea580c' }
};

export const DEFAULT_THEME = 'saffron';

export function getTheme(key) {
  return THEMES[key] || THEMES[DEFAULT_THEME];
}
