/**
 * Le Mentor du Jury — Module autonome
 * Bulle flottante pédagogique pour les quiz VAE DEES
 * Ne donne JAMAIS la réponse directe, souffle des mots-clés
 */
(function(){
  'use strict';

  // ── Configuration ──
  var HESITATION_DELAY = 15000; // 15 secondes
  var BUBBLE_DURATION  = 12000; // bulle visible 12s puis fade
  var AUTO_HIDE        = true;

  // ── State ──
  var hesitationTimer = null;
  var autoHideTimer   = null;
  var bubbleEl        = null;
  var initialized     = false;
  var visible         = false;

  // ── Dictionnaire de mots-clés DEES ──
  var THEORISTS = [
    'Winnicott','Rogers','Vygotski','Vygotsky','Piaget','Freud','Bowlby',
    'Makarenko','Korczak','Freire','Dewey','Bruner','Bandura','Erikson',
    'Maslow','Meirieu','Rouzel','Capul','Lemay','Gaberan','Hébert',
    'Deligny','Tosquelles','Oury','Mannoni','Dolto'
  ];
  var LAWS = [
    'Loi 2002-2','Loi 2005','Loi 2007','Loi 2016','Loi 2022',
    'CIDE','CASF','Code pénal','RBPP','ANESM','HAS',
    'art. 3','art. 12','art. 375'
  ];
  var DC_NAMES = {
    'DC1':'Relation éducative','dc1':'Relation éducative',
    'DC2':'Conception de projet','dc2':'Conception de projet',
    'DC3':'Communication professionnelle','dc3':'Communication professionnelle',
    'DC4':'Dynamiques interinstitutionnelles','dc4':'Dynamiques interinstitutionnelles',
    'multi':'Transversal'
  };

  // ── Templates de messages ──
  var HESITATION_TEMPLATES = [
    function(kw){ return 'Un petit coup de pouce ? Pensez au concept de <b>'+kw+'</b>... Le jury attend cette référence.'; },
    function(kw){ return 'Le jury apprécierait que vous mobilisiez <b>'+kw+'</b> ici. Quel lien avec cette situation ?'; },
    function(kw){ return 'Réfléchissez à <b>'+kw+'</b>. C\'est un incontournable du référentiel DEES.'; },
    function(kw){ return 'Prenez votre temps. Pensez à <b>'+kw+'</b> et à son application pratique.'; }
  ];
  var HESITATION_GENERIC = [
    'Prenez le temps de relire chaque proposition. Le verbe d\'action dominant vous guidera.',
    'Le jury valorise la réflexion. Quel est le mot-clé professionnel dans ces propositions ?',
    'Posture éducative : quel choix reflète une démarche <b>professionnelle</b> et non personnelle ?',
    'Relisez en vous demandant : quelle option montre une <b>analyse de la situation</b> ?'
  ];

  var WRONG_TEMPLATES = [
    function(kw){ return 'Pas tout à fait. Le jury attend de la précision sur <b>'+kw+'</b>. Réessayez mentalement.'; },
    function(kw){ return 'Attention, relisez en intégrant la notion de <b>'+kw+'</b>. C\'est la clé ici.'; },
    function(kw){ return 'Le jury serait exigeant sur ce point. Pensez à <b>'+kw+'</b> pour comprendre la bonne logique.'; }
  ];
  var WRONG_GENERIC = [
    'Ce n\'est pas la bonne piste. Cherchez l\'option qui reflète une <b>posture professionnelle</b>.',
    'Le jury attend une réponse ancrée dans la <b>pratique éducative</b>. Relisez avec cet angle.',
    'Attention à ne pas confondre réaction personnelle et <b>démarche éducative structurée</b>.'
  ];

  var CORRECT_TEMPLATES = [
    function(card){ return 'Exact ! Notez bien ce terme pour l\'oral. Le jury valorise cette précision.'; },
    function(card){
      var dc = card.dc || card.dcClass || '';
      var name = DC_NAMES[dc] || '';
      return name ? 'Bravo ! Maîtriser <b>'+name+'</b> est essentiel face au jury.' : 'Bien joué ! Retenez cette logique pour l\'oral.';
    },
    function(card){
      var sit = extractSituation(card);
      return sit ? 'Exact ! À l\'oral, liez cette réponse à votre expérience avec <b>'+sit+'</b>.' : 'Parfait. Le jury serait convaincu par cette réponse.';
    },
    function(card){ return 'Très bien ! Ce type de raisonnement montre votre <b>posture professionnelle</b> au jury.'; }
  ];

  // ── Extraction de mots-clés ──
  function extractTheorist(text){
    if(!text) return null;
    for(var i=0;i<THEORISTS.length;i++){
      if(text.indexOf(THEORISTS[i]) !== -1) return THEORISTS[i];
    }
    return null;
  }
  function extractLaw(text){
    if(!text) return null;
    for(var i=0;i<LAWS.length;i++){
      if(text.indexOf(LAWS[i]) !== -1) return LAWS[i];
    }
    return null;
  }
  function extractKeyword(card){
    // Priorité : théoricien > loi > compétence > DC
    var t = extractTheorist(card.theorie || card.theory || '');
    if(t) return t;
    var l = extractLaw(card.loi || card.law || '');
    if(l) return l;
    if(card.comp) return card.comp;
    var dc = card.dc || card.dcClass || '';
    if(DC_NAMES[dc]) return DC_NAMES[dc];
    return null;
  }
  function extractSituation(card){
    if(!card.situation) return null;
    var m = card.situation.match(/^([^—–\-]+)/);
    return m ? m[1].trim() : card.situation.substring(0,20);
  }
  function pickRandom(arr){
    return arr[Math.floor(Math.random()*arr.length)];
  }

  // ── Injection CSS ──
  function injectStyles(){
    var css = '\
#mentor-bubble{position:fixed;bottom:20px;right:16px;max-width:320px;min-width:200px;\
background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:#fff;\
border-radius:16px 16px 4px 16px;padding:0;z-index:95;box-shadow:0 8px 32px rgba(0,0,0,.25);\
transform:translateY(120%);opacity:0;transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .3s ease;\
pointer-events:none;font-family:"Segoe UI",system-ui,-apple-system,sans-serif}\
#mentor-bubble.visible{transform:translateY(0);opacity:1;pointer-events:auto}\
#mentor-bubble .mentor-header{display:flex;align-items:center;gap:8px;padding:10px 14px 6px;\
border-bottom:1px solid rgba(255,255,255,.1)}\
#mentor-bubble .mentor-avatar{width:32px;height:32px;background:linear-gradient(135deg,#fbbf24,#f59e0b);\
border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}\
#mentor-bubble .mentor-name{font-size:.75rem;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:1px}\
#mentor-bubble .mentor-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.5);\
font-size:18px;cursor:pointer;padding:0 2px;line-height:1;transition:color .2s}\
#mentor-bubble .mentor-close:hover{color:#fff}\
#mentor-bubble .mentor-body{padding:10px 14px 14px;font-size:.88rem;line-height:1.55}\
#mentor-bubble .mentor-body b{color:#fbbf24;font-weight:700}\
#mentor-bubble .mentor-typing{display:inline-block;width:6px;height:6px;background:#fbbf24;\
border-radius:50%;margin-left:2px;animation:mentorDot 1s infinite}\
#mentor-bubble .mentor-typing:nth-child(2){animation-delay:.2s}\
#mentor-bubble .mentor-typing:nth-child(3){animation-delay:.4s}\
@keyframes mentorDot{0%,80%,100%{opacity:.3}40%{opacity:1}}\
@media(max-width:400px){#mentor-bubble{right:10px;bottom:14px;max-width:calc(100vw - 20px);font-size:.84rem}}\
';
    var style = document.createElement('style');
    style.id = 'mentor-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Création du DOM ──
  function createBubble(){
    if(bubbleEl) return;
    var el = document.createElement('div');
    el.id = 'mentor-bubble';
    el.innerHTML = '\
<div class="mentor-header">\
  <div class="mentor-avatar">&#127891;</div>\
  <span class="mentor-name">Mentor du Jury</span>\
  <button class="mentor-close" aria-label="Fermer">&times;</button>\
</div>\
<div class="mentor-body"></div>';
    document.body.appendChild(el);
    bubbleEl = el;
    el.querySelector('.mentor-close').addEventListener('click', function(){ hide(); });
  }

  // ── Affichage / Masquage ──
  function show(html, opts){
    if(!bubbleEl) createBubble();
    clearTimeout(autoHideTimer);

    var body = bubbleEl.querySelector('.mentor-body');

    // Typing effect — brief dots then message
    body.innerHTML = '<span class="mentor-typing"></span><span class="mentor-typing"></span><span class="mentor-typing"></span>';
    bubbleEl.classList.add('visible');
    visible = true;

    setTimeout(function(){
      body.innerHTML = html;
    }, 600);

    if(AUTO_HIDE){
      autoHideTimer = setTimeout(function(){ hide(); }, BUBBLE_DURATION);
    }
  }

  function hide(){
    if(!bubbleEl) return;
    bubbleEl.classList.remove('visible');
    visible = false;
    clearTimeout(autoHideTimer);
  }

  // ── Timer d'hésitation ──
  function startHesitationTimer(card){
    clearTimeout(hesitationTimer);
    hesitationTimer = setTimeout(function(){
      var kw = extractKeyword(card);
      var msg;
      if(kw){
        msg = pickRandom(HESITATION_TEMPLATES)(kw);
      } else {
        msg = pickRandom(HESITATION_GENERIC);
      }
      show(msg);
    }, HESITATION_DELAY);
  }

  function cancelHesitationTimer(){
    clearTimeout(hesitationTimer);
  }

  // ── API Publique ──
  window.Mentor = {
    init: function(){
      if(initialized) return;
      injectStyles();
      createBubble();
      initialized = true;
    },

    onQuestionShown: function(card){
      if(!initialized) this.init();
      hide();
      if(card) startHesitationTimer(card);
    },

    onAnswerCorrect: function(card){
      cancelHesitationTimer();
      card = card || {};
      var msg = pickRandom(CORRECT_TEMPLATES)(card);
      show(msg);
    },

    onAnswerWrong: function(card, chosenIndex){
      cancelHesitationTimer();
      card = card || {};
      var kw = extractKeyword(card);
      var msg;
      if(kw){
        msg = pickRandom(WRONG_TEMPLATES)(kw);
      } else {
        msg = pickRandom(WRONG_GENERIC);
      }
      show(msg);
    },

    hide: hide,

    destroy: function(){
      cancelHesitationTimer();
      clearTimeout(autoHideTimer);
      if(bubbleEl && bubbleEl.parentNode){
        bubbleEl.parentNode.removeChild(bubbleEl);
      }
      var style = document.getElementById('mentor-styles');
      if(style) style.parentNode.removeChild(style);
      bubbleEl = null;
      initialized = false;
    }
  };

})();
