import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'var(--tw-prose-body)',
            pre: {
              color: 'var(--tw-prose-pre-code)',
              backgroundColor: 'var(--tw-prose-pre-bg)',
              paddingTop: '0.75rem',
              paddingRight: '1rem',
              paddingBottom: '0.75rem',
              paddingLeft: '1rem',
              borderRadius: '0.375rem',
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            code: {
              color: 'var(--tw-prose-code)',
              borderRadius: '0.25rem',
              paddingTop: '0.125rem',
              paddingRight: '0.25rem',
              paddingBottom: '0.125rem',
              paddingLeft: '0.25rem',
              backgroundColor: 'var(--tw-prose-code-bg)',
            },
            'code::before': {
              content: '""'
            },
            'code::after': {
              content: '""'
            },
            'a:hover': {
              textDecoration: 'underline',
            },
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
