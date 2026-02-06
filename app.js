// League Builder (V26-core external, full)
const LS_KEY = "league_builder_v26_core_ext_full";

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
const esc = (s) => String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const sanitizeScore = (v) => { const s = String(v ?? "").replace(/[^0-9]/g,""); return s ? String(Math.min(99, Number(s))) : ""; };

const readFileAsDataUrl = (file) => new Promise((resolve, reject)=>{
  const fr = new FileReader();
  fr.onload = () => resolve(String(fr.result || ""));
  fr.onerror = () => reject(fr.error);
  fr.readAsDataURL(file);
});

function load(){ try{ const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }catch{ return null; } }
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

// Backward-compat: older merge variants referenced saveState().
function saveState(){ save(); }

function defaultState(){
  const mkTeam = (n)=>({ id: uid(), name:`Team${n}`, logoDataUrl:"", comment:"" });
  const teams = [1,2,3,4].map(mkTeam);
  const div = {
    id: uid(),
    name:"Division1",
    logoDataUrl:"",
    memberTeamIds:[],
    schedule:{ rounds:[], currentRound:0 },
    freeMatches:[],
    rankBands: [],
    prevRanks: {}
  };
  const season = { id: uid(), name:"Season 1", divisionSeq:2, divisions:[div] };
  const league = { id: uid(), name:"League1", logoDataUrl:"", teamSeq:5, seasonSeq:2, teams, seasons:[season] };
  return { leagues:[league], selectedLeagueId: league.id, selectedSeasonId: season.id, selectedDivisionId: div.id, ui:{ view:"home", divEditOpen:false, seasonDropdownOpen:false, divTab:"schedule" } };
}

let state = load() || defaultState();
save();

// DOM
const el = {
  crumb: document.getElementById("crumb"),
  btnHomeTop: document.getElementById("btnHomeTop"),
  btnSeasonPicker: document.getElementById("btnSeasonPicker"),
  seasonDropdown: document.getElementById("seasonDropdown"),
  seasonListTop: document.getElementById("seasonListTop"),
  viewHome: document.getElementById("viewHome"),
  viewLeague: document.getElementById("viewLeague"),
  viewSeason: document.getElementById("viewSeason"),
  btnAddLeague: document.getElementById("btnAddLeague"),
  leagueGrid: document.getElementById("leagueGrid"),
  leagueTitle: document.getElementById("leagueTitle"),
  leagueName: document.getElementById("leagueName"),
  leagueLogoPreview: document.getElementById("leagueLogoPreview"),
  leagueLogoFile: document.getElementById("leagueLogoFile"),
  btnSaveLeague: document.getElementById("btnSaveLeague"),
  btnBackHome: document.getElementById("btnBackHome"),
  btnAddTeam: document.getElementById("btnAddTeam"),
  teamGrid: document.getElementById("teamGrid"),
  btnAddSeason: document.getElementById("btnAddSeason"),
  seasonList: document.getElementById("seasonList"),
  seasonTitle: document.getElementById("seasonTitle"),
  seasonMeta: document.getElementById("seasonMeta"),
  seasonName: document.getElementById("seasonName"),
  btnSaveSeason: document.getElementById("btnSaveSeason"),
  btnDeleteSeason: document.getElementById("btnDeleteSeason"),
  btnBackLeague: document.getElementById("btnBackLeague"),
  btnAddDivision: document.getElementById("btnAddDivision"),
  divisionButtons: document.getElementById("divisionButtons"),
  divisionEditor: document.getElementById("divisionEditor"),
  divisionTitle: document.getElementById("divisionTitle"),
  btnToggleDivEdit: document.getElementById("btnToggleDivEdit"),
  divEditCollapse: document.getElementById("divEditCollapse"),
  divisionName: document.getElementById("divisionName"),
  divisionLogoPreview: document.getElementById("divisionLogoPreview"),
  divisionLogoFile: document.getElementById("divisionLogoFile"),
  btnSaveDivision: document.getElementById("btnSaveDivision"),
  btnDeleteDivision: document.getElementById("btnDeleteDivision"),
  divisionTeamPick: document.getElementById("divisionTeamPick"),
  rankBandList: document.getElementById("rankBandList"),
  btnAddRankBand: document.getElementById("btnAddRankBand"),
  tabSchedule: document.getElementById("tabSchedule"),
  tabStandings: document.getElementById("tabStandings"),
  tabTeams: document.getElementById("tabTeams"),
  btnGenSchedule: document.getElementById("btnGenSchedule"),
  selRounds: document.getElementById("selRounds"),
  btnResetSchedule: document.getElementById("btnResetSchedule"),
  matchdayButtons: document.getElementById("matchdayButtons"),
  matchList: document.getElementById("matchList"),
  freeName: document.getElementById("freeName"),
  freeHome: document.getElementById("freeHome"),
  freeAway: document.getElementById("freeAway"),
  btnAddFree: document.getElementById("btnAddFree"),
  freeList: document.getElementById("freeList"),

  standingsTbody: document.getElementById("standingsTbody"),
  standingsLegend: document.getElementById("standingsLegend"),
  btnSaveStandingsSnapshot: document.getElementById("btnSaveStandingsSnapshot"),
};

const getLeague = ()=> state.leagues.find(l=>l.id===state.selectedLeagueId) || null;
const getSeason = (league)=> league?.seasons.find(s=>s.id===state.selectedSeasonId) || null;
const getDivision = (season)=> season?.divisions.find(d=>d.id===state.selectedDivisionId) || null;

function setView(view){
  state.ui.view = view;
  if (view !== "season") state.ui.seasonDropdownOpen = false;
  save(); render();
}

el.btnHomeTop.onclick = ()=> setView("home");
el.btnBackHome.onclick = ()=> setView("home");
el.btnBackLeague.onclick = ()=> setView("league");
el.btnSeasonPicker.onclick = ()=> { state.ui.seasonDropdownOpen = !state.ui.seasonDropdownOpen; save(); render(); };

// League CRUD
el.btnAddLeague.onclick = ()=>{
  const n = state.leagues.length + 1;
  const league = { id:uid(), name:`League${n}`, logoDataUrl:"", teamSeq:1, seasonSeq:1, teams:[], seasons:[] };
  state.leagues.unshift(league);
  state.selectedLeagueId = league.id;
  state.selectedSeasonId = null;
  state.selectedDivisionId = null;
  save(); setView("league");
};

el.leagueLogoPreview.onclick = ()=> el.leagueLogoFile.click();
el.btnSaveLeague.onclick = async ()=>{
  const league = getLeague(); if(!league) return;
  league.name = (el.leagueName.value||"").trim() || league.name || "League1";
  const file = el.leagueLogoFile.files?.[0];
  if (file){ league.logoDataUrl = await readFileAsDataUrl(file); el.leagueLogoFile.value=""; }
  save(); render();
};

// Teams
el.btnAddTeam.onclick = ()=>{
  const league = getLeague(); if(!league) return;
  const name = `Team${league.teamSeq||1}`;
  league.teamSeq = (league.teamSeq||1)+1;
  league.teams.push({ id:uid(), name, logoDataUrl:"", comment:"" });
  save(); render();
};
function openTeamEdit(teamId){
  const league = getLeague(); if(!league) return;
  const team = league.teams.find(t=>t.id===teamId); if(!team) return;
  const n = prompt("チーム名", team.name);
  if (n!==null) team.name = n.trim() || team.name;
  const c = prompt("コメント", team.comment||"");
  if (c!==null) team.comment = c;
  save(); render();
}

// Seasons
el.btnAddSeason.onclick = ()=>{
  const league = getLeague(); if(!league) return;
  const name = `Season ${league.seasonSeq||1}`;
  league.seasonSeq = (league.seasonSeq||1)+1;
  const season = { id:uid(), name, divisionSeq:1, divisions:[] };
  league.seasons.push(season);
  save(); render();
};
function openSeason(seasonId){
  state.selectedSeasonId = seasonId;
  const league = getLeague();
  const season = getSeason(league);
  if (season && season.divisions.length && !state.selectedDivisionId) state.selectedDivisionId = season.divisions[0].id;
  setView("season");
}
el.btnSaveSeason.onclick = ()=>{
  const league = getLeague(); const season = getSeason(league); if(!season) return;
  season.name = (el.seasonName.value||"").trim() || season.name;
  save(); render();
};
el.btnDeleteSeason.onclick = ()=>{
  const league = getLeague(); if(!league) return;
  const idx = league.seasons.findIndex(s=>s.id===state.selectedSeasonId);
  if (idx<0) return;
  if (!confirm("このシーズンを削除しますか？")) return;
  league.seasons.splice(idx,1);
  state.selectedSeasonId = league.seasons[0]?.id || null;
  state.selectedDivisionId = null;
  save(); render();
};

// Divisions
el.btnAddDivision.onclick = ()=>{
  const league = getLeague(); const season = getSeason(league); if(!season) return;
  const name = `Division${season.divisionSeq||1}`;
  season.divisionSeq = (season.divisionSeq||1)+1;
  const div = { id:uid(), name, logoDataUrl:"", memberTeamIds:[], schedule:{rounds:[], currentRound:0}, freeMatches:[] };
  season.divisions.push(div);
  state.selectedDivisionId = div.id;
  save(); render();
};
el.btnToggleDivEdit.onclick = ()=>{ state.ui.divEditOpen = !state.ui.divEditOpen; save(); render(); };
el.divisionLogoPreview.onclick = ()=> el.divisionLogoFile.click();
el.btnSaveDivision.onclick = async (e)=>{
  try { e?.preventDefault?.(); e?.stopPropagation?.(); } catch(_) {}
  const league = getLeague(); const season = getSeason(league); const div = getDivision(season); if(!div) return;
  div.name = (el.divisionName.value||"").trim() || div.name;
  const file = el.divisionLogoFile.files?.[0];
  if (file){ div.logoDataUrl = await readFileAsDataUrl(file); el.divisionLogoFile.value=""; }
  save();
  // 「保存」が効いたことが分かるように一瞬表示を変える
  const oldText = el.btnSaveDivision.textContent;
  el.btnSaveDivision.textContent = "保存✓";
  setTimeout(()=>{ el.btnSaveDivision.textContent = oldText; }, 700);
  render();
};
el.btnDeleteDivision.onclick = ()=>{
  const league = getLeague(); const season = getSeason(league); if(!season) return;
  const idx = season.divisions.findIndex(d=>d.id===state.selectedDivisionId);
  if (idx<0) return;
  if (!confirm("このディビジョンを削除しますか？")) return;
  season.divisions.splice(idx,1);
  state.selectedDivisionId = season.divisions[0]?.id || null;
  save(); render();
};

// Tabs
document.addEventListener("click", (e)=>{
  const b = e.target.closest(".tabBtn");
  if(!b) return;
  state.ui.divTab = b.getAttribute("data-tab") || "schedule";
  save(); render();
});

// Schedule generation (circle method)
function makeRoundRobin(teamIds, legs=1){
  const ids = teamIds.slice();
  if (ids.length < 2) return [];
  if (ids.length % 2 === 1) ids.push(null);
  const n = ids.length, rounds = n-1, half = n/2;
  let arr = ids.slice();
  const out = [];
  for (let r=0;r<rounds;r++){
    const pairs = [];
    for (let i=0;i<half;i++){
      const a = arr[i], b = arr[n-1-i];
      if (a && b){
        const home = (r%2===0) ? a : b;
        const away = (r%2===0) ? b : a;
        pairs.push({ id:uid(), homeId:home, awayId:away, homeScore:"", awayScore:"" });
      }
    }
    out.push(pairs);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }
  if (legs===2){
    return out.concat(out.map(round=>round.map(m=>({ id:uid(), homeId:m.awayId, awayId:m.homeId, homeScore:"", awayScore:"" }))));
  }
  return out;
}

// ---------------- Rank Bands (legend) ----------------
function renderRankBands(div){
  if (!el.rankBandList || !el.btnAddRankBand) return;
  const list = el.rankBandList;
  list.innerHTML = "";

  (div.rankBands || []).forEach((b, idx) => {
    const row = document.createElement("div");
    row.className = "bandRow";
    row.innerHTML = `
      <input class="bandName" placeholder="名称" value="${escapeHtml(b.name||"")}">
      <input class="bandFrom" type="number" min="1" value="${Number(b.from||1)}">
      <span class="bandSep">〜</span>
      <input class="bandTo" type="number" min="1" value="${Number(b.to||1)}">
      <input class="bandColor" type="color" value="${b.color||"#22c55e"}">
      <button class="chip danger" type="button">削除</button>
    `;
    const [inpName, inpFrom, inpTo, inpColor, btnDel] = [
      row.querySelector(".bandName"),
      row.querySelector(".bandFrom"),
      row.querySelector(".bandTo"),
      row.querySelector(".bandColor"),
      row.querySelector("button")
    ];
    const sync = () => {
      b.name = inpName.value.trim();
      b.from = clampInt(inpFrom.value, 1, 999);
      b.to = clampInt(inpTo.value, 1, 999);
      if (b.to < b.from) [b.from, b.to] = [b.to, b.from];
      inpFrom.value = b.from;
      inpTo.value = b.to;
      b.color = inpColor.value;
      saveState();
    };
    inpName.oninput = sync;
    inpFrom.oninput = sync;
    inpTo.oninput = sync;
    inpColor.oninput = sync;
    btnDel.onclick = () => {
      div.rankBands.splice(idx, 1);
      saveState();
      render();
    };
    list.appendChild(row);
  });

  el.btnAddRankBand.onclick = () => {
    div.rankBands.push({ name:"", from:1, to:1, color:"#22c55e" });
    saveState();
    render();
  };
}

function clampInt(v, min, max){
  const n = Number.parseInt(String(v), 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function getBandColor(div, rank){
  const bands = Array.isArray(div.rankBands) ? div.rankBands : [];
  for (const b of bands){
    const from = Number(b.from||0), to = Number(b.to||0);
    if (rank >= Math.min(from,to) && rank <= Math.max(from,to)) return b.color || "#8b5cf6";
  }
  return "rgba(255,255,255,0.12)";
}

// ---------------- Standings (順位表) ----------------
function computeStandings(league, div){
  const teamIds = (div.memberTeamIds || []).slice();
  const byId = new Map(league.teams.map(t=>[t.id, t]));
  const stats = new Map();
  teamIds.forEach(id=>{
    stats.set(id, {
      teamId:id,
      p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0,
      form:[]
    });
  });

  const rounds = (div.schedule && Array.isArray(div.schedule.rounds)) ? div.schedule.rounds : [];
  const addForm = (tid, res) => {
    const s = stats.get(tid);
    if (!s) return;
    s.form.push(res);
  };

  for (let r=0;r<rounds.length;r++){
    const matches = rounds[r] || [];
    for (let m=0;m<matches.length;m++){
      const match = matches[m];
      const hs = Number(match.homeScore);
      const as = Number(match.awayScore);
      if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;
      const home = stats.get(match.homeId);
      const away = stats.get(match.awayId);
      if (!home || !away) continue;
      home.p++; away.p++;
      home.gf += hs; home.ga += as;
      away.gf += as; away.ga += hs;
      if (hs > as){
        home.w++; away.l++;
        home.pts += 3;
        addForm(match.homeId, "W");
        addForm(match.awayId, "L");
      } else if (hs < as){
        away.w++; home.l++;
        away.pts += 3;
        addForm(match.homeId, "L");
        addForm(match.awayId, "W");
      } else {
        home.d++; away.d++;
        home.pts += 1; away.pts += 1;
        addForm(match.homeId, "D");
        addForm(match.awayId, "D");
      }
    }
  }
  // finalize
  const rows = Array.from(stats.values()).map(s=>{
    s.gd = s.gf - s.ga;
    s.form = s.form.slice(-5); // last 5
    return s;
  });
  rows.sort((a,b)=>{
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    const an = (byId.get(a.teamId)?.name || "");
    const bn = (byId.get(b.teamId)?.name || "");
    return an.localeCompare(bn, 'ja');
  });
  return { rows, byId };
}

function renderStandings(league, div){
  if (!el.tabStandings || el.tabStandings.style.display === "none") return;
  if (!el.standingsTbody || !el.standingsLegend) return;
  const { rows, byId } = computeStandings(league, div);

  // ensure prevRanks map
  if (!div.prevRanks || typeof div.prevRanks !== "object") div.prevRanks = {};

  el.standingsTbody.innerHTML = "";
  rows.forEach((s, idx) => {
    const rank = idx + 1;
    const prev = Number(div.prevRanks[s.teamId]);
    const delta = Number.isFinite(prev) ? (prev - rank) : 0;
    const move = Number.isFinite(prev) ? (delta === 0 ? "same" : (delta > 0 ? "up" : "down")) : "same";

    const t = byId.get(s.teamId);
    const tr = document.createElement("tr");
    tr.className = "standingRow";
    tr.innerHTML = `
      <td class="pos">
        <div class="posWrap">
          <span class="posBar" style="background:${getBandColor(div, rank)}"></span>
          <span class="posNum">${rank}</span>
          <span class="move ${move}">${move === "up" ? "▲" : move === "down" ? "▼" : "―"}</span>
        </div>
      </td>
      <td class="team">
        <div class="teamCell">
          <span class="miniLogo">${(t?.logoDataUrl) ? `<img alt="" src="${t.logoDataUrl}">` : `<span class="miniLogoText">${escapeHtml((t?.name||"T").slice(0,1))}</span>`}</span>
          <span class="teamNameBox">${escapeHtml(t?.name||"")}</span>
        </div>
      </td>
      <td class="num">${s.p}</td>
      <td class="num">${s.w}</td>
      <td class="num">${s.d}</td>
      <td class="num">${s.l}</td>
      <td class="num">${s.gf}</td>
      <td class="num">${s.ga}</td>
      <td class="num">${s.gd}</td>
      <td class="num pts">${s.pts}</td>
      <td class="form">
        <div class="formDots">
          ${renderFormDots(s.form)}
        </div>
      </td>
    `;
    el.standingsTbody.appendChild(tr);
  });

  // legend
  el.standingsLegend.innerHTML = "";
  const bands = Array.isArray(div.rankBands) ? div.rankBands : [];
  if (bands.length){
    bands.forEach(b=>{
      const item = document.createElement("div");
      item.className = "legendItem";
      const from = Number(b.from||0), to = Number(b.to||0);
      item.innerHTML = `<span class="legendSw" style="background:${b.color||"#22c55e"}"></span><span class="legendText">${escapeHtml(b.name||"")}${b.name?" ":""}(${Math.min(from,to)}〜${Math.max(from,to)})</span>`;
      el.standingsLegend.appendChild(item);
    });
  }

  // snapshot button
  if (el.btnSaveStandingsSnapshot){
    el.btnSaveStandingsSnapshot.onclick = () => {
      const map = {};
      rows.forEach((s, idx)=>{ map[s.teamId] = idx+1; });
      div.prevRanks = map;
      saveState();
      render();
    };
  }
}

function renderFormDots(formArr){
  const arr = Array.isArray(formArr) ? formArr : [];
  const out = [];
  for (let i=0;i<5;i++){
    const r = arr[i];
    let cls = "empty";
    if (r === "W") cls = "win";
    else if (r === "D") cls = "draw";
    else if (r === "L") cls = "loss";
    out.push(`<span class="dot ${cls}"></span>`);
  }
  return out.join("");
}
el.btnGenSchedule.onclick = ()=>{
  const league = getLeague(); const season = getSeason(league); const div = getDivision(season);
  if(!div) return;
  const legs = Number(el.selRounds.value||"1");
  div.schedule.rounds = makeRoundRobin(div.memberTeamIds.slice(), legs);
  div.schedule.currentRound = 0;
  save(); render();
};
el.btnResetSchedule.onclick = ()=>{
  const league = getLeague(); const season = getSeason(league); const div = getDivision(season);
  if(!div) return;
  if (!confirm("日程をリセットします。スコア入力も消えます。よろしいですか？")) return;
  div.schedule = { rounds:[], currentRound:0 };
  save(); render();
};

// Free matches
el.btnAddFree.onclick = ()=>{
  const league = getLeague(); const season = getSeason(league); const div = getDivision(season);
  if(!league || !div) return;
  const name = (el.freeName.value||"").trim() || "Friendly";
  const homeId = el.freeHome.value, awayId = el.freeAway.value;
  if (!homeId || !awayId) return;
  if (homeId === awayId) return alert("ホームとアウェイは別のチームにしてください。");
  div.freeMatches.unshift({ id:uid(), name, homeId, awayId, homeScore:"", awayScore:"" });
  el.freeName.value="";
  save(); render();
};

function render(){
  el.viewHome.style.display = (state.ui.view==="home") ? "" : "none";
  el.viewLeague.style.display = (state.ui.view==="league") ? "" : "none";
  el.viewSeason.style.display = (state.ui.view==="season") ? "" : "none";

  el.seasonDropdown.style.display = (state.ui.seasonDropdownOpen && state.ui.view==="season") ? "" : "none";
  el.btnSeasonPicker.style.display = (state.ui.view==="season") ? "" : "none";
  el.crumb.textContent = (state.ui.view==="home") ? "ホーム" : (state.ui.view==="league" ? "リーグ" : "シーズン");

  // HOME: leagues
  el.leagueGrid.innerHTML = "";
  state.leagues.forEach(l=>{
    const b = document.createElement("div");
    b.className = "cardBtn";
    b.innerHTML = `
      <div class="sqLogo">${l.logoDataUrl ? `<img src="${esc(l.logoDataUrl)}" alt="">` : "L"}</div>
      <div class="cardText">
        <div class="cardTitle">${esc(l.name)}</div>
        <div class="cardSub">チーム ${l.teams.length} / シーズン ${l.seasons.length}</div>
      </div>`;
    b.onclick = ()=>{ state.selectedLeagueId=l.id; state.selectedSeasonId=l.seasons[0]?.id||null; state.selectedDivisionId=null; save(); setView("league"); };
    el.leagueGrid.appendChild(b);
  });

  const league = getLeague();
  if (state.ui.view==="league" && league){
    el.leagueTitle.textContent = league.name;
    el.leagueName.value = league.name;
    el.leagueLogoPreview.innerHTML = league.logoDataUrl ? `<img src="${esc(league.logoDataUrl)}" alt="">` : "L";

    // teams
    el.teamGrid.innerHTML = "";
    league.teams.forEach(t=>{
      const c = document.createElement("div");
      c.className = "cardBtn";
      c.innerHTML = `
        <div class="sqLogo">${t.logoDataUrl ? `<img src="${esc(t.logoDataUrl)}" alt="">` : "T"}</div>
        <div class="cardText">
          <div class="cardTitle">${esc(t.name)}</div>
          <div class="cardSub">${esc(t.comment || "タップして編集")}</div>
        </div>`;
      c.onclick = ()=> openTeamEdit(t.id);
      el.teamGrid.appendChild(c);
    });

    // seasons
    el.seasonList.innerHTML = "";
    league.seasons.forEach(s=>{
      const c = document.createElement("div");
      c.className = "cardBtn";
      c.innerHTML = `
        <div class="sqLogo">S</div>
        <div class="cardText">
          <div class="cardTitle">${esc(s.name)}</div>
          <div class="cardSub">ディビジョン ${s.divisions.length}</div>
        </div>`;
      c.onclick = ()=>{ state.selectedSeasonId=s.id; state.selectedDivisionId=s.divisions[0]?.id||null; save(); openSeason(s.id); };
      el.seasonList.appendChild(c);
    });
  }

  if (state.ui.view==="season" && league){
    const season = getSeason(league);
    if (!season) return;

    el.seasonTitle.textContent = season.name;
    el.seasonMeta.textContent = `ディビジョン ${season.divisions.length}`;
    el.seasonName.value = season.name;

    // top season dropdown list
    el.seasonListTop.innerHTML = "";
    league.seasons.forEach(s=>{
      const it = document.createElement("div");
      it.className = "seasonItem";
      it.innerHTML = `<div>${esc(s.name)}</div><div style="color:rgba(255,255,255,.55);font-size:12px;">${s.id===season.id ? "現在" : ""}</div>`;
      it.onclick = ()=>{ state.selectedSeasonId=s.id; state.selectedDivisionId=s.divisions[0]?.id||null; state.ui.seasonDropdownOpen=false; save(); render(); };
      el.seasonListTop.appendChild(it);
    });

    // division buttons
    el.divisionButtons.innerHTML = "";
    season.divisions.forEach(d=>{
      const btn = document.createElement("div");
      btn.className = "divBtn" + (d.id===state.selectedDivisionId ? " active" : "");
      btn.innerHTML = `
        <div class="sqLogo" style="width:34px;height:34px;border-radius:12px;">${d.logoDataUrl ? `<img src="${esc(d.logoDataUrl)}" alt="">` : "D"}</div>
        <div style="font-weight:900;">${esc(d.name)}</div>`;
      btn.onclick = ()=>{ state.selectedDivisionId=d.id; save(); render(); };
      el.divisionButtons.appendChild(btn);
    });

    const div = getDivision(season);
    if (!div){ el.divisionEditor.style.display="none"; return; }
    el.divisionEditor.style.display="";
    el.divisionTitle.textContent = div.name;

    el.divEditCollapse.style.display = state.ui.divEditOpen ? "" : "none";
    el.btnToggleDivEdit.textContent = state.ui.divEditOpen ? "編集 ▴" : "編集 ▾";
    el.divisionName.value = div.name;
    el.divisionLogoPreview.innerHTML = div.logoDataUrl ? `<img src="${esc(div.logoDataUrl)}" alt="">` : "D";

    // team pick
    el.divisionTeamPick.innerHTML = "";
    league.teams.forEach(t=>{
      const wrap = document.createElement("div");
      wrap.className = "pickItem";
      const checked = div.memberTeamIds.includes(t.id);
      wrap.innerHTML = `
        <input type="checkbox" ${checked ? "checked" : ""}>
        <div>
          <div class="pickName">${esc(t.name)}</div>
          <div class="pickSub">${esc(t.comment||"")}</div>
        </div>`;
      const cb = wrap.querySelector("input");
      cb.onchange = ()=>{
        if (cb.checked){ if (!div.memberTeamIds.includes(t.id)) div.memberTeamIds.push(t.id); }
        else { div.memberTeamIds = div.memberTeamIds.filter(id=>id!==t.id); }
        save(); render();
      };
      el.divisionTeamPick.appendChild(wrap);
    });

    // rank bands (legend)
    if (!Array.isArray(div.rankBands)) div.rankBands = [];
    if (!div.prevRanks || typeof div.prevRanks !== "object") div.prevRanks = {};
    renderRankBands(div);

    // tabs
    document.querySelectorAll(".tabBtn").forEach(b=>b.classList.toggle("active", b.getAttribute("data-tab")===state.ui.divTab));
    el.tabSchedule.style.display = (state.ui.divTab==="schedule") ? "" : "none";
    el.tabStandings.style.display = (state.ui.divTab==="standings") ? "" : "none";
    el.tabTeams.style.display = (state.ui.divTab==="teams") ? "" : "none";

    // schedule render
    renderSchedule(league, div);
    renderFreeSelectors(league);
    renderFreeList(league, div);

    // standings render (tabStandings 内)
    renderStandings(league, div);
  }
}

function renderSchedule(league, div){
  el.matchdayButtons.innerHTML = "";
  const rounds = div.schedule.rounds || [];
  const cur = div.schedule.currentRound || 0;

  rounds.forEach((_, idx)=>{
    const b = document.createElement("button");
    b.className = "mdBtn" + (idx===cur ? " active" : "");
    b.textContent = `第${idx+1}節`;
    b.onclick = ()=>{ div.schedule.currentRound = idx; save(); render(); };
    el.matchdayButtons.appendChild(b);
  });

  el.matchList.innerHTML = "";
  if (!rounds.length){
    const note = document.createElement("div");
    note.className = "emptyNote";
    note.textContent = "日程が未作成です。「日程を作成」を押してください。";
    el.matchList.appendChild(note);
    return;
  }
  (rounds[cur]||[]).forEach(m=> el.matchList.appendChild(renderMatchRow(league, m)));
}

function renderMatchRow(league, m){
  const h = league.teams.find(t=>t.id===m.homeId);
  const a = league.teams.find(t=>t.id===m.awayId);
  const row = document.createElement("div");
  row.className = "matchRow";

  const left = document.createElement("div");
  left.className = "side left";
  left.innerHTML = `<div class="teamText"><div class="role home">HOME</div><div class="teamName">${esc(h?.name||"—")}</div><div class="teamSub">${esc(h?.comment||"")}</div></div>`;

  const score = document.createElement("div");
  score.className = "scoreBox";
  const inH = document.createElement("input"); inH.className="scoreInput"; inH.inputMode="numeric"; inH.placeholder="-"; inH.value=String(m.homeScore??"");
  inH.oninput = ()=>{ m.homeScore = sanitizeScore(inH.value); inH.value=m.homeScore; save(); };
  const dash = document.createElement("div"); dash.className="dash"; dash.textContent="—";
  const inA = document.createElement("input"); inA.className="scoreInput"; inA.inputMode="numeric"; inA.placeholder="-"; inA.value=String(m.awayScore??"");
  inA.oninput = ()=>{ m.awayScore = sanitizeScore(inA.value); inA.value=m.awayScore; save(); };
  score.appendChild(inH); score.appendChild(dash); score.appendChild(inA);

  const right = document.createElement("div");
  right.className = "side right";
  right.innerHTML = `<div class="teamText" style="align-items:flex-end;"><div class="role away" style="text-align:right;">AWAY</div><div class="teamName" style="text-align:right;">${esc(a?.name||"—")}</div><div class="teamSub" style="text-align:right;">${esc(a?.comment||"")}</div></div>`;

  row.appendChild(left); row.appendChild(score); row.appendChild(right);
  return row;
}

function renderFreeSelectors(league){
  const opts = league.teams.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("");
  el.freeHome.innerHTML = opts; el.freeAway.innerHTML = opts;
}
function renderFreeList(league, div){
  el.freeList.innerHTML = "";
  const list = div.freeMatches || [];
  if (!list.length){
    const note = document.createElement("div");
    note.className = "emptyNote"; note.textContent = "まだ任意の試合がありません。";
    el.freeList.appendChild(note); return;
  }
  list.forEach(m=>{
    const row = document.createElement("div");
    row.className = "matchRow";
    row.style.gridTemplateColumns = "1fr 180px 1fr auto";

    const h = league.teams.find(t=>t.id===m.homeId);
    const a = league.teams.find(t=>t.id===m.awayId);

    const left = document.createElement("div");
    left.className = "side left";
    left.innerHTML = `<div class="teamText"><div class="role home">HOME</div><div class="teamName">${esc(h?.name||"—")}</div><div class="teamSub">${esc(m.name)}</div></div>`;

    const score = document.createElement("div");
    score.className = "scoreBox";
    const inH = document.createElement("input"); inH.className="scoreInput"; inH.inputMode="numeric"; inH.placeholder="-"; inH.value=String(m.homeScore??"");
    inH.oninput = ()=>{ m.homeScore = sanitizeScore(inH.value); inH.value=m.homeScore; save(); };
    const dash = document.createElement("div"); dash.className="dash"; dash.textContent="—";
    const inA = document.createElement("input"); inA.className="scoreInput"; inA.inputMode="numeric"; inA.placeholder="-"; inA.value=String(m.awayScore??"");
    inA.oninput = ()=>{ m.awayScore = sanitizeScore(inA.value); inA.value=m.awayScore; save(); };
    score.appendChild(inH); score.appendChild(dash); score.appendChild(inA);

    const right = document.createElement("div");
    right.className = "side right";
    right.innerHTML = `<div class="teamText" style="align-items:flex-end;"><div class="role away" style="text-align:right;">AWAY</div><div class="teamName" style="text-align:right;">${esc(a?.name||"—")}</div><div class="teamSub" style="text-align:right;">${esc("")}</div></div>`;

    const del = document.createElement("button");
    del.className = "delBtn"; del.textContent="×";
    del.onclick = ()=>{ div.freeMatches = div.freeMatches.filter(x=>x.id!==m.id); save(); render(); };

    row.appendChild(left); row.appendChild(score); row.appendChild(right); row.appendChild(del);
    el.freeList.appendChild(row);
  });
}

// init fallbacks
if (!state.selectedLeagueId) state.selectedLeagueId = state.leagues[0]?.id || null;
const initLeague = getLeague();
if (initLeague && !state.selectedSeasonId) state.selectedSeasonId = initLeague.seasons[0]?.id || null;
const initSeason = getSeason(initLeague);
if (initSeason && !state.selectedDivisionId) state.selectedDivisionId = initSeason.divisions[0]?.id || null;
save();
render();
