const matches=[
  {away:'Team A',home:'Team B'},
  {away:'Team C',home:'Team D'}
];
const root=document.getElementById('matches');
matches.forEach(m=>{
  const d=document.createElement('div');
  d.className='match';
  d.innerHTML=`<div class="away">AWAY ${m.away}</div>
               <div class="score">-</div>
               <div class="home">${m.home} HOME</div>`;
  root.appendChild(d);
});
