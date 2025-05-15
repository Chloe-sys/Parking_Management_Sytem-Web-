import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./src/**/*.{ts,tsx,js,jsx}",
		"./index.html",
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				'park-primary': '#31473A',
				'park-secondary': '#EDF4F2',
				'park-accent': '#4A6259',
				'park-light': '#F5F9F7',
				'park-dark': '#1A2B22',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: '#EDF4F2',
				foreground: '#31473A',
				primary: {
					DEFAULT: '#31473A',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#EDF4F2',
					foreground: '#31473A'
				},
				destructive: {
					DEFAULT: '#EF4444',
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: '#4A6259',
					foreground: '#FFFFFF'
				},
				accent: {
					DEFAULT: '#4A6259',
					foreground: '#FFFFFF'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#31473A'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#31473A'
				},
				sidebar: {
					DEFAULT: '#31473A',
					foreground: '#FFFFFF',
					primary: '#4A6259',
					'primary-foreground': '#FFFFFF',
					accent: '#EDF4F2',
					'accent-foreground': '#31473A',
					border: '#4A6259',
					ring: '#4A6259'
				},
				library: {
					green: '#344840',
					'light-green': '#4a6259',
					'light-bg': '#f0f4f1',
					gray: '#e2e2e2',
					blue: '#647b95',
					'light-blue': '#7a90a9',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [animate],
} satisfies Config;
