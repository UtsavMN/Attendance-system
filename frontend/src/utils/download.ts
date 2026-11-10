import { apiClient, API_BASE_URL } from '../api/client';

export const downloadAuthorizedFile = async (endpoint: string, filename: string) => {
  try {
    const res = await apiClient.get(endpoint, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('File download failed:', err);
    // Fallback: direct window open with query param token
    const token = localStorage.getItem('access_token');
    const separator = endpoint.includes('?') ? '&' : '?';
    const authUrl = `${API_BASE_URL}${endpoint}${separator}token=${token || ''}`;
    window.open(authUrl, '_blank');
  }
};

export const getAuthorizedUrl = (endpoint: string) => {
  const token = localStorage.getItem('access_token');
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${API_BASE_URL}${endpoint}${separator}token=${token || ''}`;
};
