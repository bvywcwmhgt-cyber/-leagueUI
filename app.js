(() => {
  const STORAGE_KEY = "league_builder_v9";
  let state = load() ?? { leagues: [], nextLeagueNumber: 1 };

  const el = {
    nextLeagueName: document.getElementById("nextLeagueName"),
    initialSeasonName: document.getElementById("initialSeasonName"),
    format: document.getElementById("format"),
    points: document.getElementById("points"),
    initialTeams: document.getElementById("initialTeams"),
    btnCreateLeague: document.getElementById("btnCreateLeague"),
    btnReset: document.getElementById("btnReset"),
    btnExport: document.getElementById("btnExport"),
    leagueList: document.getElementById("leagueList"),
    leagueCount: document.getElementById("leagueCount"),
    toast: document.getElementById("toast"),

    overlay: document.getElementById("leagueOverlay"),
    btnCloseLeague: document.getElementById("btnCloseLeague"),
    btnDeleteLeague: document.getElementById("btnDeleteLeague"),
    leagueModalTitle: document.getElementById("leagueModalTitle"),
    leagueModalSub: document.getElementById("leagueModalSub"),
    leagueModalLogo: document.getElementById("leagueModalLogo"),
    leagueInfoMeta: document.getElementById("leagueInfoMeta"),
    tabs: Array.from(document.querySelectorAll(".tab")),
    tabLeague: document.getElementById("tab_league"),
    tabSeasons: document.getElementById("tab_seasons"),
    tabTeams: document.getElementById("tab_teams"),

    leagueEditName: document.getElementById("leagueEditName"),
    leagueLogoFile: document.getElementById("leagueLogoFile"),
    btnClearLeagueLogo: document.getElementById("btnClearLeagueLogo"),
    leagueEditFormat: document.getElementById("leagueEditFormat"),
    leagueEditPoints: document.getElementById("leagueEditPoints"),
    btnSaveLeague: document.getElementById("btnSaveLeague"),
    btnToSeasons: document.getElementById("btnToSeasons"),

    seasonCount: document.getElementById("seasonCount"),
    newSeasonName: document.getElementById("newSeasonName"),
    btnCreateSeason: document.getElementById("btnCreateSeason"),
    seasonList: document.getElementById("seasonList"),

    teamCount: document.getElementById("teamCount"),
    btnAddTeam: document.getElementById("btnAddTeam"),
    teamList: document.getElementById("teamList"),

    editingTeamMeta: document.getElementById("editingTeamMeta"),
    teamEditorEmpty: document.getElementById("teamEditorEmpty"),
    teamEditorForm: document.getElementById("teamEditorForm"),
    teamEditName: document.getElementById("teamEditName"),
    teamLogoFile: document.getElementById("teamLogoFile"),
    teamEditComment: document.getElementById("teamEditComment"),
    btnClearTeamLogo: document.getElementById("btnClearTeamLogo"),
    btnSaveTeam: document.getElementById("btnSaveTeam"),
    btnDeleteTeam: document.getElementById("btnDeleteTeam"),

    seasonView: document.getElementById("seasonView"),
    seasonLeagueLogo: document.getElementById("seasonLeagueLogo"),
    seasonHeaderLeague: document.getElementById("seasonHeaderLeague"),
    seasonHeaderSeason: document.getElementById("seasonHeaderSeason"),
    btnSeasonHome: document.getElementById("btnSeasonHome"),
    btnToggleSeasonChips: document.getElementById("btnToggleSeasonChips"),
    seasonChipBar: document.getElementById("seasonChipBar"),
    seasonChips: document.getElementById("seasonChips"),
    seasonPageTitle: document.getElementById("seasonPageTitle"),
    seasonBodyHint: document.getElementById("seasonBodyHint"),

    // divisions
    divisionDetails: document.getElementById("divisionDetails"),
    newDivisionName: document.getElementById("newDivisionName"),
    newDivisionLogoFile: document.getElementById("newDivisionLogoFile"),
    btnCreateDivision: document.getElementById("btnCreateDivision"),
    divisionButtonList: document.getElementById("divisionButtonList"),
    divisionChipsInSeason: document.getElementById("divisionChipsInSeason"),

    divisionEditorEmpty: document.getElementById("divisionEditorEmpty"),
    divisionEditor: document.getElementById("divisionEditor"),
    divisionEditingMeta: document.getElementById("divisionEditingMeta"),
    divisionEditName: document.getElementById("divisionEditName"),
    divisionEditLogoFile: document.getElementById("divisionEditLogoFile"),
    btnClearDivisionLogo: document.getElementById("btnClearDivisionLogo"),
    divisionTeamChecklist: document.getElementById("divisionTeamChecklist"),
    divisionRankMarkers: document.getElementById("divisionRankMarkers"),
    btnAddRankMarker: document.getElementById("btnAddRankMarker"),
    btnSaveDivision: document.getElementById("btnSaveDivision"),
    btnDeleteDivision: document.getElementById("btnDeleteDivision"),

    seasonSectionTabs: document.getElementById("seasonSectionTabs"),
    secSchedule: document.getElementById("sec_schedule"),
    secStandings: document.getElementById("sec_standings"),
    secTeams: document.getElementById("sec_teams"),
    schedMeta: document.getElementById("schedMeta"),
    btnGenerateSchedule: document.getElementById("btnGenerateSchedule"),
    btnResetSchedule: document.getElementById("btnResetSchedule"),
    roundScroller: document.getElementById("roundScroller"),
    matchList: document.getElementById("matchList"),

    standingsSub: document.getElementById("standingsSub"),
    standingsTable: document.getElementById("standingsTable"),
    standingsLegend: document.getElementById("standingsLegend"),

    customMatchName: document.getElementById("customMatchName"),
    customHome: document.getElementById("customHome"),
    customAway: document.getElementById("customAway"),
    btnAddCustomMatch: document.getElementById("btnAddCustomMatch"),
    customMatchList: document.getElementById("customMatchList"),

  };

  let activeLeagueId = null;
  let activeTeamId = null;
  let activeSeasonId = null;

  let seasonChipsOpen = false;
  let seasonSection = 'schedule';
  let activeRoundIndex = 0;
  let pendingDivisionLogoDataUrl = "";
  let editingDivisionId = "";

  refreshNextLeagueName();
  renderHome();

  // handle direct links / reloads
  showHome();
  window.addEventListener('hashchange', () => {
    if (__suppressHash) return;
    applyRoute();
  });

  el.btnCreateLeague.addEventListener("click", () => {
    const name = (el.nextLeagueName.value || "").trim() || defaultLeagueName();
    const league = {
      id: uid(),
      name,
      format: el.format.value,
      points: (el.points.value || "").trim() || "3 / 1 / 0",
      logoDataUrl: "",
      teams: [],
      seasons: [],
      activeSeasonId: ""
    };

    const initialTeams = clampInt(el.initialTeams.value, 0, 60);
    for (let i = 0; i < initialTeams; i++){
      league.teams.push({ id: uid(), name: `Team ${i + 1}`, logoDataUrl: "", comment: "" });
    }

    const seasonName = ((el.initialSeasonName.value || "").trim()) || "Season 1";
    const s = { id: uid(), name: seasonName, createdAt: Date.now(), divisions: [], activeDivisionId: "" };
    league.seasons.push(s);
    league.activeSeasonId = s.id;

    state.leagues.unshift(league);
    bumpNextLeagueNumberOnCreate(name);
    persist();
    renderHome();
    refreshNextLeagueName();
    el.initialSeasonName.value = "";
    toast(`「${name}」を追加しました`);
  });

  el.btnReset.addEventListener("click", () => {
    const ok = confirm("全リーグを削除します。よろしいですか？");
    if (!ok) return;
    state = { leagues: [], nextLeagueNumber: 1 };
    persist();
    renderHome();
    refreshNextLeagueName();
    toast("全データを削除しました");
  });

  el.btnExport.addEventListener("click", async () => {
    const data = JSON.stringify(state, null, 2);
    try{
      await navigator.clipboard.writeText(data);
      toast("JSONをクリップボードにコピーしました");
    }catch{
      const blob = new Blob([data], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "league_builder_export.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("JSONをダウンロードしました");
    }
  });

  el.btnCloseLeague.addEventListener("click", closeLeagueModal);
  el.overlay.addEventListener("click", (e) => { if (e.target === el.overlay) closeLeagueModal(); });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape"){
      if (el.seasonView.classList.contains("show")) closeSeasonView();
      else if (el.overlay.classList.contains("show")) closeLeagueModal();
    }
  });

  el.tabs.forEach(t => t.addEventListener("click", () => setTab(t.getAttribute("data-tab"))));

  el.btnSaveLeague.addEventListener("click", () => {
    const league = getActiveLeague();
    if (!league) return;
    const name = (el.leagueEditName.value || "").trim();
    if (!name) return toast("リーグ名が空です");
    league.name = name;
    league.format = el.leagueEditFormat.value;
    league.points = (el.leagueEditPoints.value || "").trim() || "3 / 1 / 0";
    persist();
    renderHome();
    syncModalHeader();
    toast("リーグを保存しました");
  });

  el.btnClearLeagueLogo.addEventListener("click", () => {
    const league = getActiveLeague();
    if (!league) return;
    league.logoDataUrl = "";
    persist();
    renderHome();
    syncModalHeader();
    toast("リーグロゴを削除しました");
  });

  el.leagueLogoFile.addEventListener("change", async () => {
    const league = getActiveLeague();
    if (!league) return;
    const file = el.leagueLogoFile.files?.[0];
    if (!file) return;
    league.logoDataUrl = await fileToDataUrl(file);
    persist();
    renderHome();
    syncModalHeader();
    toast("リーグロゴを更新しました");
    el.leagueLogoFile.value = "";
  });

  el.btnToSeasons.addEventListener("click", () => setTab("seasons"));

  el.btnDeleteLeague.addEventListener("click", () => {
    const league = getActiveLeague();
    if (!league) return;
    const ok = confirm(`「${league.name}」を削除します。よろしいですか？`);
    if (!ok) return;
    state.leagues = state.leagues.filter(l => l.id !== league.id);
    persist();
    renderHome();
    closeLeagueModal();
    toast("リーグを削除しました");
  });

  el.btnCreateSeason.addEventListener("click", () => {
    const league = getActiveLeague();
    if (!league) return;
    normalizeLeague(league);
    const raw = (el.newSeasonName.value || "").trim();
    const name = raw || `Season ${nextSeasonNumber(league)}`;
    const season = { id: uid(), name, createdAt: Date.now(), divisions: [], activeDivisionId: "" };
    league.seasons.push(season);
    league.activeSeasonId = season.id;
    persist();
    el.newSeasonName.value = "";
    renderSeasons();
    syncModalHeader();
    toast(`「${name}」を作成しました`);
  });

  el.btnAddTeam.addEventListener("click", () => {
    const league = getActiveLeague();
    if (!league) return;
    const num = nextTeamNumber(league);
    league.teams.push({ id: uid(), name: `Team ${num}`, logoDataUrl: "", comment: "" });
    persist();
    renderTeams();
    syncModalHeader();
    toast("チームを追加しました");
  });

  el.btnSaveTeam.addEventListener("click", () => {
    const team = getActiveTeam();
    const league = getActiveLeague();
    if (!team || !league) return;
    const name = (el.teamEditName.value || "").trim();
    if (!name) return toast("チーム名が空です");
    team.name = name;
    team.comment = (el.teamEditComment.value || "").trim();
    persist();
    renderHome();
    renderTeams();
    toast("チームを保存しました");
  });

  el.btnClearTeamLogo.addEventListener("click", () => {
    const team = getActiveTeam();
    if (!team) return;
    team.logoDataUrl = "";
    persist();
    renderTeams();
    toast("チームロゴを削除しました");
  });

  el.teamLogoFile.addEventListener("change", async () => {
    const team = getActiveTeam();
    if (!team) return;
    const file = el.teamLogoFile.files?.[0];
    if (!file) return;
    team.logoDataUrl = await fileToDataUrl(file);
    persist();
    renderHome();
    renderTeams();
    toast("チームロゴを更新しました");
    el.teamLogoFile.value = "";
  });

  el.btnDeleteTeam.addEventListener("click", () => {
    const league = getActiveLeague();
    const team = getActiveTeam();
    if (!league || !team) return;
    const ok = confirm(`「${team.name}」を削除しますか？`);
    if (!ok) return;
    league.teams = league.teams.filter(t => t.id !== team.id);
    if (activeTeamId === team.id) activeTeamId = null;
    league.seasons.forEach(s => {
      (s.divisions || []).forEach(d => {
        d.teamIds = (d.teamIds || []).filter(id => id !== team.id);
      });
    });
    persist();
    renderHome();
    renderTeams();
    toast("チームを削除しました");
  });

  // Season view
  el.btnSeasonHome.addEventListener("click", () => {
    closeSeasonView();
    if (!el.overlay.classList.contains("show") && activeLeagueId) openLeagueModal(activeLeagueId);
    setTab("seasons");
  });

  el.btnToggleSeasonChips.addEventListener("click", () => {
    seasonChipsOpen = !seasonChipsOpen;
    el.seasonChipBar.classList.toggle("hide", !seasonChipsOpen);
    el.btnToggleSeasonChips.textContent = seasonChipsOpen ? "シーズン ▴" : "シーズン ▾";
  });


  // Season sections (日程/結果・順位表・チーム一覧)
  if (el.seasonSectionTabs){
    el.seasonSectionTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".sectionBtn");
      if (!btn) return;
      seasonSection = btn.getAttribute("data-sec") || "schedule";
      syncSeasonSection();
    });
  }

  function syncSeasonSection(){
    const btns = el.seasonSectionTabs ? Array.from(el.seasonSectionTabs.querySelectorAll(".sectionBtn")) : [];
    btns.forEach(b => b.classList.toggle("active", b.getAttribute("data-sec") === seasonSection));
    if (el.secSchedule) el.secSchedule.classList.toggle("hide", seasonSection !== "schedule");
    if (el.secStandings) el.secStandings.classList.toggle("hide", seasonSection !== "standings");
    if (el.secTeams) el.secTeams.classList.toggle("hide", seasonSection !== "teams");
    if (seasonSection === "schedule"){
      renderScheduleUI();
      renderCustomMatches();
    } else if (seasonSection === "standings"){
      renderStandingsUI();
    }
  }

  if (el.btnGenerateSchedule){
    el.btnGenerateSchedule.addEventListener("click", () => {
      const league = getActiveLeague();
      const season = getActiveSeason();
      const div = season ? (season.divisions || []).find(d => d.id === season.activeDivisionId) : null;
      if (!league || !season || !div) return toast("ディビジョンを選択してください");
      const teams = (div.teamIds || []).map(id => league.teams.find(t => t.id === id)).filter(Boolean);
      if (teams.length < 2) return toast("参加チームが2つ以上必要です");
      {
        const mode = (el.schedGenMode && el.schedGenMode.value) ? el.schedGenMode.value : "single";
        const base = generateRoundRobinSchedule(teams.map(t => t.id));
        if (mode === "double"){
          // append second leg (swap home/away)
          const second = base.rounds.map((r, i) => {
            const matches = (r.matches || []).map(m => ({ id: uid(), homeId: m.awayId, awayId: m.homeId, homeScore: "", awayScore: "" }));
            return { id: uid(), name: `第${base.rounds.length + i + 1}節`, matches };
          });
          div.schedule = { createdAt: Date.now(), rounds: [...base.rounds, ...second] };
        } else {
          div.schedule = base;
        }
      }
      activeRoundIndex = 0;
      persist();
      renderScheduleUI();
      toast("日程を作成しました");
    });
  }

  if (el.btnResetSchedule){
    el.btnResetSchedule.addEventListener("click", () => {
      const season = getActiveSeason();
      const div = season ? (season.divisions || []).find(d => d.id === season.activeDivisionId) : null;
      if (!season || !div) return;
      const ok = confirm("このディビジョンの日程をリセットしますか？");
      if (!ok) return;
      div.schedule = null;
      activeRoundIndex = 0;
      persist();
      renderScheduleUI();
      toast("日程をリセットしました");
    });
  }

  if (el.btnAddCustomMatch){
    el.btnAddCustomMatch.addEventListener("click", () => {
      const league = getActiveLeague();
      if (!league) return;
      league.customMatches ??= [];
      const home = el.customHome.value;
      const away = el.customAway.value;
      if (!home || !away || home === away) return toast("ホーム/アウェイを正しく選んでください");
      const name = (el.customMatchName.value || "").trim() || `Match ${league.customMatches.length + 1}`;
      league.customMatches.unshift({
        id: uid(),
        name,
        homeId: home,
        awayId: away,
        homeScore: "",
        awayScore: "",
        note: ""
      });
      el.customMatchName.value = "";
      persist();
      renderCustomMatches();
      toast("任意の試合を追加しました");
    });
  }


    // Divisions
  el.newDivisionLogoFile.addEventListener("change", async () => {
    const file = el.newDivisionLogoFile.files?.[0];
    if (!file) return;
    pendingDivisionLogoDataUrl = await fileToDataUrl(file);
    toast("ディビジョンロゴを選択しました");
  });

  el.btnCreateDivision.addEventListener("click", () => {
    const season = getActiveSeason();
    const league = getActiveLeague();
    if (!season || !league) return;
    normalizeSeason(season);

    const raw = (el.newDivisionName.value || "").trim();
    const name = raw || `Division ${nextDivisionNumber(season)}`;
    const div = { id: uid(), name, logoDataUrl: pendingDivisionLogoDataUrl || "", teamIds: [] };
    season.divisions.push(div);
    if (!season.activeDivisionId) season.activeDivisionId = div.id;

    pendingDivisionLogoDataUrl = "";
    el.newDivisionLogoFile.value = "";
    el.newDivisionName.value = "";

    persist();
    renderDivisions();
    toast("ディビジョンを追加しました");
  });

  el.btnSaveDivision.addEventListener("click", () => {
    const div = getEditingDivision();
    if (!div) return;
    div.name = (el.divisionEditName.value || "").trim() || div.name;
    persist();
    renderDivisions();
    toast("ディビジョンを保存しました");
  });

  el.divisionEditLogoFile.addEventListener("change", async () => {
    const div = getEditingDivision();
    if (!div) return;
    const file = el.divisionEditLogoFile.files?.[0];
    if (!file) return;
    div.logoDataUrl = await fileToDataUrl(file);
    persist();
    renderDivisions();
    toast("ディビジョンロゴを更新しました");
    el.divisionEditLogoFile.value = "";
  });

  el.btnClearDivisionLogo.addEventListener("click", () => {
    const div = getEditingDivision();
    if (!div) return;
    div.logoDataUrl = "";
    persist();
    renderDivisions();
    toast("ディビジョンロゴを削除しました");
  });

  el.btnDeleteDivision.addEventListener("click", () => {
    const season = getActiveSeason();
    const div = getEditingDivision();
    if (!season || !div) return;
    const ok = confirm(`「${div.name}」を削除しますか？`);
    if (!ok) return;
    season.divisions = (season.divisions || []).filter(d => d.id !== div.id);
    if (season.activeDivisionId === div.id){
      season.activeDivisionId = season.divisions[0]?.id || "";
    }
    editingDivisionId = "";
    persist();
    renderDivisions();
    toast("ディビジョンを削除しました");
  });

  function renderHome(){
  // ensure we are in Home view
  el.homeApp.style.display = "block";
  el.seasonView.classList.remove("show");
    el.leagueCount.textContent = `${state.leagues.length} leagues`;
    el.leagueList.innerHTML = "";
    if (state.leagues.length === 0){
      el.leagueList.innerHTML = `
        <div style="border:1px dashed rgba(255,255,255,.14); border-radius:18px; padding:14px 12px; color:rgba(255,255,255,.62); background:rgba(0,0,0,.14);">
          まだリーグがありません。左の「リーグ追加」から作成できます。
        </div>`;
      return;
    }
    for (const league of state.leagues){
      el.leagueList.appendChild(renderLeagueCard(league));
    }
  }

  function renderLeagueCard(league){
    normalizeLeague(league);
    const card = document.createElement("div");
    card.className = "leagueCard";

    const top = document.createElement("div");
    top.className = "leagueTop";

    const left = document.createElement("div");
    left.className = "leagueLeft";

    const logo = document.createElement("div");
    logo.className = "sqLogo";
    if (league.logoDataUrl){
      const img = document.createElement("img");
      img.src = league.logoDataUrl; img.alt = "league logo";
      logo.appendChild(img);
    }else logo.textContent = "L";

    const info = document.createElement("div");
    info.className = "leagueInfo";

    const name = document.createElement("div");
    name.className = "leagueName";
    name.textContent = league.name;

    const meta = document.createElement("div");
    meta.className = "leagueMeta";
    meta.innerHTML = `<span>形式: ${formatLabel(league.format)}</span><span>チーム: ${league.teams.length}</span><span>シーズン: ${escapeHtml(getActiveSeasonName(league))}</span>`;

    info.appendChild(name); info.appendChild(meta);
    left.appendChild(logo); left.appendChild(info);

    const right = document.createElement("div");
    const manage = document.createElement("button");
    manage.className = "btn primary";
    manage.textContent = "管理";
    manage.addEventListener("click", () => openLeagueModal(league.id));
    right.appendChild(manage);

    top.appendChild(left); top.appendChild(right);
    card.appendChild(top);
    return card;
  }

  function openLeagueModal(leagueId){
    activeLeagueId = leagueId;
    activeTeamId = null;
    activeSeasonId = null;
    editingDivisionId = "";
    const league = getActiveLeague();
    if (!league) return;
    normalizeLeague(league);

    el.leagueEditName.value = league.name;
    el.leagueEditFormat.value = league.format;
    el.leagueEditPoints.value = league.points;

    syncModalHeader();
    setTab("league");

    el.overlay.classList.add("show");
    el.overlay.setAttribute("aria-hidden","false");
  }

  function closeLeagueModal(){
    el.overlay.classList.remove("show");
    el.overlay.setAttribute("aria-hidden","true");
  }

  function syncModalHeader(){
    const league = getActiveLeague();
    if (!league) return;
    normalizeLeague(league);

    el.leagueModalTitle.textContent = league.name;
    el.leagueModalSub.textContent = `形式: ${formatLabel(league.format)} / 勝ち点: ${league.points} / チーム: ${league.teams.length} / シーズン: ${getActiveSeasonName(league)}`;
    el.leagueInfoMeta.textContent = `${league.teams.length} teams`;

    el.leagueModalLogo.innerHTML = "";
    if (league.logoDataUrl){
      const img = document.createElement("img");
      img.src = league.logoDataUrl; img.alt = "league logo";
      el.leagueModalLogo.appendChild(img);
    }else el.leagueModalLogo.textContent = "L";
  }

  function setTab(key){
    el.tabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-tab") === key));
    el.tabLeague.classList.toggle("hide", key !== "league");
    el.tabSeasons.classList.toggle("hide", key !== "seasons");
    el.tabTeams.classList.toggle("hide", key !== "teams");
    if (key === "seasons") renderSeasons();
    if (key === "teams") renderTeams();
  }

  function renderSeasons(){
    const league = getActiveLeague();
    if (!league) return;
    normalizeLeague(league);

    el.seasonCount.textContent = `${league.seasons.length} seasons`;
    el.seasonList.innerHTML = "";

    league.seasons.slice().reverse().forEach((s) => {
      const row = document.createElement("div");
      row.className = "seasonRow";

      const left = document.createElement("div");
      left.className = "left";
      const nm = document.createElement("div");
      nm.className = "name";
      nm.textContent = s.name;
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `作成: ${formatDate(s.createdAt)}${league.activeSeasonId === s.id ? " / 現在" : ""}`;
      left.appendChild(nm); left.appendChild(meta);

      const btns = document.createElement("div");
      btns.className = "seasonBtns";

      const open = document.createElement("button");
      open.className = "btn primary small";
      open.textContent = "開く";
      open.addEventListener("click", () => {
        league.activeSeasonId = s.id;
        persist();
        syncModalHeader();
        openSeasonView(league.id, s.id);
      });

      const del = document.createElement("button");
      del.className = "miniIconBtn danger";
      del.textContent = "×";
      del.title = "シーズン削除";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        if (league.seasons.length <= 1){
          toast("最後のシーズンは削除できません");
          return;
        }
        const ok = confirm(`「${s.name}」を削除しますか？`);
        if (!ok) return;
        league.seasons = league.seasons.filter(x => x.id !== s.id);
        if (league.activeSeasonId === s.id){
          league.activeSeasonId = league.seasons[league.seasons.length - 1].id;
        }
        persist();
        renderSeasons();
        syncModalHeader();
        toast("シーズンを削除しました");
      });

      btns.appendChild(open);
      btns.appendChild(del);

      row.appendChild(left);
      row.appendChild(btns);

      el.seasonList.appendChild(row);
    });
  }

  function renderTeams(){
    const league = getActiveLeague();
    if (!league) return;
    normalizeLeague(league);

    el.teamCount.textContent = `${league.teams.length} teams`;
    el.teamList.innerHTML = "";

    if (league.teams.length === 0){
      el.teamList.innerHTML = `
        <div style="grid-column:1/-1; border:1px dashed rgba(255,255,255,.14); border-radius:16px; padding:12px; color:rgba(255,255,255,.62); background:rgba(0,0,0,.12);">
          まだチームがありません。「チーム追加」で作成できます。
        </div>`;
      activeTeamId = null;
      syncTeamEditor();
      return;
    }

    for (let i = 0; i < league.teams.length; i++){
      const team = league.teams[i];

      const row = document.createElement("div");
      row.className = "teamCard" + (activeTeamId === team.id ? " selected" : "");

      const pick = document.createElement("button");
      pick.className = "pick";
      pick.type = "button";
      pick.addEventListener("click", () => {
        activeTeamId = team.id;
        renderTeams();
        fillTeamEditor();
        syncTeamEditor();
      });

      const logo = document.createElement("div");
      logo.className = "sqLogo";
      logo.style.width = "38px";
      logo.style.height = "38px";
      logo.style.borderRadius = "14px";
      logo.innerHTML = "";
      if (team.logoDataUrl){
        const img = document.createElement("img");
        img.src = team.logoDataUrl; img.alt = "team logo";
        logo.appendChild(img);
      }else logo.textContent = "T";

      const txt = document.createElement("div");
      txt.className = "teamTxt";
      const nm = document.createElement("div");
      nm.className = "teamName";
      nm.textContent = team.name;
      const hint = document.createElement("div");
      hint.className = "teamHint";
      hint.textContent = team.comment ? "コメントあり" : `Team ${i + 1}`;
      txt.appendChild(nm); txt.appendChild(hint);

      pick.appendChild(logo);
      pick.appendChild(txt);

      const del = document.createElement("button");
      del.className = "xBtn";
      del.title = "削除";
      del.textContent = "×";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        const ok = confirm(`「${team.name}」を削除しますか？`);
        if (!ok) return;
        league.teams = league.teams.filter(t => t.id !== team.id);
        if (activeTeamId === team.id) activeTeamId = null;
        league.seasons.forEach(s => {
          (s.divisions || []).forEach(d => {
            d.teamIds = (d.teamIds || []).filter(id => id !== team.id);
          });
        });
        persist();
        renderHome();
        renderTeams();
        toast("チームを削除しました");
      });

      row.appendChild(pick);
      row.appendChild(del);
      el.teamList.appendChild(row);
    }

    if (activeTeamId) fillTeamEditor();
    syncTeamEditor();
  }

  function fillTeamEditor(){
    const team = getActiveTeam();
    const league = getActiveLeague();
    if (!team || !league) return;
    el.teamEditName.value = team.name;
    el.teamEditComment.value = team.comment || "";
    el.editingTeamMeta.textContent = `所属: ${league.name}`;
  }

  function syncTeamEditor(){
    const team = getActiveTeam();
    if (!team){
      el.editingTeamMeta.textContent = "未選択";
      el.teamEditorEmpty.classList.remove("hide");
      el.teamEditorForm.classList.add("hide");
      return;
    }
    el.teamEditorEmpty.classList.add("hide");
    el.teamEditorForm.classList.remove("hide");
  }

  // ---- simple hash router (prevents iOS reload/back issues) ----
  let __suppressHash = false;
  function setRouteHome(){
    __suppressHash = true;
    location.hash = "";
    setTimeout(()=>{ __suppressHash = false; }, 0);
  }
  function setRouteSeason(leagueId, seasonId){
    __suppressHash = true;
    location.hash = `#season:${encodeURIComponent(String(leagueId||""))}:${encodeURIComponent(String(seasonId||""))}`;
    setTimeout(()=>{ __suppressHash = false; }, 0);
  }
  function applyRoute(){
    if (__suppressHash) return;
    const h = location.hash || "";
    if (h.startsWith("#season:")){
      const rest = h.slice("#season:".length);
      const parts = rest.split(":").map(s => decodeURIComponent(s));
      const leagueId = parts[0] || "";
      const seasonId = parts[1] || "";
      if (leagueId && seasonId){
        const league = state.leagues.find(l => l.id === leagueId);
        if (league){
          state.activeLeagueId = leagueId;
          state.activeSeasonId = seasonId;
          persist();
          renderSeason();
          showSeason();
          return;
        }
      }
    }
    state.activeSeasonId = null;
    persist();
    renderHome();
    showHome();
  }

  function openSeasonView(leagueId, seasonId){
    state.activeLeagueId = leagueId;
    state.activeSeasonId = seasonId;
    persist();
    setRouteSeason(leagueId, seasonId);
    renderSeason();
    showSeason();
  }

  function closeSeasonView(){
    state.activeSeasonId = null;
    persist();
    setRouteHome();
    renderHome();
    showHome();
  }

  window.addEventListener("hashchange", applyRoute);
  setTimeout(applyRoute, 0);
function showHome(){
  el.seasonView.classList.remove("show");
  el.seasonView.style.display = "none";
  el.homeApp.classList.remove("hide");
  el.homeApp.style.display = "";
  document.body.classList.remove("season-open");
  el.seasonView.setAttribute("aria-hidden","true");
}

function showSeason(){
  el.homeApp.classList.add("hide");
  el.homeApp.style.display = "none";
  el.seasonView.style.display = "block";
  el.seasonView.classList.add("show");
  document.body.classList.add("season-open");
  el.seasonView.setAttribute("aria-hidden","false");
}
;
})();

