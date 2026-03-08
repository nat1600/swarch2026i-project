const CONFIG = {
    backend: {
      url: 'http://localhost:8000',
      endpoints: {
        translate: '/translate',
        phrases: '/phrases/',
      }
    },
    extension: {
      debugMode: true,
    }
  };
  
  window.CONFIG = CONFIG;