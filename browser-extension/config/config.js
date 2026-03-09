/**
 * config.js
 * Global configuration for the Parla extension.
 * All URLs and endpoint paths are defined here — change them in one place only.
 */
const CONFIG = {

    backend: {
      url: 'http://localhost:8000',
      endpoints: {
        translate: '/translate',   // POST — translate a text
        phrases:   '/phrases/',    // GET / POST / DELETE — saved phrases
      }
    },
  
    extension: {
      debugMode: true,   // Set to false in production
    }
  
  };
  
  window.CONFIG = CONFIG;