const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function randomHex(bytes: number) {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function resolveHexa({ tmdbId, mediaType = 'movie', season, episode }: any) {
    const key = randomHex(32);
    const apiUrl =
        mediaType === 'tv'
            ? `https://themoviedb.hexa.su/api/tmdb/tv/${tmdbId}/season/${season}/episode/${episode}/images`
            : `https://themoviedb.hexa.su/api/tmdb/movie/${tmdbId}/images`;

    const encrypted = await fetch(apiUrl, { headers: { 'X-Api-Key': key } }).then((r) => r.text());
    const decrypted = await fetch('https://enc-dec.app/api/dec-hexa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: encrypted, key }),
    }).then((r) => r.json());

    const data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
    return { url: data.sources[0].url, headers: {}, type: 'hls' };
}

export async function resolveYFlix({ tmdbId, mediaType = 'movie', season, episode }: any) {
    const findUrl = `https://enc-dec.app/db/flix/find?tmdb_id=${encodeURIComponent(String(tmdbId))}&type=${encodeURIComponent(String(mediaType))}`;
    const find = await fetch(findUrl).then((r) => r.json());
    const contentId = find?.[0]?.info?.flix_id;
    if (!contentId) throw new Error('flix_id not found');

    const encrypt = async (text: string) => await fetch(`https://enc-dec.app/api/enc-movies-flix?text=${encodeURIComponent(String(text))}`).then((r) => r.json());
    const decrypt = async (text: string) => await fetch('https://enc-dec.app/api/dec-movies-flix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    }).then((r) => r.json());

    const encId = await encrypt(contentId);
    const episodesResp = await fetch(`https://solarmovie.fi/ajax/episodes/list?id=${encodeURIComponent(String(contentId))}&_=${encodeURIComponent(encId)}`).then((r) => r.json());
    const episodesHtml = episodesResp?.result;
    if (!episodesHtml) throw new Error('Missing episodes html');

    const episodes = await fetch('https://enc-dec.app/api/parse-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: episodesHtml }),
    }).then((r) => r.json());
    const episodesObj = typeof episodes === 'string' ? JSON.parse(episodes) : episodes;

    let eid = null;
    if (mediaType === 'tv') {
        eid = episodesObj?.[String(season)]?.[String(episode)]?.eid;
        if (!eid) throw new Error('Episode eid not found');
    }

    const encEid = eid ? await encrypt(eid) : null;
    const serversResp = await fetch(eid
        ? `https://solarmovie.fi/ajax/links/list?eid=${encodeURIComponent(String(eid))}&_=${encodeURIComponent(encEid)}`
        : `https://solarmovie.fi/ajax/links/list?eid=${encodeURIComponent(String(contentId))}&_=${encodeURIComponent(encId)}`
    ).then((r) => r.json());
    const serversHtml = serversResp?.result;
    if (!serversHtml) throw new Error('Missing servers html');

    const serversParsed = await fetch('https://enc-dec.app/api/parse-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: serversHtml }),
    }).then((r) => r.json());
    const serversObj: any = typeof serversParsed === 'string' ? JSON.parse(serversParsed) : serversParsed;
    const lid: string = serversObj?.default?.['1']?.lid || (Object.values(serversObj || {}).flatMap((v: any) => (v && typeof v === 'object' ? Object.values(v) : [])) as any[]).find((x: any) => x?.lid)?.lid;
    if (!lid) throw new Error('lid not found');

    const encLid = await encrypt(lid);
    const embedResp = await fetch(`https://solarmovie.fi/ajax/links/view?id=${encodeURIComponent(String(lid))}&_=${encodeURIComponent(encLid)}`).then((r) => r.json());
    const encryptedEmbed = embedResp?.result;
    if (!encryptedEmbed) throw new Error('Missing encrypted embed');

    const embedDecrypted = await decrypt(encryptedEmbed);
    const embedData = typeof embedDecrypted === 'string' ? JSON.parse(embedDecrypted) : embedDecrypted;
    const embedUrl = embedData?.url;
    if (!embedUrl) throw new Error('Missing embed url');

    const mediaUrl = embedUrl.replace('/e/', '/media/');
    const resp = await fetch(mediaUrl).then((r) => r.json());
    const encrypted = resp?.result;
    if (!encrypted) throw new Error('Missing encrypted result');

    const decrypted = await fetch('https://enc-dec.app/api/dec-rapid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: encrypted, agent: UA }),
    }).then((r) => r.json());
    const data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
    const file = data?.sources?.[0]?.file;
    if (!file) throw new Error('Missing sources[0].file');

    return { url: file, headers: { origin: 'https://rapidshare.cc', referer: 'https://rapidshare.cc/' }, type: 'hls' };
}

export async function resolveMovieBox({ tmdbId, mediaType = 'movie', season, episode, title }: any) {
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

    await fetch(`${url}/wefeed-h5-bff/app/get-latest-app-pkgs?app_name=moviebox`, { headers });
    const search = await fetch(`${url}/wefeed-h5-bff/web/subject/search`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: title, page: 1, perPage: 24, subjectType: mediaType === 'tv' ? 2 : 1 }),
    }).then((r) => r.json());

    const results = search?.data?.data || search?.data || search;
    const items = results?.items || [];
    if (items.length === 0) throw new Error('No search results');

    const selectedItem = items.find((item: any) => (item?.title || '').toLowerCase().includes(title.toLowerCase())) || items[0];
    const subjectId = String(selectedItem?.subjectId);
    if (!subjectId) throw new Error('subjectId not found');

    const detailData = await fetch(`${url}/wefeed-h5-bff/web/subject/detail?subjectId=${encodeURIComponent(subjectId)}`, { headers }).then((r) => r.json());
    const info = detailData?.data?.data || detailData?.data || detailData;
    const detailPath = info?.subject?.detailPath || '';

    const params = new URLSearchParams({ subjectId });
    if (mediaType === 'tv') {
        params.set('se', String(season));
        params.set('ep', String(episode));
    }

    const sourcesData = await fetch(`${url}/wefeed-h5-bff/web/subject/download?${params.toString()}`, {
        headers: {
            ...headers,
            'Referer': `https://fmoviesunblocked.net/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail`,
            'Origin': 'https://fmoviesunblocked.net'
        }
    }).then((r) => r.json());

    const sources = sourcesData?.data?.data || sourcesData?.data || sourcesData;
    const downloads = sources?.downloads || [];
    if (downloads.length === 0) throw new Error('No download sources');

    const sortedDownloads = downloads.filter((d: any) => d?.url && typeof d.url === 'string').sort((a: any, b: any) => (b.resolution || 0) - (a.resolution || 0));
    const videoUrl = sortedDownloads[0].url;

    return { url: videoUrl, headers: { 'User-Agent': 'okhttp/4.12.0', 'Referer': 'https://fmoviesunblocked.net/', 'Origin': 'https://fmoviesunblocked.net' }, type: videoUrl.includes('.m3u8') ? 'hls' : 'mp4' };
}

export async function resolveMadPlay({ tmdbId, mediaType = 'movie', season, episode }: any) {
    const url = mediaType === 'tv'
        ? `https://cdn.madplay.site/api/hls/unknown/${tmdbId}/season_${season}/episode_${episode}/master.m3u8`
        : `https://cdn.madplay.site/api/hls/unknown/${tmdbId}/master.m3u8`;

    try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
            return { url, headers: {}, type: 'hls' };
        }
    } catch (err) { }

    const apiUrl = mediaType === 'tv'
        ? `https://api.madplay.site/api/rogflix?id=${tmdbId}&season=${season}&episode=${episode}&type=series`
        : `https://api.madplay.site/api/rogflix?id=${tmdbId}&type=movie`;

    const data = await fetch(apiUrl, { headers: { 'User-Agent': UA } }).then((r) => r.json());
    if (Array.isArray(data) && data.length > 0) {
        const englishItem = data.find(item => item?.title === 'English');
        if (englishItem?.file) {
            return { url: englishItem.file, headers: {}, type: 'hls' };
        }
    }

    throw new Error('MadPlay: no sources found');
}

export async function resolveXPass({ tmdbId, mediaType = 'movie', season, episode }: any) {
    const apiUrl =
        mediaType === 'tv'
            ? `https://play.xpass.top/meg/tv/${tmdbId}/${season}/${episode}/playlist.json`
            : `https://play.xpass.top/feb/${tmdbId}/0/0/0/playlist.json`;

    const data = await fetch(apiUrl, {
        headers: { 'User-Agent': UA },
    }).then((r) => r.json());

    const file = data?.playlist?.[0]?.sources?.find((s: any) => s?.type === 'hls')?.file || data?.playlist?.[0]?.sources?.[0]?.file;
    if (!file) throw new Error('Missing playlist source');

    return { url: file, headers: { origin: 'https://play.xpass.top', referer: 'https://play.xpass.top/' }, type: 'hls' };
}
