// Generated from the page's search engine block. Do not edit by hand.
function makeEngine(PARTS){
    var MIN=4, PREFIX_MIN=5, MAX=20, BULK=10;
    var norm=function(s){return String(s).toUpperCase().replace(/[^A-Z0-9]/g,"")};
    var N=new Array(PARTS.length), IDX=new Map();
    for(var i=0;i<PARTS.length;i++){N[i]=norm(PARTS[i][0]); if(!IDX.has(N[i])) IDX.set(N[i],i)}
    function single(raw){
      var q=String(raw||"").trim().slice(0,80), n=norm(q), Q=q.toUpperCase(), words=/[A-Z]{4,}/.test(Q);
      if(n.length<MIN&&!words) return {mode:"short",n:n,more:false,items:[]};
      var hits=[], seen={}, more=false;
      function add(i){ if(seen[i]) return; if(hits.length>=MAX){more=true;return} seen[i]=1; hits.push(i) }
      if(n.length>=MIN){
        var e=IDX.get(n); if(e!==undefined) add(e);
        if(n.length>=PREFIX_MIN){ for(var k=0;k<N.length&&!more;k++){ if(N[k].indexOf(n)===0) add(k) } }
      }
      if(words&&!more){
        var W=Q.split(/\s+/).filter(function(w){return w.length>=2});
        for(var k=0;k<PARTS.length&&!more;k++){
          var d=PARTS[k][1].toUpperCase(), ok=true;
          for(var w=0;w<W.length;w++){ if(d.indexOf(W[w])<0){ok=false;break} }
          if(ok) add(k);
        }
      }
      return {mode:"single",n:n,more:more,items:hits.map(function(i){return PARTS[i]})};
    }
    function bulk(list){
      var uniq=[], seen={};
      (list||[]).forEach(function(t){ t=String(t).trim().toUpperCase().slice(0,60); var k=norm(t); if(k&&!seen[k]){seen[k]=1;uniq.push(t)} });
      var chk=uniq.slice(0,BULK), items=[], missing=[];
      chk.forEach(function(t){ var i=IDX.get(norm(t)); if(i!==undefined) items.push(PARTS[i]); else missing.push(t) });
      return {mode:"bulk",items:items,missing:missing,checked:chk};
    }
    return {single:single,bulk:bulk,count:PARTS.length,has:function(p){return IDX.has(norm(p))}};
  }
export { makeEngine };
