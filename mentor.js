/**
 * Le Mentor du Jury — Module autonome v2
 * Bulle flottante pédagogique pour les quiz VAE DEES
 * Ne donne JAMAIS la réponse directe, souffle des mots-clés
 *
 * Fonctionnalités :
 * - Base de connaissances DEES complète (théoriciens, lois, DC, liens croisés)
 * - Indices progressifs (3 niveaux)
 * - Compteur de progression (suivi des faiblesses par DC/concept)
 * - Mode examen (désactivation du Mentor)
 */
(function(){
  'use strict';

  // ── Configuration ──
  var HESITATION_DELAY = 10000; // 10 secondes
  var BUBBLE_DURATION  = 14000; // bulle visible 14s
  var AUTO_HIDE        = true;
  var HINT_LEVEL_DELAYS = [10000, 18000, 26000]; // Niveaux 1, 2, 3

  // ── State ──
  var hesitationTimers = [];
  var autoHideTimer    = null;
  var bubbleEl         = null;
  var toggleEl         = null;
  var initialized      = false;
  var visible          = false;
  var examMode         = false;
  var currentCard      = null;
  var currentHintLevel = 0;

  // ══════════════════════════════════════════════════════════════
  // ██ BASE DE CONNAISSANCES DEES COMPLÈTE
  // ══════════════════════════════════════════════════════════════

  var KNOWLEDGE = {
    theorists: {
      'Winnicott':    { concept: 'environnement suffisamment bon, holding, objet transitionnel', dc: ['DC1'], linked: ['Bowlby','Dolto'] },
      'Rogers':       { concept: 'considération positive inconditionnelle, empathie, congruence', dc: ['DC1'], linked: ['Maslow','Gordon'] },
      'Vygotski':     { concept: 'zone proximale de développement (ZPD), étayage, médiation', dc: ['DC1','DC2'], linked: ['Bruner','Piaget'] },
      'Piaget':       { concept: 'stades de développement, assimilation/accommodation', dc: ['DC1'], linked: ['Vygotski','Wallon'] },
      'Bowlby':       { concept: 'théorie de l\'attachement, base de sécurité', dc: ['DC1'], linked: ['Winnicott','Ainsworth'] },
      'Freud':        { concept: 'inconscient, transfert, mécanismes de défense', dc: ['DC1'], linked: ['Dolto','Mannoni'] },
      'Erikson':      { concept: 'stades psychosociaux, crise identitaire', dc: ['DC1'], linked: ['Freud','Marcia'] },
      'Maslow':       { concept: 'pyramide des besoins, auto-actualisation', dc: ['DC1','DC2'], linked: ['Rogers','Henderson'] },
      'Bandura':      { concept: 'apprentissage social, auto-efficacité, modeling', dc: ['DC1','DC2'], linked: ['Vygotski'] },
      'Bruner':       { concept: 'étayage, apprentissage par découverte', dc: ['DC1','DC2'], linked: ['Vygotski'] },
      'Makarenko':    { concept: 'pédagogie collective, discipline consciente', dc: ['DC1','DC2'], linked: ['Korczak','Freire'] },
      'Korczak':      { concept: 'droits de l\'enfant, respect, auto-gouvernement', dc: ['DC1','DC4'], linked: ['CIDE','Makarenko'] },
      'Freire':       { concept: 'pédagogie des opprimés, conscientisation, empowerment', dc: ['DC1','DC4'], linked: ['Makarenko'] },
      'Dewey':        { concept: 'learning by doing, expérience éducative', dc: ['DC1','DC2'], linked: ['Bruner'] },
      'Meirieu':      { concept: 'pédagogie différenciée, moment pédagogique', dc: ['DC1','DC2'], linked: ['Vygotski'] },
      'Rouzel':       { concept: 'acte éducatif, clinique éducative, transfert', dc: ['DC1','DC3'], linked: ['Freud','Gaberan'] },
      'Capul':        { concept: 'éducation spécialisée, internat, projet individualisé', dc: ['DC2'], linked: ['Rouzel'] },
      'Lemay':        { concept: 'résilience, carence affective, suppléance familiale', dc: ['DC1'], linked: ['Bowlby','Cyrulnik'] },
      'Gaberan':      { concept: 'relation éducative, autorité éducative, être éducateur', dc: ['DC1'], linked: ['Rouzel'] },
      'Deligny':      { concept: 'lignes d\'erre, réseau, non-verbal', dc: ['DC1','DC4'], linked: ['Tosquelles'] },
      'Tosquelles':   { concept: 'psychothérapie institutionnelle, institution soignante', dc: ['DC4'], linked: ['Oury','Deligny'] },
      'Oury':         { concept: 'pédagogie institutionnelle, conseil, médiation', dc: ['DC1','DC4'], linked: ['Tosquelles'] },
      'Mannoni':      { concept: 'enfant et sa maladie, institution éclatée', dc: ['DC1'], linked: ['Freud','Dolto'] },
      'Dolto':        { concept: 'image inconsciente du corps, castration symboligène', dc: ['DC1'], linked: ['Freud','Winnicott'] },
      'Cyrulnik':     { concept: 'résilience, tuteur de résilience, oxymoron', dc: ['DC1'], linked: ['Bowlby','Lemay'] },
      'Wallon':       { concept: 'développement psychomoteur, émotion et cognition', dc: ['DC1'], linked: ['Piaget'] },
      'Hébert':       { concept: 'méthode naturelle, éducation physique, scoutisme', dc: ['DC1','DC2'], linked: ['Dewey'] },
      'Gordon':       { concept: 'écoute active, message-je, résolution de conflits', dc: ['DC1','DC3'], linked: ['Rogers'] },
      'Henderson':    { concept: '14 besoins fondamentaux, autonomie', dc: ['DC1','DC2'], linked: ['Maslow'] },
      'Ainsworth':    { concept: 'situation étrange, styles d\'attachement', dc: ['DC1'], linked: ['Bowlby'] }
    },

    laws: {
      'Loi 2002-2':   { title: 'Rénovation de l\'action sociale', keys: ['droits des usagers','projet personnalisé','participation','livret d\'accueil','contrat de séjour','conseil de vie sociale','dignité','CVS'], dc: ['DC1','DC2','DC4'] },
      'Loi 2005':     { title: 'Égalité des droits et des chances (handicap)', keys: ['inclusion','accessibilité','compensation','MDPH','PPS','CDAPH','droit à compensation'], dc: ['DC1','DC2','DC4'] },
      'Loi 2007':     { title: 'Protection de l\'enfance', keys: ['intérêt de l\'enfant','signalement','information préoccupante','IP','CRIP','protection administrative','judiciaire','PPE'], dc: ['DC1','DC4'] },
      'Loi 2016':     { title: 'Protection de l\'enfant (réforme)', keys: ['projet pour l\'enfant','PPE','référent ASE','tiers digne de confiance','adoption','délaissement'], dc: ['DC1','DC2','DC4'] },
      'Loi 2022':     { title: 'Protection des enfants (Taquet)', keys: ['interdiction hébergement hôtelier','parrainage','fratrie','sortie ASE','18-21 ans'], dc: ['DC1','DC4'] },
      'CIDE':         { title: 'Convention Internationale Droits de l\'Enfant', keys: ['intérêt supérieur','art. 3','art. 12','participation','non-discrimination','survie','développement'], dc: ['DC1','DC4'] },
      'CASF':         { title: 'Code de l\'Action Sociale et des Familles', keys: ['missions','établissements','autorisation','évaluation','ESSMS'], dc: ['DC2','DC4'] },
      'RBPP':         { title: 'Recommandations de Bonnes Pratiques Professionnelles', keys: ['HAS','ANESM','bientraitance','personnalisation','projet personnalisé'], dc: ['DC2','DC3','DC4'] },
      'Loi 2002-303': { title: 'Droits des malades (Kouchner)', keys: ['consentement éclairé','information','accès au dossier'], dc: ['DC1','DC3'] },
      'Loi 1975':     { title: 'Loi d\'orientation en faveur des personnes handicapées', keys: ['obligation nationale','prévention','soins','éducation','intégration'], dc: ['DC4'] },
      'Secret pro':   { title: 'Secret professionnel (art. 226-13 Code pénal)', keys: ['confidentialité','secret partagé','partage d\'informations','art. L226-2-2 CASF'], dc: ['DC3','DC4'] }
    },

    dc: {
      'DC1': {
        name: 'Relation éducative spécialisée',
        competences: ['observation','écoute','relation de confiance','cadre éducatif','médiation','accompagnement quotidien','soutien à la parentalité','gestion des conflits','posture professionnelle','distance professionnelle','bientraitance'],
        verbs: ['observer','écouter','accompagner','soutenir','médiatiser','contenir','étayer','adapter','individualiser']
      },
      'DC2': {
        name: 'Conception et conduite de projet éducatif spécialisé',
        competences: ['diagnostic éducatif','projet personnalisé','objectifs SMART','évaluation','co-construction','projet d\'établissement','PPA','PIA','indicateurs'],
        verbs: ['diagnostiquer','concevoir','planifier','évaluer','ajuster','co-construire','formaliser']
      },
      'DC3': {
        name: 'Communication professionnelle',
        competences: ['écrits professionnels','transmissions','synthèse','compte-rendu','secret partagé','communication en équipe','analyse de pratiques','supervision'],
        verbs: ['transmettre','rédiger','synthétiser','argumenter','partager','restituer','communiquer']
      },
      'DC4': {
        name: 'Dynamiques interinstitutionnelles et partenariats',
        competences: ['réseau','partenariat','territoire','politique publique','travail en équipe pluridisciplinaire','institution','ESSMS','gouvernance','coordination'],
        verbs: ['coordonner','articuler','mobiliser','inscrire','situer','analyser','coopérer']
      }
    },

    situations: {
      'N':    { context: 'Perthes', description: 'enfant hospitalisée, maladie de Legg-Perthes-Calvé, méfiance initiale, fatigue/douleur, inclusion scolaire', dc: ['DC1','DC2'], theories: ['Winnicott','Bowlby'], laws: ['Loi 2002-2','Loi 2005','CIDE'] },
      'R':    { context: 'Vergers', description: 'enfant impulsif, comportements perturbateurs, transitions difficiles, régulation émotionnelle', dc: ['DC1','DC2'], theories: ['Vygotski','Bandura'], laws: ['Loi 2002-2','Loi 2007'] },
      'Amir': { context: 'FINC', description: 'adolescent isolé, centre communautaire, non-participation, engagement jeunesse, moniteur-éducateur', dc: ['DC1','DC4'], theories: ['Freire','Makarenko'], laws: ['CIDE','CASF'] }
    },

    // Liens croisés : quand un concept X apparaît, le Mentor peut faire un pont vers Y
    crossLinks: [
      { from: 'relation de confiance', to: 'Winnicott', hint: 'holding et environnement suffisamment bon' },
      { from: 'cadre', to: 'Loi 2002-2', hint: 'droit à la participation et au respect de la dignité' },
      { from: 'inclusion', to: 'Loi 2005', hint: 'droit à la compensation et accessibilité' },
      { from: 'protection', to: 'Loi 2007', hint: 'information préoccupante et intérêt de l\'enfant' },
      { from: 'projet', to: 'DC2', hint: 'diagnostic éducatif → objectifs → évaluation' },
      { from: 'écrits', to: 'DC3', hint: 'transmissions ciblées et secret partagé' },
      { from: 'partenariat', to: 'DC4', hint: 'réseau et coordination interinstitutionnelle' },
      { from: 'ZPD', to: 'Vygotski', hint: 'zone proximale de développement et étayage' },
      { from: 'attachement', to: 'Bowlby', hint: 'base de sécurité et figure d\'attachement' },
      { from: 'résilience', to: 'Cyrulnik', hint: 'tuteur de résilience et oxymoron' },
      { from: 'empowerment', to: 'Freire', hint: 'conscientisation et pédagogie des opprimés' },
      { from: 'bientraitance', to: 'RBPP', hint: 'recommandations HAS/ANESM' },
      { from: 'PPE', to: 'Loi 2016', hint: 'projet pour l\'enfant et référent ASE' },
      { from: 'CVS', to: 'Loi 2002-2', hint: 'conseil de vie sociale et participation' },
      { from: 'MDPH', to: 'Loi 2005', hint: 'maison départementale des personnes handicapées' },
      { from: 'observation', to: 'DC1', hint: 'posture d\'observation clinique et éducative' },
      { from: 'distance', to: 'Rouzel', hint: 'juste distance et clinique éducative' },
      { from: 'transfert', to: 'Freud', hint: 'relation transférentielle et contre-transfert' }
    ]
  };

  // ══════════════════════════════════════════════════════════════
  // ██ COMPTEUR DE PROGRESSION (suivi des faiblesses)
  // ══════════════════════════════════════════════════════════════

  var progression = {
    dc: { DC1: {ok:0,ko:0}, DC2: {ok:0,ko:0}, DC3: {ok:0,ko:0}, DC4: {ok:0,ko:0} },
    concepts: {},   // { 'Winnicott': {ok:0,ko:0}, ... }
    totalOk: 0,
    totalKo: 0
  };

  function loadProgression(){
    try {
      var saved = localStorage.getItem('mentor_progression');
      if(saved) progression = JSON.parse(saved);
    } catch(e){}
  }
  function saveProgression(){
    try { localStorage.setItem('mentor_progression', JSON.stringify(progression)); } catch(e){}
  }
  function recordResult(card, correct){
    var dc = card.dc || card.dcClass || '';
    dc = dc.toUpperCase();
    if(progression.dc[dc]){
      if(correct) progression.dc[dc].ok++; else progression.dc[dc].ko++;
    }
    // Track concept
    var kw = extractMainKeyword(card);
    if(kw){
      if(!progression.concepts[kw]) progression.concepts[kw] = {ok:0,ko:0};
      if(correct) progression.concepts[kw].ok++; else progression.concepts[kw].ko++;
    }
    if(correct) progression.totalOk++; else progression.totalKo++;
    saveProgression();
  }
  function getWeakDC(){
    var worst = null, worstRate = 1;
    for(var dc in progression.dc){
      var d = progression.dc[dc];
      var total = d.ok + d.ko;
      if(total >= 2){
        var rate = d.ok / total;
        if(rate < worstRate){ worstRate = rate; worst = dc; }
      }
    }
    return (worst && worstRate < 0.6) ? worst : null;
  }
  function getWeakConcepts(limit){
    var arr = [];
    for(var c in progression.concepts){
      var d = progression.concepts[c];
      var total = d.ok + d.ko;
      if(total >= 2 && (d.ok/total) < 0.5) arr.push({name:c, rate: d.ok/total, total: total});
    }
    arr.sort(function(a,b){ return a.rate - b.rate; });
    return arr.slice(0, limit || 3);
  }

  // ══════════════════════════════════════════════════════════════
  // ██ EXTRACTION DE MOTS-CLÉS (enrichie)
  // ══════════════════════════════════════════════════════════════

  function extractAllTheorists(text){
    if(!text) return [];
    var found = [];
    for(var name in KNOWLEDGE.theorists){
      if(text.indexOf(name) !== -1) found.push(name);
    }
    return found;
  }
  function extractAllLaws(text){
    if(!text) return [];
    var found = [];
    for(var law in KNOWLEDGE.laws){
      if(text.indexOf(law) !== -1) found.push(law);
    }
    return found;
  }
  function extractMainKeyword(card){
    var theorists = extractAllTheorists(card.theorie || card.theory || '');
    if(theorists.length) return theorists[0];
    var laws = extractAllLaws(card.loi || card.law || '');
    if(laws.length) return laws[0];
    if(card.comp) return card.comp;
    var dc = (card.dc || card.dcClass || '').toUpperCase();
    if(KNOWLEDGE.dc[dc]) return dc;
    return null;
  }
  function extractSituation(card){
    if(!card.situation) return null;
    var m = card.situation.match(/^([^—–\-]+)/);
    return m ? m[1].trim() : card.situation.substring(0,20);
  }
  function findCrossLink(card){
    var text = (card.q || '') + ' ' + (card.comp || '') + ' ' + (card.theorie || '') + ' ' + (card.loi || '');
    text = text.toLowerCase();
    for(var i=0; i<KNOWLEDGE.crossLinks.length; i++){
      var link = KNOWLEDGE.crossLinks[i];
      if(text.indexOf(link.from.toLowerCase()) !== -1){
        return link;
      }
    }
    return null;
  }
  function getTheoristInfo(name){
    return KNOWLEDGE.theorists[name] || null;
  }
  function getLawInfo(name){
    return KNOWLEDGE.laws[name] || null;
  }
  function getDCInfo(dc){
    dc = (dc||'').toUpperCase();
    return KNOWLEDGE.dc[dc] || null;
  }
  function pickRandom(arr){
    return arr[Math.floor(Math.random()*arr.length)];
  }

  // ══════════════════════════════════════════════════════════════
  // ██ INDICES PROGRESSIFS (3 niveaux)
  // ══════════════════════════════════════════════════════════════

  function buildHintLevel1(card){
    // Niveau 1 : Mot-clé simple
    var theorists = extractAllTheorists(card.theorie || card.theory || '');
    if(theorists.length){
      return 'Un petit coup de pouce ? Pensez à <b>'+theorists[0]+'</b>...';
    }
    var laws = extractAllLaws(card.loi || card.law || '');
    if(laws.length){
      return 'Pensez à la <b>'+laws[0]+'</b>. Le jury attend un ancrage juridique.';
    }
    if(card.comp){
      return 'Cette question mobilise : <b>'+card.comp+'</b>.';
    }
    var dc = (card.dc || card.dcClass || '').toUpperCase();
    var dcInfo = getDCInfo(dc);
    if(dcInfo){
      return 'Vous êtes dans le champ de <b>'+dcInfo.name+'</b>. Quel verbe d\'action ?';
    }
    return 'Prenez le temps de relire. Quel est le <b>mot-clé professionnel</b> dominant ?';
  }

  function buildHintLevel2(card){
    // Niveau 2 : Concept + lien
    var theorists = extractAllTheorists(card.theorie || card.theory || '');
    if(theorists.length){
      var info = getTheoristInfo(theorists[0]);
      if(info){
        var concept = info.concept.split(',')[0].trim();
        return '<b>'+theorists[0]+'</b> → pensez à son concept de <b>'+concept+'</b>. Comment s\'applique-t-il ici ?';
      }
    }
    var laws = extractAllLaws(card.loi || card.law || '');
    if(laws.length){
      var lawInfo = getLawInfo(laws[0]);
      if(lawInfo && lawInfo.keys.length){
        return '<b>'+laws[0]+'</b> : pensez aux notions de <b>'+lawInfo.keys[0]+'</b> et <b>'+lawInfo.keys[1]+'</b>.';
      }
    }
    var crossLink = findCrossLink(card);
    if(crossLink){
      return 'Faites le lien avec <b>'+crossLink.to+'</b> → '+crossLink.hint+'.';
    }
    var dc = (card.dc || card.dcClass || '').toUpperCase();
    var dcInfo = getDCInfo(dc);
    if(dcInfo && dcInfo.verbs.length){
      return 'En <b>'+dc+'</b>, le jury attend des verbes comme : <b>'+dcInfo.verbs.slice(0,3).join('</b>, <b>')+'</b>.';
    }
    return 'Cherchez l\'option qui reflète une <b>démarche éducative structurée</b>, pas une réaction spontanée.';
  }

  function buildHintLevel3(card){
    // Niveau 3 : Explication approfondie (sans donner la réponse)
    var parts = [];
    var dc = (card.dc || card.dcClass || '').toUpperCase();
    var dcInfo = getDCInfo(dc);
    if(dcInfo){
      parts.push('<b>'+dc+' — '+dcInfo.name+'</b>');
    }
    var theorists = extractAllTheorists(card.theorie || card.theory || '');
    if(theorists.length){
      var info = getTheoristInfo(theorists[0]);
      if(info){
        parts.push('Mobilisez <b>'+theorists[0]+'</b> ('+info.concept.split(',')[0].trim()+')');
        if(info.linked && info.linked.length){
          parts.push('Lien possible avec <b>'+info.linked[0]+'</b>');
        }
      }
    }
    var laws = extractAllLaws(card.loi || card.law || '');
    if(laws.length){
      var lawInfo = getLawInfo(laws[0]);
      if(lawInfo){
        parts.push('<b>'+laws[0]+'</b> : '+lawInfo.title);
      }
    }
    // Progression feedback
    var weakDC = getWeakDC();
    if(weakDC && weakDC === dc){
      parts.push('⚠️ <b>'+weakDC+'</b> est votre point faible — concentrez-vous !');
    }
    if(parts.length === 0){
      return 'Éliminez les réponses qui semblent <b>non professionnelles</b>. Le jury veut une posture réflexive, pas réactive.';
    }
    return parts.join('<br>');
  }

  // ══════════════════════════════════════════════════════════════
  // ██ MESSAGES APRÈS RÉPONSE
  // ══════════════════════════════════════════════════════════════

  function buildCorrectMessage(card){
    var msgs = [];
    var dc = (card.dc || card.dcClass || '').toUpperCase();
    var dcInfo = getDCInfo(dc);
    // Base encouragement
    var bases = [
      'Exact ! Le jury serait convaincu.',
      'Très bien ! Vous maîtrisez ce point.',
      'Parfait. Notez ce raisonnement pour l\'oral.'
    ];
    msgs.push(pickRandom(bases));
    // Cross-reference enrichment
    var theorists = extractAllTheorists(card.theorie || card.theory || '');
    if(theorists.length){
      var info = getTheoristInfo(theorists[0]);
      if(info && info.linked && info.linked.length){
        msgs.push('À l\'oral, vous pourriez aussi citer <b>'+info.linked[0]+'</b> pour enrichir.');
      }
    }
    // Situation tip
    var sit = extractSituation(card);
    if(sit){
      msgs.push('Ancrez avec votre expérience : <b>'+sit+'</b>.');
    }
    // Weak DC encouragement
    var weakDC = getWeakDC();
    if(weakDC && weakDC === dc){
      msgs.push('💪 Bon progrès sur <b>'+dc+'</b> — continuez !');
    }
    return msgs.join(' ');
  }

  function buildWrongMessage(card){
    var msgs = [];
    var bases = [
      'Pas tout à fait.',
      'Ce n\'est pas la bonne piste.',
      'Attention, le jury serait exigeant ici.'
    ];
    msgs.push(pickRandom(bases));
    // Keyword hint
    var theorists = extractAllTheorists(card.theorie || card.theory || '');
    if(theorists.length){
      var info = getTheoristInfo(theorists[0]);
      if(info){
        msgs.push('Pensez à <b>'+theorists[0]+'</b> et son concept de <b>'+info.concept.split(',')[0].trim()+'</b>.');
      }
    } else {
      var laws = extractAllLaws(card.loi || card.law || '');
      if(laws.length){
        msgs.push('Relisez en intégrant la <b>'+laws[0]+'</b>.');
      } else if(card.comp){
        msgs.push('La compétence visée est : <b>'+card.comp+'</b>.');
      } else {
        msgs.push('Cherchez l\'option la plus <b>professionnelle</b>.');
      }
    }
    // Weak concept warning
    var weakConcepts = getWeakConcepts(1);
    if(weakConcepts.length){
      msgs.push('📌 Point à revoir : <b>'+weakConcepts[0].name+'</b>.');
    }
    return msgs.join(' ');
  }

  // ══════════════════════════════════════════════════════════════
  // ██ CSS & DOM
  // ══════════════════════════════════════════════════════════════

  function injectStyles(){
    var css = '\
#mentor-bubble{position:fixed;bottom:20px;right:16px;max-width:340px;min-width:220px;\
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
#mentor-bubble .mentor-level{font-size:.65rem;color:rgba(255,255,255,.4);margin-left:4px}\
#mentor-bubble .mentor-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.5);\
font-size:18px;cursor:pointer;padding:0 2px;line-height:1;transition:color .2s}\
#mentor-bubble .mentor-close:hover{color:#fff}\
#mentor-bubble .mentor-body{padding:10px 14px 14px;font-size:.86rem;line-height:1.6}\
#mentor-bubble .mentor-body b{color:#fbbf24;font-weight:700}\
#mentor-bubble .mentor-body br+b{margin-top:2px}\
#mentor-bubble .mentor-typing{display:inline-block;width:6px;height:6px;background:#fbbf24;\
border-radius:50%;margin-left:2px;animation:mentorDot 1s infinite}\
#mentor-bubble .mentor-typing:nth-child(2){animation-delay:.2s}\
#mentor-bubble .mentor-typing:nth-child(3){animation-delay:.4s}\
@keyframes mentorDot{0%,80%,100%{opacity:.3}40%{opacity:1}}\
#mentor-toggle{position:fixed;bottom:20px;right:16px;width:48px;height:48px;\
background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid #fbbf24;\
border-radius:50%;display:flex;align-items:center;justify-content:center;\
font-size:24px;cursor:pointer;z-index:94;box-shadow:0 4px 16px rgba(0,0,0,.2);\
transition:all .3s ease}\
#mentor-toggle:hover{transform:scale(1.1)}\
#mentor-toggle.exam-mode{background:#dc2626;border-color:#fff;opacity:.6}\
#mentor-toggle.exam-mode::after{content:"OFF";position:absolute;bottom:-16px;\
font-size:.55rem;color:#dc2626;font-weight:700}\
@media(max-width:400px){#mentor-bubble{right:10px;bottom:14px;max-width:calc(100vw - 20px);font-size:.82rem}\
#mentor-toggle{bottom:14px;right:10px;width:42px;height:42px;font-size:20px}}\
';
    var style = document.createElement('style');
    style.id = 'mentor-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createBubble(){
    if(bubbleEl) return;
    var el = document.createElement('div');
    el.id = 'mentor-bubble';
    el.innerHTML = '\
<div class="mentor-header">\
  <div class="mentor-avatar">&#127891;</div>\
  <span class="mentor-name">Mentor du Jury</span>\
  <span class="mentor-level"></span>\
  <button class="mentor-close" aria-label="Fermer">&times;</button>\
</div>\
<div class="mentor-body"></div>';
    document.body.appendChild(el);
    bubbleEl = el;
    el.querySelector('.mentor-close').addEventListener('click', function(){ hide(); });
  }

  function createToggle(){
    if(toggleEl) return;
    var el = document.createElement('div');
    el.id = 'mentor-toggle';
    el.innerHTML = '&#127891;';
    el.title = 'Mentor du Jury — Cliquer pour activer/désactiver le mode examen';
    document.body.appendChild(el);
    toggleEl = el;
    el.addEventListener('click', function(){
      examMode = !examMode;
      if(examMode){
        el.classList.add('exam-mode');
        el.innerHTML = '&#128683;';
        hide();
        cancelAllTimers();
        show('🎓 <b>Mode Examen activé.</b> Plus d\'indices — comme face au vrai jury. Bonne chance !');
      } else {
        el.classList.remove('exam-mode');
        el.innerHTML = '&#127891;';
        show('🎓 <b>Mentor réactivé.</b> Je suis là pour vous guider.');
      }
    });
  }

  // ── Affichage / Masquage ──
  function show(html, level){
    if(!bubbleEl) createBubble();
    clearTimeout(autoHideTimer);
    if(toggleEl) toggleEl.style.display = 'none';

    var body = bubbleEl.querySelector('.mentor-body');
    var levelEl = bubbleEl.querySelector('.mentor-level');

    // Show level indicator
    if(level !== undefined && level > 0){
      levelEl.textContent = 'Indice '+level+'/3';
    } else {
      levelEl.textContent = '';
    }

    // Typing effect
    body.innerHTML = '<span class="mentor-typing"></span><span class="mentor-typing"></span><span class="mentor-typing"></span>';
    bubbleEl.classList.add('visible');
    visible = true;

    setTimeout(function(){
      body.innerHTML = html;
    }, 500);

    if(AUTO_HIDE){
      autoHideTimer = setTimeout(function(){ hide(); }, BUBBLE_DURATION);
    }
  }

  function hide(){
    if(!bubbleEl) return;
    bubbleEl.classList.remove('visible');
    visible = false;
    clearTimeout(autoHideTimer);
    // Show toggle button
    if(toggleEl) setTimeout(function(){ if(!visible) toggleEl.style.display = 'flex'; }, 400);
  }

  // ── Timers d'hésitation progressifs ──
  function startHesitationTimers(card){
    cancelAllTimers();
    currentCard = card;
    currentHintLevel = 0;

    if(examMode) return;

    // Niveau 1 — 10s
    hesitationTimers.push(setTimeout(function(){
      if(examMode) return;
      currentHintLevel = 1;
      show(buildHintLevel1(card), 1);
    }, HINT_LEVEL_DELAYS[0]));

    // Niveau 2 — 18s
    hesitationTimers.push(setTimeout(function(){
      if(examMode) return;
      currentHintLevel = 2;
      show(buildHintLevel2(card), 2);
    }, HINT_LEVEL_DELAYS[1]));

    // Niveau 3 — 26s
    hesitationTimers.push(setTimeout(function(){
      if(examMode) return;
      currentHintLevel = 3;
      show(buildHintLevel3(card), 3);
    }, HINT_LEVEL_DELAYS[2]));
  }

  function cancelAllTimers(){
    for(var i=0;i<hesitationTimers.length;i++) clearTimeout(hesitationTimers[i]);
    hesitationTimers = [];
    clearTimeout(autoHideTimer);
  }

  // ══════════════════════════════════════════════════════════════
  // ██ API PUBLIQUE
  // ══════════════════════════════════════════════════════════════

  window.Mentor = {
    init: function(){
      if(initialized) return;
      loadProgression();
      injectStyles();
      createBubble();
      createToggle();
      initialized = true;
    },

    onQuestionShown: function(card){
      if(!initialized) this.init();
      hide();
      currentHintLevel = 0;
      if(card) startHesitationTimers(card);
    },

    onAnswerCorrect: function(card){
      cancelAllTimers();
      card = card || {};
      recordResult(card, true);
      if(examMode) return;
      show(buildCorrectMessage(card));
    },

    onAnswerWrong: function(card, chosenIndex){
      cancelAllTimers();
      card = card || {};
      recordResult(card, false);
      if(examMode) return;
      show(buildWrongMessage(card));
    },

    hide: hide,

    isExamMode: function(){ return examMode; },

    setExamMode: function(val){
      examMode = !!val;
      if(toggleEl){
        if(examMode){ toggleEl.classList.add('exam-mode'); toggleEl.innerHTML = '&#128683;'; }
        else { toggleEl.classList.remove('exam-mode'); toggleEl.innerHTML = '&#127891;'; }
      }
    },

    getProgression: function(){ return progression; },

    resetProgression: function(){
      progression = { dc:{DC1:{ok:0,ko:0},DC2:{ok:0,ko:0},DC3:{ok:0,ko:0},DC4:{ok:0,ko:0}}, concepts:{}, totalOk:0, totalKo:0 };
      saveProgression();
    },

    destroy: function(){
      cancelAllTimers();
      if(bubbleEl && bubbleEl.parentNode) bubbleEl.parentNode.removeChild(bubbleEl);
      if(toggleEl && toggleEl.parentNode) toggleEl.parentNode.removeChild(toggleEl);
      var style = document.getElementById('mentor-styles');
      if(style) style.parentNode.removeChild(style);
      bubbleEl = null; toggleEl = null; initialized = false;
    }
  };

})();
