import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#01287C' },
    secondary: { main: '#0A1F44' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { bgcolor: '#f5f8fc' },
        html: { bgcolor: '#f5f8fc' },
      },
    },
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
