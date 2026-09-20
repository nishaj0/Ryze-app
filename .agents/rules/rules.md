// tailwind.config.js / NativeWind tokens
module.exports = {
  theme: {
    extend: {
      colors: {
        chalk: {
          bg: '#fcf9f3',          // Global canvas background
          card: '#ffffff',        // Elevated cards
          subtle: '#f6f3ed',      // Secondary containers / inactive pills
          dim: '#dcdad4',         // Borders & divider lines
        },
        terracotta: {
          DEFAULT: '#c24914',     // Primary interactive accent
          hover: '#a83e0f',
          soft: '#fbeee8',        // Terracotta tint for badges/icons
        },
        forest: {
          DEFAULT: '#2d6a4f',     // Success / PRs / completed checks
          soft: '#e8f5e9',
        },
        ink: {
          headline: '#1a1917',    // High-contrast headings (Outfit Bold)
          body: '#49453a',        // Secondary body text (Outfit Regular)
          muted: '#7a766c',       // Captions, units, timestamps
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
        'full': '9999px',
      }
    }
  }
}