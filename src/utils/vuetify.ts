import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/js'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#00d4ff', // Cyan
          secondary: '#16213e', // Dark blue
          surface: '#16213e',
          background: '#1a1a2e', // Charcoal
          error: '#ff6b6b', // Red
          success: '#00d97e', // Green
          warning: '#ffa500', // Orange
          info: '#00d4ff', // Cyan
        },
      },
    },
  },
})
