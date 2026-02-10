import axios from 'axios';

const ANILIST_BASE = 'https://graphql.anilist.co';

export const anilistApi = {
  query: async (query: string, variables: any = {}) => {
    try {
      const response = await axios.post(ANILIST_BASE, {
        query,
        variables
      });
      return response.data;
    } catch (error) {
      console.error('AniList API Error:', error);
      return null;
    }
  },

  search: async (search: string, type: 'ANIME' | 'MANGA' = 'ANIME', allowAdult = false) => {
    const query = `
      query ($search: String, $type: MediaType, $isAdult: Boolean) {
        Page(page: 1, perPage: 20) {
          media(search: $search, type: $type, isAdult: $isAdult) {
            id
            isAdult
            title {
              romaji
              english
              native
            }
            startDate {
              year
              month
              day
            }
            status
            season
            seasonYear
            format
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            description
            averageScore
            popularity
            episodes
            chapters
            genres
            studios(isMain: true) {
              nodes {
                name
              }
            }
            trailer {
              id
              site
            }
          }
        }
      }
    `;
    const variables = { search, type, isAdult: allowAdult };
    return anilistApi.query(query, variables);
  },

  getInfo: async (id: number) => {
    const query = `
      query ($id: Int) {
        Media(id: $id) {
          id
          isAdult
          title {
            romaji
            english
            native
          }
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          status
          season
          seasonYear
          description(asHtml: false)
          type
          format
          episodes
          chapters
          duration
          genres
          averageScore
          popularity
          coverImage {
            extraLarge
            large
            color
          }
          bannerImage
          studios(isMain: true) {
            nodes {
              name
            }
          }
          characters(perPage: 6, sort: [ROLE, RELEVANCE]) {
            edges {
              role
              node {
                name {
                  full
                }
                image {
                  medium
                }
              }
            }
          }
          recommendations(perPage: 12, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  large
                }
              }
            }
          }
          trailer {
            id
            site
          }
          nextAiringEpisode {
            airingAt
            episode
          }
        }
      }
    `;
    const variables = { id };
    return anilistApi.query(query, variables);
  }
};
