
export type ThemeId = 'corporate' | 'minimal' | 'dark' | 'academic';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  styles: {
    radius: string;
    shadow: string;
  };
}

export const THEMES: Record<ThemeId, Theme> = {
  corporate: {
    id: 'corporate',
    name: 'Corporate Blue',
    colors: {
      primary: '#4338ca', // Indigo 700
      secondary: '#1e293b', // Slate 800
      accent: '#6366f1', // Indigo 500
      bg: '#f8fafc', // Slate 50
      surface: '#ffffff',
      text: '#0f172a', // Slate 900
      textMuted: '#64748b', // Slate 500
      border: '#e2e8f0', // Slate 200
    },
    fonts: {
      heading: '"Inter", sans-serif',
      body: '"Inter", sans-serif',
    },
    styles: {
      radius: '0.75rem', // rounded-xl
      shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    }
  },
  minimal: {
    id: 'minimal',
    name: 'Startup Minimal',
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#000000',
      bg: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      textMuted: '#666666',
      border: '#eeeeee',
    },
    fonts: {
      heading: '"Inter", sans-serif',
      body: '"Inter", sans-serif',
    },
    styles: {
      radius: '0px',
      shadow: 'none',
    }
  },
  dark: {
    id: 'dark',
    name: 'Midnight Pro',
    colors: {
      primary: '#818cf8', // Indigo 400
      secondary: '#ffffff',
      accent: '#6366f1',
      bg: '#0f172a', // Slate 900
      surface: '#1e293b', // Slate 800
      text: '#f8fafc', // Slate 50
      textMuted: '#94a3b8', // Slate 400
      border: '#334155', // Slate 700
    },
    fonts: {
      heading: '"Inter", sans-serif',
      body: '"Inter", sans-serif',
    },
    styles: {
      radius: '0.75rem',
      shadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
    }
  },
  academic: {
    id: 'academic',
    name: 'Academic Serif',
    colors: {
      primary: '#7c2d12', // Orange 900 (Leather)
      secondary: '#27272a', // Zinc 800
      accent: '#ea580c', // Orange 600
      bg: '#fffbf0', // Warm paper
      surface: '#ffffff',
      text: '#27272a', // Zinc 800
      textMuted: '#52525b', // Zinc 600
      border: '#e4e4e7', // Zinc 200
    },
    fonts: {
      heading: '"Merriweather", serif',
      body: '"Merriweather", serif',
    },
    styles: {
      radius: '0.25rem',
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    }
  }
};
