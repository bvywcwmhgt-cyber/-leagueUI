document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnGenerate");
  const roundsSel = document.getElementById("rounds");
  const out = document.getElementById("schedule");

  const teams = ["Team1","Team2","Team3","Team4"];

  btn.addEventListener("click", () => {
    out.innerHTML = "";
    const rounds = Number(roundsSel.value);

    for(let r=1;r<=rounds;r++){
      const title = document.createElement("h3");
      title.textContent = r + "回戦目";
      out.appendChild(title);

      for(let i=0;i<teams.length;i+=2){
        const div = document.createElement("div");
        div.className = "match";
        div.textContent = "HOME " + teams[i] + " - " + teams[i+1] + " AWAY";
        out.appendChild(div);
      }
    }
  });
});
