const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const nativeFetch = globalThis.fetch;

function fetchWithUA(url) {
    return nativeFetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
}

function fetchJSON(url) {
    return fetchWithUA(url).then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status} for ${url}`);
        return res.json();
    });
}

function fetchBuffer(url) {
    return fetchWithUA(url).then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status} for ${url}`);
        return Buffer.from(await res.arrayBuffer());
    });
}

function readJSONIfExists(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

function hoursSince(isoString) {
    return (Date.now() - new Date(isoString).getTime()) / 3600000;
}

const BASE = 'https://programacao.claro.com.br/gatekeeper';
const EPG_WINDOW_DAYS = 2; // today + tomorrow only — see updateEPG for why
const LOGO_SIZE = 256;

// Single-user app, near-static source data: Claro's channel lineup rarely
// changes, so this throttles the expensive lineup+logo refresh to roughly
// once a week rather than re-fetching/re-rasterizing everything on every 4h
// sports-scraper tick (this script runs in the same job — see the
// workflow). `lineup/`, `epg/`, `logos/` are restored from an actions/cache
// between runs specifically so this staleness check has something to
// compare against; without that, every run would look like a cold start.
const LINEUP_MAX_AGE_HOURS = 7 * 24;

// Cities to publish a lineup/EPG snapshot for. Add more by id_cidade.
const CITIES = [
    { id: '46', name: 'porto_alegre' },
];

// Claro's dh_inicio/dh_fim carry a `Z` suffix but the wall-clock value is
// actually America/Sao_Paulo local time (UTC-3), not UTC — e.g. "Bom Dia Rio
// Grande" (a breakfast show) lists at 06:00Z, which only makes sense as 06:00
// local. Brazil has had no DST since 2019, so a flat +3h correction is safe
// year-round with no seasonal offset to track.
const SAO_PAULO_UTC_OFFSET_HOURS = 3;

function fixClaroTimestamp(raw) {
    const wallClock = new Date(raw); // parses the mislabeled "Z" as the literal wall-clock instant
    return new Date(wallClock.getTime() + SAO_PAULO_UTC_OFFSET_HOURS * 3600 * 1000).toISOString();
}

function isoDate(offsetDays) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

async function fetchLineup(cityId) {
    const url = `${BASE}/canal/select?q=id_cidade:${cityId}&rows=1000&wt=json&sort=cn_canal+asc` +
        `&fl=cn_canal+nome+categoria+id_revel+url_imagem+st_cidade&fq=nome:*`;
    const data = await fetchJSON(url);
    return data.response.docs;
}

async function fetchEPGDay(cityId, dateStr) {
    const url = `${BASE}/exibicao/select?q=id_cidade:${cityId}&wt=json&rows=20000&sort=dh_inicio+asc` +
        `&fl=id_revel+dh_inicio+dh_fim+titulo+genero+id_programa+id_exibicao` +
        `&fq=dh_inicio:%5B${dateStr}T00:00:00Z+TO+${dateStr}T23:59:00Z%5D`;
    const data = await fetchJSON(url);
    return data.response.docs;
}

async function rasterizeLogo(url) {
    const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
    const relPath = path.join('logos', `${hash}.png`);
    try {
        const svgBuffer = await fetchBuffer(url);
        await sharp(svgBuffer)
            .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(relPath);
        return relPath;
    } catch (error) {
        console.error(`⚠️ Logo rasterize failed for ${url}:`, error.message);
        return null;
    }
}

// Many channels share the same brand/placeholder SVG (165 unique logos
// across 274 Porto Alegre channels) — rasterize each source URL once.
async function updateLineup(cityId) {
    const lineupPath = path.join('lineup', `${cityId}.json`);
    const existing = readJSONIfExists(lineupPath);
    if (existing && hoursSince(existing.generatedAt) < LINEUP_MAX_AGE_HOURS) {
        console.log(`📺 Lineup for ${cityId} is fresh (${existing.channels.length} channels, ${hoursSince(existing.generatedAt).toFixed(1)}h old) — skipping`);
        return;
    }

    console.log(`📺 Refreshing lineup for city ${cityId}...`);
    const channels = await fetchLineup(cityId);
    console.log(`📺 Fetched ${channels.length} channels`);

    fs.mkdirSync('logos', { recursive: true });
    const uniqueLogoURLs = [...new Set(channels.map(c => c.url_imagem).filter(Boolean))];
    const logoPathByURL = new Map();
    for (const url of uniqueLogoURLs) {
        const relPath = await rasterizeLogo(url);
        if (relPath) logoPathByURL.set(url, relPath);
    }
    console.log(`🖼️ Rasterized ${logoPathByURL.size}/${uniqueLogoURLs.length} unique logos`);

    const lineupChannels = channels.map(c => ({
        id: c.id_revel,
        channelNumber: c.cn_canal,
        name: c.nome,
        category: c.categoria,
        logoPath: logoPathByURL.get(c.url_imagem) || null,
    }));

    fs.mkdirSync('lineup', { recursive: true });
    fs.writeFileSync(lineupPath, JSON.stringify({
        cityId, generatedAt: new Date().toISOString(), channels: lineupChannels,
    }, null, 2));
    console.log(`✅ Wrote ${lineupPath}`);

    // Prune logos no longer referenced by any channel, so removed/renamed
    // brand assets don't accumulate forever across weekly refreshes.
    const referenced = new Set(lineupChannels.map(c => c.logoPath).filter(Boolean).map(p => path.basename(p)));
    for (const file of fs.readdirSync('logos')) {
        if (!referenced.has(file)) {
            fs.unlinkSync(path.join('logos', file));
            console.log(`🗑️ Pruned unreferenced logo ${file}`);
        }
    }
}

// Maintains a rolling today+tomorrow window of date-named EPG files. A date
// fetches exactly once — the run it first enters the window as "tomorrow" —
// and is never touched again, including once it becomes "today": a 48h
// window is short enough that re-checking for drift (a live event running
// long, a schedule swap) isn't worth an extra request here. This makes the
// function idempotent and self-throttling with no time-based staleness
// check needed: "is a target date missing a file" is only ever true once
// per calendar day, whenever the window has actually advanced.
async function updateEPG(cityId) {
    const epgDir = path.join('epg', cityId);
    fs.mkdirSync(epgDir, { recursive: true });

    const targetDates = new Set(Array.from({ length: EPG_WINDOW_DAYS }, (_, i) => isoDate(i)));

    // Expire any file whose date has fallen out of the window.
    for (const file of fs.readdirSync(epgDir)) {
        const date = file.replace('.json', '');
        if (!targetDates.has(date)) {
            fs.unlinkSync(path.join(epgDir, file));
            console.log(`🗑️ Expired epg/${cityId}/${file}`);
        }
    }

    let fetchedAny = false;
    for (const date of targetDates) {
        const filePath = path.join(epgDir, `${date}.json`);
        if (fs.existsSync(filePath)) continue; // already have it, never re-fetch
        fetchedAny = true;

        try {
            const docs = await fetchEPGDay(cityId, date);
            const programs = docs.map(d => ({
                channelId: d.id_revel,
                id: d.id_exibicao,
                programId: d.id_programa,
                title: d.titulo,
                genre: d.genero || null,
                start: fixClaroTimestamp(d.dh_inicio),
                end: fixClaroTimestamp(d.dh_fim),
            }));
            fs.writeFileSync(filePath, JSON.stringify({
                cityId, date, generatedAt: new Date().toISOString(), programs,
            }, null, 2));
            console.log(`✅ Wrote epg/${cityId}/${date}.json (${programs.length} programs)`);
        } catch (error) {
            console.error(`❌ EPG fetch failed for city ${cityId}, ${date}:`, error.message);
        }
    }
    if (!fetchedAny) {
        console.log(`📅 EPG for ${cityId} already covers today+tomorrow — skipping`);
    }
}

async function run() {
    console.log("🚀 Starting Claro Lineup/EPG Scraper...");

    for (const city of CITIES) {
        console.log(`\n📡 City ${city.id} (${city.name})`);

        try {
            await updateLineup(city.id);
        } catch (error) {
            console.error(`❌ Lineup update failed for city ${city.id}:`, error.message);
        }

        try {
            await updateEPG(city.id);
        } catch (error) {
            console.error(`❌ EPG update failed for city ${city.id}:`, error.message);
        }
    }
}

run();
