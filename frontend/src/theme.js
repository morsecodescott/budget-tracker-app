// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00ACC1',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#388E3C',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F9A825',
      contrastText: '#212121',
    },
    info: {
      main: '#1976D2',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 500 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    linkText: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#212121', 
      cursor: 'pointer',
      '&:hover': {
        textDecoration: 'underline',
        color: '#007C91', // Slightly darker shade
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: 'linkText' },
          style: {
            textDecoration: 'none',
          },
        },
      ],
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#00ACC1', // secondary.main
          textDecoration: 'none',
          fontWeight: 500,
          '&:hover': {
            textDecoration: 'underline',
            color: '#007C91', // Slightly darker shade
          },
          '&:focus': {
            outline: '2px solid #00ACC1',
          },
        },
      },
    },  
  },
});

export default theme;
