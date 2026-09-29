export type Theme = 'light' | 'dark';

const storageKey = 'launch-catch-theme';

const getSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const getTheme = (): Theme => {
  const savedTheme = window.localStorage.getItem(storageKey);

  return savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : getSystemTheme();
};

export const setTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);
};

export const initializeTheme = () => {
  document.documentElement.dataset.theme = getTheme();
};
