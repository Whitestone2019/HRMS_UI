export const environment = {
  production: false,
  backendUrl: `${getBackendUrl()}`,
  apiKey: 'Wh!te$t@Ne' // Add your API key here
};

function getBackendUrl(): string {
  const protocol = window.location.protocol; // e.g., 'http:'
  const hostname = window.location.hostname; // e.g., 'example.com'
  const port = window.location.port;         // e.g., '4200'
  
  // Customize backend port if different from frontend
  const backendPort = '8088'; // Replace with your backend port
  return `${protocol}//${hostname}:${backendPort}/HRMS`;
}
