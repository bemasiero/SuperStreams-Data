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

const BASE = 'https://programacao.claro.com.br/gatekeeper';
const EPG_DAYS = 7; // Claro's guide has real data out to at least 10 days; 7 is a comfortable week-ahead window.
const LOGO_SIZE = 256;

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

// Many channels share the same brand/placeholder SVG (165 unique logos across
// 274 Porto Alegre channels) — rasterize each source URL once, keyed by a
// hash of the URL, and let channels with the same logo point at the same PNG.
async function rasterizeLogos(svgURLs) {
    const pathByURL = new Map();
    fs.mkdirSync('logos', { recursive: true });

    for (const url of svgURLs) {
        const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
        const relPath = `logos/${hash}.png`;
        try {
            const svgBuffer = await fetchBuffer(url);
            await sharp(svgBuffer)
                .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .png()
                .toFile(relPath);
            pathByURL.set(url, relPath);
        } catch (error) {
            console.error(`⚠️ Logo rasterize failed for ${url}:`, error.message);
        }
    }
    return pathByURL;
}

async function run() {
    console.log("🚀 Starting Claro Lineup/EPG Scraper...");

    for (const city of CITIES) {
        console.log(`\n📡 City ${city.id} (${city.name})`);

        try {
            const channels = await fetchLineup(city.id);
            console.log(`📺 Fetched ${channels.length} channels`);

            const uniqueLogoURLs = [...new Set(channels.map(c => c.url_imagem).filter(Boolean))];
            const logoPathByURL = await rasterizeLogos(uniqueLogoURLs);
            console.log(`🖼️ Rasterized ${logoPathByURL.size}/${uniqueLogoURLs.length} unique logos`);

            const lineupChannels = channels.map(c => ({
                id: c.id_revel,
                channelNumber: c.cn_canal,
                name: c.nome,
                category: c.categoria,
                logoPath: logoPathByURL.get(c.url_imagem) || null,
            }));

            fs.mkdirSync('lineup', { recursive: true });
            fs.writeFileSync(
                path.join('lineup', `${city.id}.json`),
                JSON.stringify({ cityId: city.id, generatedAt: new Date().toISOString(), channels: lineupChannels }, null, 2)
            );
            console.log(`✅ Wrote lineup/${city.id}.json`);
        } catch (error) {
            console.error(`❌ Lineup fetch failed for city ${city.id}:`, error.message);
        }

        const epgDir = path.join('epg', city.id);
        fs.mkdirSync(epgDir, { recursive: true });

        for (let offset = 0; offset < EPG_DAYS; offset++) {
            const dateStr = isoDate(offset);
            try {
                const docs = await fetchEPGDay(city.id, dateStr);
                const programs = docs.map(d => ({
                    channelId: d.id_revel,
                    id: d.id_exibicao,
                    programId: d.id_programa,
                    title: d.titulo,
                    genre: d.genero || null,
                    start: fixClaroTimestamp(d.dh_inicio),
                    end: fixClaroTimestamp(d.dh_fim),
                }));
                fs.writeFileSync(
                    path.join(epgDir, `${dateStr}.json`),
                    JSON.stringify({ cityId: city.id, date: dateStr, generatedAt: new Date().toISOString(), programs }, null, 2)
                );
                console.log(`✅ Wrote epg/${city.id}/${dateStr}.json (${programs.length} programs)`);
            } catch (error) {
                console.error(`❌ EPG fetch failed for city ${city.id}, ${dateStr}:`, error.message);
            }
        }
    }
}

run();
