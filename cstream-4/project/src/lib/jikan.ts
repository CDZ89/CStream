import axios from 'axios';

const JIKAN_BASE = 'https://api.jikan.moe/v4';

export const jikanApi = {
  anime: {
    search: async (query: string, allowAdult = false) => {
      try {
        const endpoint = allowAdult ? `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}` : `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&sfw`;
        const { data } = await axios.get(endpoint);
        
        // Filter out adult content if not allowed
        if (!allowAdult && data.data) {
          data.data = data.data.filter((anime: any) => !anime.rating || !anime.rating.includes('Rx'));
        }
        
        return data;
      } catch (error) {
        console.error('Jikan search error:', error);
        return { data: [] };
      }
    },
    getUpcoming: async (allowAdult = false) => {
      try {
        const endpoint = allowAdult ? `${JIKAN_BASE}/seasons/upcoming?limit=50` : `${JIKAN_BASE}/seasons/upcoming?limit=50&filter=sfw`;
        const { data } = await axios.get(endpoint);
        
        // Filter out adult content if not allowed
        if (!allowAdult && data.data) {
          data.data = data.data.filter((anime: any) => !anime.rating || !anime.rating.includes('Rx'));
        }
        
        return data;
      } catch (error) {
        console.error('Jikan upcoming error:', error);
        return { data: [] };
      }
    },
    info: async (id: number) => {
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/full`);
        return data;
      } catch (error) {
        console.error('Jikan info error:', error);
        return null;
      }
    },
    episodes: async (id: number) => {
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/episodes`);
        return data;
      } catch (error) {
        console.error('Jikan episodes error:', error);
        return { data: [] };
      }
    },
    recommendations: async (id: number) => {
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/recommendations`);
        return data;
      } catch (error) {
        console.error('Jikan recommendations error:', error);
        return { data: [] };
      }
    }
  },
  manga: {
    search: async (query: string) => {
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/manga?q=${encodeURIComponent(query)}&sfw`);
        return data;
      } catch (error) {
        console.error('Jikan manga search error:', error);
        return { data: [] };
      }
    },
    info: async (id: number) => {
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/full`);
        return data;
      } catch (error) {
        console.error('Jikan manga info error:', error);
        return null;
      }
    },
    recommendations: async (id: number) => {
      try {
        const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/recommendations`);
        return data;
      } catch (error) {
        console.error('Jikan manga recommendations error:', error);
        return { data: [] };
      }
    }
  }
};
