const https = require('https');
const fs = require('fs');

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'SuperStreams-Scraper/1.0' } }, (res) => {
            if (res.statusCode >= 300) return reject(new Error(`Status ${res.statusCode}`));
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } 
                catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// Full matrix of supported leagues
const LEAGUES = [
    { sport: 'football', league: 'nfl' },
    { sport: 'football', league: 'college-football' },
    { sport: 'soccer', league: 'eng.1' }, // Premier League
    { sport: 'soccer', league: 'esp.1' }, // La Liga
    { sport: 'soccer', league: 'ger.1' }, // Bundesliga
    { sport: 'soccer', league: 'ita.1' }, // Serie A
    { sport: 'soccer', league: 'fra.1' }, // Ligue 1
    { sport: 'soccer', league: 'uefa.champions' },
    { sport: 'basketball', league: 'nba' },
    { sport: 'basketball', league: 'mens-college-basketball' },
    { sport: 'basketball', league: 'wnba' },
    { sport: 'baseball', league: 'mlb' },
    { sport: 'hockey', league: 'nhl' },
    { sport: 'racing', league: 'f1' },
    { sport: 'mma', league: 'ufc' },
    { sport: 'tennis', league: 'atp' }
];

async function run() {
    console.log("🚀 Starting Global Schedule Scraper...");
    let allEvents = [];

    for (const {sport, league} of LEAGUES) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
        console.log(`\n📡 Probing: ${sport.toUpperCase()} - ${league.toUpperCase()}`);
        
        try {
            const data = await fetch(url);
            
            const events = data.events || [];
            console.log(`📅 Found ${events.length} events.`);
            
            const leagueLogo = data.leagues?.[0]?.logos?.[0]?.href || '';
            
            for (const ev of events) {
                // Parse Event
                const competition = ev.competitions?.[0];
                if (!competition) continue;

                const homeCompetitor = competition.competitors?.find(c => c.homeAway === 'home');
                const awayCompetitor = competition.competitors?.find(c => c.homeAway === 'away');
                
                let title = ev.name;
                let homeTeam = homeCompetitor?.team?.displayName || '';
                let awayTeam = awayCompetitor?.team?.displayName || '';
                
                let homeLogo = homeCompetitor?.team?.logo || leagueLogo;
                let awayLogo = awayCompetitor?.team?.logo || '';
                
                // For competition sports (racing, mma, golf)
                if (!homeTeam && !awayTeam) {
                    homeTeam = ev.shortName || ''; 
                }

                allEvents.push({
                    id: ev.id,
                    sport: sport.toUpperCase(),
                    league: league.toUpperCase(),
                    title: title,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeLogo: homeLogo,
                    awayLogo: awayLogo,
                    startTime: ev.date,
                    status: ev.status.type.description
                });
            }

            // Sleep to respect rate limits
            await new Promise(r => setTimeout(r, 500));

        } catch (error) {
            console.error(`❌ Error fetching ${league}:`, error.message);
        }
    }
    
    fs.writeFileSync('schedule.json', JSON.stringify(allEvents, null, 2));
    console.log(`\n✅ Saved ${allEvents.length} total events to schedule.json!`);
}

run();
