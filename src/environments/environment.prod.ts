export const environment = {
  production: true,
  backendUrl: `${getBackendUrl()}`
};

function getBackendUrl(): string {
  const protocol = window.location.protocol; 
  const hostname = window.location.hostname;
  
  // No port for production, assuming default protocol ports (80/443)
  return `${protocol}//${hostname}/HRMS`;
}
