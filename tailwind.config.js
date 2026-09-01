/** @type {import('tailwindcss').Config} */
export default {
    // hover: utilities apply only on devices that can actually hover — on
    // touch, tapped elements otherwise keep their hover state stuck on.
    future: { hoverOnlyWhenSupported: true },
    darkMode: ['class'],
    content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			roboto: [
  				'"Roboto Condensed"',
  				'sans-serif'
  			],
  			oswald: [
  				'"Oswald"',
  				'sans-serif'
  			]
  		},
  		clipPath: {
  			'hero-left-default': 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)',
  			'hero-left-hover': 'polygon(0% 0%, 70% 0%, 100% 100%, 0% 100%)',
  			'hero-right-default': 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
  			'hero-right-hover': 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [
    require('tailwind-clip-path'),
      require("tailwindcss-animate")
],
}