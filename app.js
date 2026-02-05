const teams = [
  {id:1,name:"横浜F・マリノス"},
  {id:2,name:"鹿島アントラーズ"},
  {id:3,name:"川崎フロンターレ"},
  {id:4,name:"柏レイソル"},
];

let matches = [];

function render(){
  const root = document.getElementById("matches");
  root.innerHTML = "";
  matches.forEach(m => {
    const d = document.createElement("div");
    d.className = "match";
    d.innerHTML = `
      <div class="team home">
        <span class="tag home">HOME</span>
        <span>${m.home.name}</span>
      </div>
      <div class="score">
        <input type="number" value="${m.hs||""}"> -
        <input type="number" value="${m.as||""}">
      </div>
      <div class="team away">
        <span>${m.away.name}</span>
        <span class="tag away">AWAY</span>
      </div>
    `;
    root.appendChild(d);
  });
}

function generate(){
  matches = [];
  for(let i=0;i<teams.length;i+=2){
    matches.push({home:teams[i],away:teams[i+1],hs:"",as:""});
  }
  render();
}

document.getElementById("gen").onclick = generate;
document.getElementById("reset").onclick = ()=>{matches=[];render();};
