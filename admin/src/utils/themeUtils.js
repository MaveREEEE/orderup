// Fetch settings and apply color scheme to the website
export const applyTheme = async (url) => {
  try {
    const response = await fetch(`${url}/api/settings/`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const settings = data.data;
      const root = document.documentElement;
      
      // Apply colors as CSS variables
      root.style.setProperty('--primary-color', settings.primaryColor || '#ff7043');
      root.style.setProperty('--secondary-color', settings.secondaryColor || '#ff4500');
      root.style.setProperty('--accent-color', settings.accentColor || '#e85a4f');
      root.style.setProperty('--text-color', settings.textColor || '#333333');
      root.style.setProperty('--background-color', settings.backgroundColor || '#fcfcfc');
      
      // Store in localStorage for quick access
      localStorage.setItem('theme', JSON.stringify({
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,
        textColor: settings.textColor,
        backgroundColor: settings.backgroundColor
      }));
      
      // Update favicon if available (supports Cloudinary URLs)
      if (settings.favicon) {
        const href = settings.favicon.startsWith('http')
          ? settings.favicon
          : `${url}/uploads/branding/${settings.favicon}`
        updateFavicon(href);
      }
      
      return settings;
    }
  } catch (error) {
    console.error('Error fetching theme:', error);
    // Apply default colors if fetch fails
    applyDefaultTheme();
  }
};

// Apply default theme
export const applyDefaultTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', '#ff7043');
  root.style.setProperty('--secondary-color', '#ff4500');
  root.style.setProperty('--accent-color', '#e85a4f');
  root.style.setProperty('--text-color', '#333333');
  root.style.setProperty('--background-color', '#fcfcfc');
};

// Apply theme from localStorage
export const applyStoredTheme = () => {
  try {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      const theme = JSON.parse(storedTheme);
      const root = document.documentElement;
      
      root.style.setProperty('--primary-color', theme.primaryColor || '#ff7043');
      root.style.setProperty('--secondary-color', theme.secondaryColor || '#ff4500');
      root.style.setProperty('--accent-color', theme.accentColor || '#e85a4f');
      root.style.setProperty('--text-color', theme.textColor || '#333333');
      root.style.setProperty('--background-color', theme.backgroundColor || '#fcfcfc');
    }
  } catch (error) {
    console.error('Error applying stored theme:', error);
  }
};

// Update favicon dynamically
export const updateFavicon = (faviconUrl) => {
  try {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());
    
    // Add new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = faviconUrl;
    document.head.appendChild(link);
  } catch (error) {
    console.error('Error updating favicon:', error);
  }
};
