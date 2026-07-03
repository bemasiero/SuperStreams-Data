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
    {
        "sport": "football",
        "league": "nfl"
    },
    {
        "sport": "football",
        "league": "college-football"
    },
    {
        "sport": "basketball",
        "league": "nba"
    },
    {
        "sport": "basketball",
        "league": "mens-college-basketball"
    },
    {
        "sport": "basketball",
        "league": "wnba"
    },
    {
        "sport": "basketball",
        "league": "womens-college-basketball"
    },
    {
        "sport": "basketball",
        "league": "fiba"
    },
    {
        "sport": "basketball",
        "league": "nba-development"
    },
    {
        "sport": "basketball",
        "league": "mens-olympics-basketball"
    },
    {
        "sport": "basketball",
        "league": "womens-olympics-basketball"
    },
    {
        "sport": "baseball",
        "league": "mlb"
    },
    {
        "sport": "baseball",
        "league": "world-baseball-classic"
    },
    {
        "sport": "baseball",
        "league": "caribbean-series"
    },
    {
        "sport": "baseball",
        "league": "olympics-baseball"
    },
    {
        "sport": "baseball",
        "league": "college-baseball"
    },
    {
        "sport": "baseball",
        "league": "college-softball"
    },
    {
        "sport": "hockey",
        "league": "nhl"
    },
    {
        "sport": "hockey",
        "league": "hockey-world-cup"
    },
    {
        "sport": "hockey",
        "league": "mens-college-hockey"
    },
    {
        "sport": "hockey",
        "league": "womens-college-hockey"
    },
    {
        "sport": "hockey",
        "league": "olympics-mens-ice-hockey"
    },
    {
        "sport": "hockey",
        "league": "olympics-womens-ice-hockey"
    },
    {
        "sport": "racing",
        "league": "f1"
    },
    {
        "sport": "racing",
        "league": "irl"
    },
    {
        "sport": "racing",
        "league": "nascar-premier"
    },
    {
        "sport": "racing",
        "league": "nascar-secondary"
    },
    {
        "sport": "racing",
        "league": "nascar-truck"
    },
    {
        "sport": "mma",
        "league": "ufc"
    },
    {
        "sport": "mma",
        "league": "bellator"
    },
    {
        "sport": "mma",
        "league": "pfl"
    },
    {
        "sport": "mma",
        "league": "ofc"
    },
    {
        "sport": "mma",
        "league": "ifc"
    },
    {
        "sport": "mma",
        "league": "cage-warriors"
    },
    {
        "sport": "mma",
        "league": "ksw"
    },
    {
        "sport": "mma",
        "league": "rizin"
    },
    {
        "sport": "tennis",
        "league": "atp"
    },
    {
        "sport": "tennis",
        "league": "wta"
    },
    {
        "sport": "golf",
        "league": "pga"
    },
    {
        "sport": "golf",
        "league": "liv"
    },
    {
        "sport": "golf",
        "league": "eur"
    },
    {
        "sport": "golf",
        "league": "lpga"
    },
    {
        "sport": "golf",
        "league": "champions-tour"
    },
    {
        "sport": "golf",
        "league": "mens-olympics-golf"
    },
    {
        "sport": "golf",
        "league": "womens-olympics-golf"
    },
    {
        "sport": "soccer",
        "league": "fifa.world"
    },
    {
        "sport": "soccer",
        "league": "fifa.wwc"
    },
    {
        "sport": "soccer",
        "league": "uefa.champions"
    },
    {
        "sport": "soccer",
        "league": "eng.1"
    },
    {
        "sport": "soccer",
        "league": "eng.fa"
    },
    {
        "sport": "soccer",
        "league": "eng.league_cup"
    },
    {
        "sport": "soccer",
        "league": "esp.1"
    },
    {
        "sport": "soccer",
        "league": "esp.super_cup"
    },
    {
        "sport": "soccer",
        "league": "esp.copa_del_rey"
    },
    {
        "sport": "soccer",
        "league": "ger.1"
    },
    {
        "sport": "soccer",
        "league": "ger.playoff.relegation"
    },
    {
        "sport": "soccer",
        "league": "ger.dfb_pokal"
    },
    {
        "sport": "soccer",
        "league": "usa.1"
    },
    {
        "sport": "soccer",
        "league": "concacaf.leagues.cup"
    },
    {
        "sport": "soccer",
        "league": "campeones.cup"
    },
    {
        "sport": "soccer",
        "league": "fifa.shebelieves"
    },
    {
        "sport": "soccer",
        "league": "fifa.w.champions_cup"
    },
    {
        "sport": "soccer",
        "league": "uefa.wchampions"
    },
    {
        "sport": "soccer",
        "league": "usa.nwsl"
    },
    {
        "sport": "soccer",
        "league": "usa.nwsl.cup"
    },
    {
        "sport": "soccer",
        "league": "uefa.europa"
    },
    {
        "sport": "soccer",
        "league": "uefa.europa.conf"
    },
    {
        "sport": "soccer",
        "league": "fifa.friendly"
    },
    {
        "sport": "soccer",
        "league": "mex.1"
    },
    {
        "sport": "soccer",
        "league": "ita.1"
    },
    {
        "sport": "soccer",
        "league": "ita.coppa_italia"
    },
    {
        "sport": "soccer",
        "league": "fra.1"
    },
    {
        "sport": "soccer",
        "league": "fra.super_cup"
    },
    {
        "sport": "soccer",
        "league": "ita.super_cup"
    },
    {
        "sport": "soccer",
        "league": "ger.super_cup"
    },
    {
        "sport": "soccer",
        "league": "eng.w.1"
    },
    {
        "sport": "soccer",
        "league": "eng.2"
    },
    {
        "sport": "soccer",
        "league": "eng.w.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "eng.charity"
    },
    {
        "sport": "soccer",
        "league": "ned.1"
    },
    {
        "sport": "soccer",
        "league": "por.1"
    },
    {
        "sport": "soccer",
        "league": "fra.coupe_de_france"
    },
    {
        "sport": "soccer",
        "league": "usa.open"
    },
    {
        "sport": "soccer",
        "league": "ksa.1"
    },
    {
        "sport": "soccer",
        "league": "conmebol.libertadores"
    },
    {
        "sport": "soccer",
        "league": "concacaf.champions"
    },
    {
        "sport": "soccer",
        "league": "fifa.worldq.uefa"
    },
    {
        "sport": "soccer",
        "league": "fifa.wcq.ply"
    },
    {
        "sport": "soccer",
        "league": "fifa.worldq.concacaf"
    },
    {
        "sport": "soccer",
        "league": "fifa.worldq.afc"
    },
    {
        "sport": "soccer",
        "league": "fifa.worldq.caf"
    },
    {
        "sport": "soccer",
        "league": "fifa.worldq.conmebol"
    },
    {
        "sport": "soccer",
        "league": "fifa.worldq.ofc"
    },
    {
        "sport": "soccer",
        "league": "uefa.nations"
    },
    {
        "sport": "soccer",
        "league": "fifa.friendly.w"
    },
    {
        "sport": "soccer",
        "league": "fifa.wworldq.uefa"
    },
    {
        "sport": "soccer",
        "league": "fifa.wwcq.ply"
    },
    {
        "sport": "soccer",
        "league": "uefa.w.nations"
    },
    {
        "sport": "soccer",
        "league": "eng.w.fa"
    },
    {
        "sport": "soccer",
        "league": "eng.w.league_cup"
    },
    {
        "sport": "soccer",
        "league": "esp.w.1"
    },
    {
        "sport": "soccer",
        "league": "esp.copa_de_la_reina"
    },
    {
        "sport": "soccer",
        "league": "fra.w.1"
    },
    {
        "sport": "soccer",
        "league": "usa.w.usl.1"
    },
    {
        "sport": "soccer",
        "league": "ned.cup"
    },
    {
        "sport": "soccer",
        "league": "sco.1"
    },
    {
        "sport": "soccer",
        "league": "sco.tennents"
    },
    {
        "sport": "soccer",
        "league": "sco.cis"
    },
    {
        "sport": "soccer",
        "league": "aus.1"
    },
    {
        "sport": "soccer",
        "league": "aus.w.1"
    },
    {
        "sport": "soccer",
        "league": "ksa.kings.cup"
    },
    {
        "sport": "soccer",
        "league": "por.taca.portugal"
    },
    {
        "sport": "soccer",
        "league": "tur.1"
    },
    {
        "sport": "soccer",
        "league": "caf.nations"
    },
    {
        "sport": "soccer",
        "league": "afc.champions"
    },
    {
        "sport": "soccer",
        "league": "afc.cup"
    },
    {
        "sport": "soccer",
        "league": "fifa.cwc"
    },
    {
        "sport": "soccer",
        "league": "fifa.olympics"
    },
    {
        "sport": "soccer",
        "league": "fifa.w.olympics"
    },
    {
        "sport": "soccer",
        "league": "concacaf.gold"
    },
    {
        "sport": "soccer",
        "league": "concacaf.gold_qual"
    },
    {
        "sport": "soccer",
        "league": "concacaf.w.gold"
    },
    {
        "sport": "soccer",
        "league": "concacaf.nations.league"
    },
    {
        "sport": "soccer",
        "league": "concacaf.confederations_playoff"
    },
    {
        "sport": "soccer",
        "league": "concacaf.w.champions_cup"
    },
    {
        "sport": "soccer",
        "league": "concacaf.womens.championship"
    },
    {
        "sport": "soccer",
        "league": "uefa.euro"
    },
    {
        "sport": "soccer",
        "league": "uefa.euroq"
    },
    {
        "sport": "soccer",
        "league": "uefa.weuro"
    },
    {
        "sport": "soccer",
        "league": "uefa.euro_u21"
    },
    {
        "sport": "soccer",
        "league": "global.finalissima"
    },
    {
        "sport": "soccer",
        "league": "global.u20.intercontinental_cup"
    },
    {
        "sport": "soccer",
        "league": "global.w.finalissima"
    },
    {
        "sport": "soccer",
        "league": "fifa.world.u20"
    },
    {
        "sport": "soccer",
        "league": "conmebol.america"
    },
    {
        "sport": "soccer",
        "league": "conmebol.america.femenina"
    },
    {
        "sport": "soccer",
        "league": "afc.asian.cup"
    },
    {
        "sport": "soccer",
        "league": "afc.w.asian.cup"
    },
    {
        "sport": "soccer",
        "league": "afc.cupq"
    },
    {
        "sport": "soccer",
        "league": "aff.championship"
    },
    {
        "sport": "soccer",
        "league": "caf.nations_qual"
    },
    {
        "sport": "soccer",
        "league": "caf.w.nations"
    },
    {
        "sport": "soccer",
        "league": "caf.championship"
    },
    {
        "sport": "soccer",
        "league": "caf.championship_qual"
    },
    {
        "sport": "soccer",
        "league": "usa.usl.1"
    },
    {
        "sport": "soccer",
        "league": "usa.usl.l1"
    },
    {
        "sport": "soccer",
        "league": "usa.usl.l1.cup"
    },
    {
        "sport": "soccer",
        "league": "mex.2"
    },
    {
        "sport": "soccer",
        "league": "can.w.nsl"
    },
    {
        "sport": "soccer",
        "league": "uefa.champions_qual"
    },
    {
        "sport": "soccer",
        "league": "uefa.europa_qual"
    },
    {
        "sport": "soccer",
        "league": "uefa.europa.conf_qual"
    },
    {
        "sport": "soccer",
        "league": "uefa.wchampions_qual"
    },
    {
        "sport": "soccer",
        "league": "uefa.w.europa"
    },
    {
        "sport": "soccer",
        "league": "uefa.super_cup"
    },
    {
        "sport": "soccer",
        "league": "fifa.intercontinental_cup"
    },
    {
        "sport": "soccer",
        "league": "nonfifa"
    },
    {
        "sport": "soccer",
        "league": "rus.1"
    },
    {
        "sport": "soccer",
        "league": "rus.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "bel.1"
    },
    {
        "sport": "soccer",
        "league": "bel.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "esp.2"
    },
    {
        "sport": "soccer",
        "league": "ger.2"
    },
    {
        "sport": "soccer",
        "league": "ita.2"
    },
    {
        "sport": "soccer",
        "league": "fra.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "fra.2"
    },
    {
        "sport": "soccer",
        "league": "por.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "aut.1"
    },
    {
        "sport": "soccer",
        "league": "gre.1"
    },
    {
        "sport": "soccer",
        "league": "chn.1"
    },
    {
        "sport": "soccer",
        "league": "global.club_challenge"
    },
    {
        "sport": "soccer",
        "league": "ned.supercup"
    },
    {
        "sport": "soccer",
        "league": "club.friendly"
    },
    {
        "sport": "soccer",
        "league": "global.pinatar_cup"
    },
    {
        "sport": "soccer",
        "league": "friendly.emirates_cup"
    },
    {
        "sport": "soccer",
        "league": "esp.joan_gamper"
    },
    {
        "sport": "soccer",
        "league": "jpn.world_challenge"
    },
    {
        "sport": "soccer",
        "league": "global.arnold.clark_cup"
    },
    {
        "sport": "soccer",
        "league": "fifa.conmebol.olympicsq"
    },
    {
        "sport": "soccer",
        "league": "fifa.concacaf.olympicsq"
    },
    {
        "sport": "soccer",
        "league": "fifa.w.concacaf.olympicsq"
    },
    {
        "sport": "soccer",
        "league": "fifa.world.u17"
    },
    {
        "sport": "soccer",
        "league": "fifa.wworld.u17"
    },
    {
        "sport": "soccer",
        "league": "uefa.euro_u21_qual"
    },
    {
        "sport": "soccer",
        "league": "uefa.euro.u19"
    },
    {
        "sport": "soccer",
        "league": "global.toulon"
    },
    {
        "sport": "soccer",
        "league": "fifa.friendly_u21"
    },
    {
        "sport": "soccer",
        "league": "ger.2.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "eng.trophy"
    },
    {
        "sport": "soccer",
        "league": "eng.3"
    },
    {
        "sport": "soccer",
        "league": "eng.4"
    },
    {
        "sport": "soccer",
        "league": "eng.5"
    },
    {
        "sport": "soccer",
        "league": "sco.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "sco.2"
    },
    {
        "sport": "soccer",
        "league": "sco.2.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "sco.challenge"
    },
    {
        "sport": "soccer",
        "league": "ned.playoff.relegation"
    },
    {
        "sport": "soccer",
        "league": "ned.2"
    },
    {
        "sport": "soccer",
        "league": "ned.3.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "ned.w.knvb_cup"
    },
    {
        "sport": "soccer",
        "league": "ned.w.1"
    },
    {
        "sport": "soccer",
        "league": "swe.1"
    },
    {
        "sport": "soccer",
        "league": "swe.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "den.1"
    },
    {
        "sport": "soccer",
        "league": "nor.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "nor.1"
    },
    {
        "sport": "soccer",
        "league": "conmebol.sudamericana"
    },
    {
        "sport": "soccer",
        "league": "conmebol.recopa"
    },
    {
        "sport": "soccer",
        "league": "arg.1"
    },
    {
        "sport": "soccer",
        "league": "arg.copa"
    },
    {
        "sport": "soccer",
        "league": "arg.copa_de_la_superliga"
    },
    {
        "sport": "soccer",
        "league": "arg.trofeo_de_la_campeones"
    },
    {
        "sport": "soccer",
        "league": "arg.2"
    },
    {
        "sport": "soccer",
        "league": "arg.supercopa"
    },
    {
        "sport": "soccer",
        "league": "arg.supercopa.internacional"
    },
    {
        "sport": "soccer",
        "league": "arg.3"
    },
    {
        "sport": "soccer",
        "league": "bra.supercopa_do_brazil"
    },
    {
        "sport": "soccer",
        "league": "bra.1"
    },
    {
        "sport": "soccer",
        "league": "bra.2"
    },
    {
        "sport": "soccer",
        "league": "bra.copa_do_brazil"
    },
    {
        "sport": "soccer",
        "league": "bra.camp.carioca"
    },
    {
        "sport": "soccer",
        "league": "bra.camp.paulista"
    },
    {
        "sport": "soccer",
        "league": "bra.camp.gaucho"
    },
    {
        "sport": "soccer",
        "league": "bra.camp.mineiro"
    },
    {
        "sport": "soccer",
        "league": "chi.super_cup"
    },
    {
        "sport": "soccer",
        "league": "chi.1"
    },
    {
        "sport": "soccer",
        "league": "chi.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "chi.copa_chi"
    },
    {
        "sport": "soccer",
        "league": "uru.1"
    },
    {
        "sport": "soccer",
        "league": "uru.2"
    },
    {
        "sport": "soccer",
        "league": "col.superliga"
    },
    {
        "sport": "soccer",
        "league": "col.1"
    },
    {
        "sport": "soccer",
        "league": "col.copa"
    },
    {
        "sport": "soccer",
        "league": "per.1"
    },
    {
        "sport": "soccer",
        "league": "par.1"
    },
    {
        "sport": "soccer",
        "league": "par.1.supercopa"
    },
    {
        "sport": "soccer",
        "league": "ecu.1"
    },
    {
        "sport": "soccer",
        "league": "ven.1"
    },
    {
        "sport": "soccer",
        "league": "bol.ply.rel"
    },
    {
        "sport": "soccer",
        "league": "bol.copa"
    },
    {
        "sport": "soccer",
        "league": "bol.1"
    },
    {
        "sport": "soccer",
        "league": "jpn.1"
    },
    {
        "sport": "soccer",
        "league": "mex.campeon"
    },
    {
        "sport": "soccer",
        "league": "concacaf.central.american.cup"
    },
    {
        "sport": "soccer",
        "league": "concacaf.champions_cup"
    },
    {
        "sport": "soccer",
        "league": "concacaf.u23"
    },
    {
        "sport": "soccer",
        "league": "hon.1"
    },
    {
        "sport": "soccer",
        "league": "crc.1"
    },
    {
        "sport": "soccer",
        "league": "gua.1"
    },
    {
        "sport": "soccer",
        "league": "afc.cup_qual"
    },
    {
        "sport": "soccer",
        "league": "slv.1"
    },
    {
        "sport": "soccer",
        "league": "fifa.intercontinental.cup"
    },
    {
        "sport": "soccer",
        "league": "afc.saff.championship"
    },
    {
        "sport": "soccer",
        "league": "chn.1.promotion.relegation"
    },
    {
        "sport": "soccer",
        "league": "ind.1"
    },
    {
        "sport": "soccer",
        "league": "ind.2"
    },
    {
        "sport": "soccer",
        "league": "global.gulf_cup"
    },
    {
        "sport": "soccer",
        "league": "bangabandhu.cup"
    },
    {
        "sport": "soccer",
        "league": "caf.cosafa"
    },
    {
        "sport": "soccer",
        "league": "caf.champions"
    },
    {
        "sport": "soccer",
        "league": "caf.confed"
    },
    {
        "sport": "soccer",
        "league": "rsa.1"
    },
    {
        "sport": "soccer",
        "league": "usa.ncaa.m.1"
    },
    {
        "sport": "soccer",
        "league": "usa.ncaa.w.1"
    },
    {
        "sport": "rugby",
        "league": "164205"
    },
    {
        "sport": "rugby",
        "league": "180659"
    },
    {
        "sport": "rugby",
        "league": "244293"
    },
    {
        "sport": "rugby",
        "league": "242041"
    },
    {
        "sport": "rugby",
        "league": "289262"
    },
    {
        "sport": "rugby",
        "league": "289234"
    },
    {
        "sport": "rugby",
        "league": "267979"
    },
    {
        "sport": "rugby",
        "league": "270559"
    },
    {
        "sport": "rugby",
        "league": "270557"
    },
    {
        "sport": "rugby",
        "league": "271937"
    },
    {
        "sport": "rugby",
        "league": "282"
    },
    {
        "sport": "rugby",
        "league": "283"
    },
    {
        "sport": "rugby-league",
        "league": "3"
    },
    {
        "sport": "australian-football",
        "league": "afl"
    },
    {
        "sport": "volleyball",
        "league": "mens-college-volleyball"
    },
    {
        "sport": "volleyball",
        "league": "womens-college-volleyball"
    },
    {
        "sport": "lacrosse",
        "league": "pll"
    },
    {
        "sport": "lacrosse",
        "league": "nll"
    },
    {
        "sport": "lacrosse",
        "league": "mens-college-lacrosse"
    },
    {
        "sport": "lacrosse",
        "league": "womens-college-lacrosse"
    },
    {
        "sport": "water-polo",
        "league": "mens-college-water-polo"
    },
    {
        "sport": "water-polo",
        "league": "womens-college-water-polo"
    },
    {
        "sport": "field-hockey",
        "league": "womens-college-field-hockey"
    }
];

async function run() {
    console.log("🚀 Starting Global Schedule Scraper...");
    let allEventsMap = {};

    for (const {sport, league} of LEAGUES) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`;
        console.log(`\n📡 Probing: ${sport.toUpperCase()} - ${league.toUpperCase()}`);
        
        try {
            const data = await fetch(url);
            
            const events = data.events || [];
            console.log(`📅 Found ${events.length} events.`);
            
            const leagueLogo = data.leagues?.[0]?.logos?.[0]?.href || '';
            const leagueName = data.leagues?.[0]?.name || league;

            if (sport.toLowerCase() === 'tennis') {
                // Specialized Tennis Parser
                for (const ev of events) {
                    for (const gr of ev.groupings || []) {
                        for (const comp of gr.competitions || []) {
                            const homeCompetitor = comp.competitors?.find(c => c.homeAway === 'home');
                            const awayCompetitor = comp.competitors?.find(c => c.homeAway === 'away');

                            const getPlayerName = (c) => {
                                if (!c) return '';
                                if (c.athlete) return c.athlete.displayName || '';
                                if (c.roster) return c.roster.displayName || '';
                                return '';
                            };

                            const getPlayerLogo = (c) => {
                                if (!c) return leagueLogo;
                                if (c.athlete) return c.athlete.flag?.href || leagueLogo;
                                if (c.roster && c.roster.athletes?.[0]) return c.roster.athletes[0].flag?.href || leagueLogo;
                                return leagueLogo;
                            };

                            let homeTeam = getPlayerName(homeCompetitor);
                            let awayTeam = getPlayerName(awayCompetitor);

                            // Skip if both are TBD or empty
                            if ((!homeTeam || homeTeam === 'TBD') && (!awayTeam || awayTeam === 'TBD')) {
                                continue;
                            }

                            let homeLogo = getPlayerLogo(homeCompetitor);
                            let awayLogo = getPlayerLogo(awayCompetitor);

                            let title = `${homeTeam} vs ${awayTeam}`;

                            const getAthletes = (c) => {
                                let athletes = [];
                                if (!c) return athletes;
                                if (c.athlete) {
                                    athletes.push({
                                        name: c.athlete.displayName || '',
                                        headshot: c.athlete.headshot?.href || null
                                    });
                                } else if (c.roster && c.roster.athletes) {
                                    for (const a of c.roster.athletes) {
                                        athletes.push({
                                            name: a.displayName || '',
                                            headshot: a.headshot?.href || null
                                        });
                                    }
                                }
                                return athletes;
                            };

                            let homeAthletes = getAthletes(homeCompetitor);
                            let awayAthletes = getAthletes(awayCompetitor);

                            allEventsMap[comp.id] = {
                                id: comp.id,
                                sport: 'Tennis',
                                league: ev.name || league.toLowerCase(),
                                leagueName: comp.type?.text ? `${ev.name || league} · ${comp.type.text}` : (ev.name || 'Singles'),
                                title: title,
                                homeTeam: homeTeam,
                                awayTeam: awayTeam,
                                homeLogo: homeLogo,
                                awayLogo: awayLogo,
                                homeColor: '',
                                awayColor: '',
                                startTime: comp.date,
                                status: comp.status?.type?.description || 'Scheduled',
                                homeAthletes: homeAthletes,
                                awayAthletes: awayAthletes
                            };
                        }
                    }
                }
            } else if (sport.toLowerCase() === 'racing') {
                // Specialized Racing Parser (Split by sessions like Qual, Race)
                for (const ev of events) {
                    for (const comp of ev.competitions || []) {
                        let typeAbbrev = comp.type?.abbreviation || '';
                        
                        // Skip Practice sessions
                        if (typeAbbrev.includes('FP') || typeAbbrev.includes('Practice')) {
                            continue;
                        }

                        // Map abbreviations to full names for better matching and UX
                        let sessionName = typeAbbrev;
                        if (typeAbbrev === 'SS') sessionName = 'Sprint Shootout';
                        else if (typeAbbrev === 'SR') sessionName = 'Sprint Race';
                        else if (typeAbbrev === 'Qual') sessionName = 'Qualifying';

                        let title = ev.name;
                        if (sessionName && typeAbbrev !== 'Race') {
                            title = `${ev.name} - ${sessionName}`;
                        }
                        
                        allEventsMap[comp.id] = {
                            id: comp.id,
                            sport: 'Racing',
                            league: league.toLowerCase(),
                            leagueName: leagueName,
                            title: title,
                            homeTeam: ev.shortName || ev.name,
                            awayTeam: '',
                            homeLogo: leagueLogo,
                            awayLogo: '',
                            homeColor: '',
                            awayColor: '',
                            startTime: comp.date,
                            status: comp.status?.type?.description || 'Scheduled'
                        };
                    }
                }
            } else if (sport.toLowerCase() === 'golf') {
                // Specialized Golf Parser (Single Event, extract Round info)
                for (const ev of events) {
                    const comp = ev.competitions?.[0];
                    if (!comp) continue;

                    let title = ev.name;
                    let statusStr = comp.status?.type?.description || 'Scheduled';

                    // Golf statuses often look like "Round 2 - In Progress"
                    // We want to extract "Round 2" into the Title and leave "In Progress" as the status
                    if (comp.status?.type?.shortDetail) {
                        let parts = comp.status.type.shortDetail.split(' - ');
                        
                        // Convert "Round X" to "X Round" for better stream matching and UX
                        let roundStr = parts[0];
                        roundStr = roundStr.replace('Round 1', 'First Round');
                        roundStr = roundStr.replace('Round 2', 'Second Round');
                        roundStr = roundStr.replace('Round 3', 'Third Round');
                        roundStr = roundStr.replace('Round 4', 'Final Round');

                        if (parts.length > 1) {
                            title = `${ev.name} · ${roundStr}`;
                            statusStr = parts.slice(1).join(' - ');
                        } else if (comp.status.type.shortDetail.includes('Round')) {
                            title = `${ev.name} · ${roundStr}`;
                        }
                    }

                    allEventsMap[comp.id] = {
                        id: comp.id,
                        sport: 'Golf',
                        league: league.toLowerCase(),
                        leagueName: leagueName,
                        title: title,
                        homeTeam: ev.shortName || ev.name,
                        awayTeam: '',
                        homeLogo: leagueLogo,
                        awayLogo: '',
                        homeColor: '',
                        awayColor: '',
                        startTime: comp.date,
                        status: statusStr
                    };
                }
            } else {
                // Normal Sports Parser
                for (const ev of events) {
                    const competition = ev.competitions?.[0];
                    if (!competition) continue;

                    const homeCompetitor = competition.competitors?.find(c => c.homeAway === 'home');
                    const awayCompetitor = competition.competitors?.find(c => c.homeAway === 'away');
                    
                    let title = ev.name;
                    let homeTeam = homeCompetitor?.team?.displayName || '';
                    let awayTeam = awayCompetitor?.team?.displayName || '';
                    
                    let homeLogo = homeCompetitor?.team?.logo || leagueLogo;
                    let awayLogo = awayCompetitor?.team?.logo || '';
                    
                    let homeColor = homeCompetitor?.team?.color || '';
                    let awayColor = awayCompetitor?.team?.color || '';
                    
                    if (!homeTeam && !awayTeam) {
                        homeTeam = ev.shortName || ''; 
                    }

                    allEventsMap[ev.id] = {
                        id: ev.id,
                        sport: sport.charAt(0).toUpperCase() + sport.slice(1),
                        league: league.toLowerCase(),
                        leagueName: leagueName,
                        title: title,
                        homeTeam: homeTeam,
                        awayTeam: awayTeam,
                        homeLogo: homeLogo,
                        awayLogo: awayLogo,
                        homeColor: homeColor,
                        awayColor: awayColor,
                        startTime: ev.date,
                        status: ev.status.type.description
                    };
                }
            }

            // Sleep to respect rate limits
            await new Promise(r => setTimeout(r, 500));

        } catch (error) {
            console.error(`❌ Error fetching ${league}:`, error.message);
        }
    }
    
    const allEvents = Object.values(allEventsMap);
    fs.writeFileSync('schedule.json', JSON.stringify(allEvents, null, 2));
    console.log(`\n✅ Saved ${allEvents.length} total events to schedule.json!`);
}

run();
