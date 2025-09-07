import axios from 'axios';

axios.defaults.withCredentials = true;

// Add a response interceptor
axios.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response && error.response.status === 401) {
      // User is not authenticated, clear local storage and redirect to login
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Redirect to login page, preventing a redirect loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;