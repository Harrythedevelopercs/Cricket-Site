import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/';

// Construct full image URL
const getFullImageUrl = (url) => {
  if (url && (url.startsWith('http') || url.startsWith('https'))) return url;
  const cleanUrl = url && url.startsWith('/') ? url.substring(1) : url;
  const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`;
  return `${baseUrl}${cleanUrl}`;
};

// A selected tab with no rows says so instead of presenting a blank panel.
function TabEmpty() {
  return (
    <p className="roboto-condensed-regular w-full py-[6vw] lg:py-[2vw] text-center text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw]">
      Nothing recorded for this view yet.
    </p>
  );
}

function PlayerCard({ player }) {
  
  const name = player.playerName || "Unknown Player";
  const profilePic = getFullImageUrl(player.image?.[0]?.url || "/images/player_sample_image.png");
  const cardTitle = player.title || "Player Stats";
  const cardValue = player.cardValue || 0;
  const playerPosition = player.playerPosition || "Player";

  return (
    <div className="SC_ele flex_grid">
      <div className="SC_ele_player_image bg-cover bg-center" style={{ backgroundImage: `url(${profilePic})` }}>
        <div className="player_image_overlay" />
      </div>
      <div className="SC_ele_player_info flex_grid">
        <div className="SCE_playerInfo_cat">
          <h5 className="roboto-condensed-regular p2 white_color">
            {cardTitle}
          </h5>
        </div>
        <div className="SCE_playerInfo_score">
          <p className="roboto-condensed-bold h4 brand_orange">{cardValue}</p>
        </div>
        <div className="SCE_playerInfo_name">
          <p className="roboto-condensed-regular p2 white_color">{name}</p>
        </div>
        <div className="SCE_playerInfo_main">
          <p className="roboto-condensed-regular p5 white_color">
            {playerPosition}
          </p>
        </div>
      </div>
    </div>
  );
}


// function ScoreCard({ rank }) {
//   const name = (rank && rank.player) || "Unknown Player";
//   const profilePic = "/images/player_sample_image.png";

//   const values = [
//     { label: "Batting Points", value: (rank && rank.battingPoints) || 0 },
//     { label: "Bowling Points", value: (rank && rank.bowlingPoints) || 0 },
//     { label: "Fielding Points", value: (rank && rank.fieldingPoints) || 0 },
//     { label: "Other Points", value: (rank && rank.otherPoints) || 0 },
//   ];

//   const main = values.reduce((a, b) => (a.value > b.value ? a : b));

//   return (
//     <div className="SC_ele flex_grid">
//       <div className="SC_ele_player_image" style={{ backgroundImage: `url(${profilePic})` }}>
//         <div className="player_image_overlay" />
//       </div>
//       <div className="SC_ele_player_info flex_grid">
//         <div className="SCE_playerInfo_cat">
//           <h5 className="roboto-condensed-regular p2 white_color">
//             {main.label}
//           </h5>
//         </div>
//         <div className="SCE_playerInfo_score">
//           <p className="roboto-condensed-bold h4 brand_orange">{main.value}</p>
//         </div>
//         <div className="SCE_playerInfo_name">
//           <p className="roboto-condensed-regular p2 white_color">{name}</p>
//         </div>
//         <div className="SCE_playerInfo_main">
//           <p className="roboto-condensed-regular p5 white_color">
//             {main.label.split(" ")[0]}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

function CredsEle({ setNum, setText }) {
  return (
    <div className="creds_ele">
      <div className="credsContainer_grph">
        <p>{/* icon/graphic */}</p>
      </div>
      <p className="roboto-condensed-regular p3 text-center white_color mb-[4%] uppercase">
        {setText}
      </p>
      <p className="credsContainer_para roboto-condensed-bold p4 brand_orange h3">
        {setNum != null ? setNum : 0}
      </p>
    </div>
  );
}

export default function LeagueHighlights({
  leagueStats = [],
  topPlayers = [],
  teamBatting = [],
  teamBowling = [],
}) {


  
  return (
    <section className="LH_container">
      <div className="LH_parent">
        <Tabs>
          <div className="tabList_parent">
            <TabList>
              <Tab className="roboto-condensed-bold react-tabs__tab p4 grey_text">
                League Stats
              </Tab>
              <Tab className="roboto-condensed-bold react-tabs__tab p4 grey_text">
                Top Player
              </Tab>
              <Tab className="roboto-condensed-bold react-tabs__tab p4 grey_text">
                Team Batting
              </Tab>
              <Tab className="roboto-condensed-bold react-tabs__tab p4 grey_text">
                Team Bowling
              </Tab>
            </TabList>
          </div>

          <TabPanel className="react-tabs__tab-panel LS_parent">
            {leagueStats.length > 0 ? (
              leagueStats.map((item, i) => (
                <CredsEle key={i} setNum={item && item.number} setText={item && item.title} />
              ))
            ) : (
              <TabEmpty />
            )}
          </TabPanel>

          <TabPanel className="react-tabs__tab-panel TP_parent">
            {topPlayers.length > 0 ? (
              <section className="TPG_parent">
                {topPlayers.slice(0, 4).map((rank, index) => (
                  <PlayerCard key={index} player={rank} />
                ))}
              </section>
            ) : (
              <TabEmpty />
            )}
          </TabPanel>

          <TabPanel className="react-tabs__tab-panel LS_parent">
            {teamBatting.length > 0 ? (
              teamBatting.map((item, i) => (
                <CredsEle key={i} setNum={item && item.number} setText={item && item.title} />
              ))
            ) : (
              <TabEmpty />
            )}
          </TabPanel>

          <TabPanel className="react-tabs__tab-panel LS_parent">
            {teamBowling.length > 0 ? (
              teamBowling.map((item, i) => (
                <CredsEle key={i} setNum={item && item.number} setText={item && item.title} />
              ))
            ) : (
              <TabEmpty />
            )}
          </TabPanel>
        </Tabs>
      </div>
    </section>
  );
}
