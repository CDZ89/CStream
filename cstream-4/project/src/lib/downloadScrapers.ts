export async function get111477Downloads({ mediaItem, mediaType = 'movie' }: any) {
    const tmdbTitle = mediaItem?.title || mediaItem?.name;
    const releaseYear = mediaItem?.release_date?.slice(0, 4) || mediaItem?.first_air_date?.slice(0, 4) || '';
    const searchName = (tmdbTitle || '').replace(/:/g, ' - ');
    const listingUrl = (mediaType === 'tv' || mediaType === 'show' || mediaType === 'tvshow')
        ? 'https://a.111477.xyz/tvs/'
        : 'https://a.111477.xyz/movies/';

    try {
        const listingHtml = await fetch(listingUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        }).then(r => r.text());
        if (!listingHtml) return [];

        const parser = new DOMParser();
        const listingDoc = parser.parseFromString(listingHtml, 'text/html');
        const rows = listingDoc.querySelectorAll('tr[data-name][data-url]');

        let targetRow = Array.from(rows).find((row) => {
            const dataName = row.getAttribute('data-name') || '';
            const normalized = dataName.toLowerCase();
            return normalized.includes(searchName.toLowerCase()) && (!releaseYear || normalized.includes(releaseYear));
        });

        if (!targetRow) {
            targetRow = Array.from(rows).find((row) => {
                const dataName = row.getAttribute('data-name') || '';
                return dataName.toLowerCase().includes(searchName.toLowerCase());
            });
        }

        if (!targetRow) return [];

        const detailHref = targetRow.getAttribute('data-url');
        if (!detailHref) return [];

        let detailUrl = detailHref;
        if (detailUrl.startsWith('/')) detailUrl = `https://a.111477.xyz${detailUrl}`;
        else if (!detailUrl.startsWith('http')) detailUrl = `https://a.111477.xyz/${detailUrl}`;

        const detailHtml = await fetch(detailUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        }).then(r => r.text());
        if (!detailHtml) return [];

        const detailDoc = parser.parseFromString(detailHtml, 'text/html');
        const downloadNodes = detailDoc.querySelectorAll('a[href][class*="maxbutton"]');

        return Array.from(downloadNodes).map((node) => ({ url: node.getAttribute('href'), type: 'download', title: node.textContent || 'Download' }));
    } catch {
        return [];
    }
}

export async function getMovieboxDownloads({ tmdbId, mediaItem, mediaType = 'movie', season, episode }: any) {
    if (mediaType === 'tv' && (!season || !episode)) return [];

    const host = 'h5.aoneroom.com';
    const url = `https://${host}`;
    const headers = {
        'X-Client-Info': '{"timezone":"Africa/Nairobi"}',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept': 'application/json',
        'User-Agent': 'okhttp/4.12.0',
        'Referer': url,
        'Host': host,
        'Connection': 'keep-alive',
    };

    try {
        await fetch(`${url}/wefeed-h5-bff/app/get-latest-app-pkgs?app_name=moviebox`, { headers });

        const title = mediaItem?.title || mediaItem?.name || '';
        if (!title) return [];

        const searchData = await fetch(`${url}/wefeed-h5-bff/web/subject/search`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: title, page: 1, perPage: 24, subjectType: mediaType === 'tv' ? 2 : 1 })
        }).then(r => r.json());

        const searchResults = searchData?.data?.data || searchData?.data || searchData;
        const items = searchResults?.items || [];
        if (items.length === 0) return [];

        const selectedItem = items.find((item: any) => (item?.title || '').toLowerCase().includes(title.toLowerCase())) || items[0];
        const subjectId = String(selectedItem?.subjectId);
        if (!subjectId) return [];

        const detailData = await fetch(`${url}/wefeed-h5-bff/web/subject/detail?subjectId=${encodeURIComponent(subjectId)}`, {
            headers
        }).then(r => r.json());

        const info = detailData?.data?.data || detailData?.data || detailData;
        const detailPath = info?.subject?.detailPath || '';

        const params = new URLSearchParams({ subjectId });
        if (mediaType === 'tv') {
            if (season) params.set('se', String(season));
            if (episode) params.set('ep', String(episode));
        }

        const sourcesData = await fetch(`${url}/wefeed-h5-bff/web/subject/download?${params.toString()}`, {
            headers: {
                ...headers,
                'Referer': `https://fmoviesunblocked.net/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail`,
                'Origin': 'https://fmoviesunblocked.net'
            }
        }).then(r => r.json());

        const sources = sourcesData?.data?.data || sourcesData?.data || sourcesData;
        const downloads = sources?.downloads || [];
        if (downloads.length === 0) return [];

        const mp4Downloads = downloads
            .filter((d: any) => {
                const downloadUrl = d?.url;
                if (!downloadUrl || typeof downloadUrl !== 'string') return false;
                return !downloadUrl.includes('.m3u8') && (downloadUrl.includes('.mp4') || downloadUrl.match(/\.(mp4|mkv|avi|webm)$/i));
            })
            .sort((a: any, b: any) => (b.resolution || 0) - (a.resolution || 0));

        return mp4Downloads.map((download: any) => ({ title: `${title}${download.resolution ? ` - ${download.resolution}p` : ''}`, url: download.url, type: 'download' }));
    } catch {
        return [];
    }
}

export async function getMoviesmodDownloads({ imdbId, mediaType = 'movie' }: any) {
    if (mediaType !== 'movie') return [];

    try {
        const searchUrl = `https://moviesmod.cards/search/${encodeURIComponent(imdbId)}`;
        const searchHtml = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        }).then(r => r.text());
        if (!searchHtml) return [];

        const parser = new DOMParser();
        const searchDoc = parser.parseFromString(searchHtml, 'text/html');
        const linkEl = searchDoc.querySelector('.post-cards .title a[href]');
        if (!linkEl) return [];

        const targetHref = linkEl.getAttribute('href');
        if (!targetHref) return [];
        let normalizedUrl = targetHref;
        if (normalizedUrl.startsWith('/')) normalizedUrl = `https://moviesmod.cards${normalizedUrl}`;
        else if (!normalizedUrl.startsWith('http')) normalizedUrl = `https://moviesmod.cards/${normalizedUrl}`;

        const pageHtml = await fetch(normalizedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        }).then(r => r.text());
        if (!pageHtml) return [];

        const pageDoc = parser.parseFromString(pageHtml, 'text/html');
        const downloadNodes = pageDoc.querySelectorAll('a.maxbutton-download-links[href]');

        return Array.from(downloadNodes).map((node) => ({ url: `/ugw?url=${encodeURIComponent(node.getAttribute('href') || '')}`, type: 'download', title: node.textContent || 'Download' }));
    } catch {
        return [];
    }
}

export async function getT4tsaDownloads({ imdbId, mediaItem, mediaType = 'movie' }: any) {
    if (mediaType !== 'tv') return [];

    try {
        const url = `https://api.t4tsa.cc/get-series/?imdb_id=${imdbId}`;
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        if (data.success && data.invite_link) {
            return [{ title: mediaItem?.name || 'T4TSA Download', url: data.invite_link, type: 'download' }];
        }
    } catch {
        return [];
    }
    return [];
}

export async function getVidzeeDownloads(tmdbId: any, mediaType = 'movie', name?: string) {
    if (mediaType !== 'movie') return [];
    if (!tmdbId) return [];

    const results = [];
    const seen = new Set();

    for (let i = 1; i <= 5; i++) {
        try {
            const url = `https://dl.vidzee.wtf/download/movie/v${i}/${tmdbId}`;
            const response = await fetch(url, { headers: { referer: 'https://dl.vidzee.wtf/' } });

            if (!response.ok) continue;

            const data = await response.json();
            if (data.status === 'success' && Array.isArray(data.download_links)) {
                data.download_links.forEach((link: any) => {
                    if (!link.url || seen.has(link.url)) return;
                    seen.add(link.url);

                    results.push({ title: link.name ? link.name.replace(/{/g, '[').replace(/}/g, ']') : `VidZee Link ${i}`, url: link.url, type: 'download' });
                });
            }
        } catch (error) { continue; }
    }

    return results;
}

export async function getAgDownloads({ tmdbId, mediaItem, mediaType = 'movie' }: any) {
    if (!tmdbId) return [];

    try {
        const baseUrl = 'https://xuzfdkkkklmrilcitsec.supabase.co/rest/v1';
        // This API key should be injected securely; for testing, we use the user provided one or bypass if not available
        const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';
        const headers = { 'apikey': apikey, 'Authorization': `Bearer ${apikey}`, 'Content-Type': 'application/json' };

        const table = mediaType === 'tv' ? 'tv_shows' : 'movies';
        const res = await fetch(`${baseUrl}/${table}?tmdb_id=eq.${tmdbId}`, { headers });

        const response = await res.json().catch(() => []);
        const downloadUrl = response[0]?.download_url;
        if (!downloadUrl) return [];

        const title = mediaItem?.title || mediaItem?.name || '';
        const releaseYear = mediaItem?.release_date?.slice(0, 4) || mediaItem?.first_air_date?.slice(0, 4) || '';
        const displayTitle = releaseYear && title ? `${title} (${releaseYear})` : title || 'AG Download';

        return [{ title: displayTitle, url: downloadUrl, type: 'download' }];
    } catch {
        return [];
    }
}

export async function getMadplayDownloads({ mediaItem, mediaType = 'movie' }: any) {
    const title = mediaItem?.title || mediaItem?.name || '';
    if (!title) return [];

    const releaseYear = mediaItem?.release_date?.slice(0, 4) || mediaItem?.first_air_date?.slice(0, 4) || '';
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    try {
        const response = await fetch(`https://madplay.site/api/filmyfly?search=${encodeURIComponent(title)}`, {
            headers: { 'User-Agent': UA }
        }).then(r => r.json());

        if (!Array.isArray(response)) return [];

        const baseTitle = releaseYear && title ? `${title} (${releaseYear})` : title;
        const titleLower = title.toLowerCase();
        const allDownloads: any[] = [];

        for (const item of response.filter((item: any) => {
            if (!item?.title || !item?.url) return false;
            const itemTitle = item.title.toLowerCase();
            return itemTitle.includes(titleLower) && (!releaseYear || itemTitle.includes(releaseYear));
        })) {
            try {
                const downloads = await fetch(item.url, {
                    headers: { 'User-Agent': UA }
                }).then(r => r.json());

                if (!Array.isArray(downloads)) continue;

                for (const download of downloads) {
                    if (!download?.url) continue;
                    allDownloads.push({ title: download.title || baseTitle, url: download.url, type: 'download' });
                }
            } catch (err) { continue; }
        }

        return allDownloads;
    } catch {
        return [];
    }
}
