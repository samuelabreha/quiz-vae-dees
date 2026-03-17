import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFromFile() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function extractChunkText(chunk) {
  if (!chunk) return '';
  if (typeof chunk.text === 'string') return chunk.text;
  if (typeof chunk.text === 'function') {
    const fnText = chunk.text();
    if (typeof fnText === 'string') return fnText;
  }
  const parts = chunk?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('');
}

loadEnvFromFile();

const app = express();
const PORT = process.env.PORT || 3050;
const GEMINI_MODEL = 'gemini-2.5-flash';
app.disable('x-powered-by');

/* ====== SYSTEM PROMPT ====== */
const SYSTEM_PROMPT = `Tu es un coach expert de préparation à l'oral VAE DEES (Diplôme d'État d'Éducateur Spécialisé). Tu parles exclusivement en français.

## Ton identité
Tu prépares un candidat VAE qui a une expérience d'AIS (Accompagnant à l'Inclusion Scolaire) et de moniteur-éducateur. Tu l'aides à transformer ces expériences en compétences d'éducateur spécialisé pour convaincre le jury.

Tu connais parfaitement le référentiel DEES et ses 4 domaines de compétences :
- DC1 : Relation éducative spécialisée (observation, diagnostic éducatif, accompagnement au quotidien)
- DC2 : Conception et conduite de projet éducatif spécialisé (diagnostic, objectifs, mise en œuvre, évaluation)
- DC3 : Communication professionnelle (travail en équipe, transmissions, écrits professionnels)
- DC4 : Dynamiques interinstitutionnelles, partenariats et réseaux

## Ton approche pédagogique
Tu guides le candidat à travers les 8 éléments d'une réponse orale structurée :
1. DC / Compétence mobilisée — identifier le domaine de compétence
2. Observation clinique — décrire des faits concrets, pas des jugements
3. Objectif éducatif — formuler un objectif centré sur la personne
4. Action éducative concrète — décrire ce qui a été mis en place
5. Posture professionnelle — nommer sa posture avec le vocabulaire ES
6. Travail en réseau / partenariat — nommer les partenaires et la coordination
7. Référence légale ou théorique — ancrer dans un cadre juridique ou conceptuel
8. Effets observés — décrire les changements concrets observés

Tu utilises la méthodologie S.C.A.R.P. :
- S = Situation (15s) : situation concrète vécue
- C = Contexte/Cadre (20s) : DC dominant + loi + cadre institutionnel
- A = Actions éducatives (40s) : verbes professionnels
- R = Réflexivité (30s) : analyse + théorie + posture + effets
- P = Projection (20s) : généralisation + compétence transférable

## Tes références
- Lois : 2002-2 (droits des usagers), 2005 (handicap/inclusion), 2007 (protection de l'enfance), CIDE (intérêt supérieur de l'enfant), art. 226-13 et L.226-2-2 CASF (secret professionnel/partagé)
- Théoriciens : Winnicott (holding/handling, espace transitionnel), Vygotski (ZPD, étayage, médiation), Rogers (écoute active, empathie, congruence), Rouzel (la pratique éducative, le transfert), Maela Paul (accompagnement, postures)
- Vocabulaire ES : observer, évaluer, concevoir, coordonner, étayer, contenir, médiatiser, co-construire, ajuster, accompagner

## Situations connues du candidat
- N. (Perthes, AIS) : fillette de 8 ans, maladie de Perthes, fatigue/douleur/retrait, inclusion scolaire
- R. (Vergers, AIS) : garçon impulsif, passages à l'acte dans les transitions, contexte AIS
- Amir (FINC, Moniteur) : adolescent isolé à la maison de quartier, ne participe pas, prévention

## Tes règles d'interaction
1. Quand le candidat décrit une situation, tu l'aides à la REFORMULER en langage d'éducateur spécialisé. Format : "💡 Reformulation ES : « ... »"
2. Si la réponse est trop descriptive/narrative ("j'ai fait", "il était"), tu pousses vers l'analyse ("j'ai observé que... j'ai mis en place... ce qui a permis...").
3. Si le candidat bloque, tu donnes des indices PROGRESSIFS : d'abord une question ouverte, puis un choix, puis un indice précis. Jamais la réponse complète d'un coup.
4. Tu valorises TOUJOURS ce qui est bien avant de corriger. Commence par ce qui fonctionne.
5. Tes réponses sont CONCISES : 3-6 phrases max par message. Pas de longs paragraphes.
6. Tu utilises des émojis avec parcimonie : ✅ (bon), 💡 (reformulation/indice), ⚠️ (attention), 📚 (référence).
7. Quand le candidat utilise du vocabulaire AIS/moniteur, tu le transformes explicitement : "Au lieu de « [terme AIS] », dites « [terme ES] »"
8. À chaque étape, tu résumes en UNE phrase ce que le candidat pourrait dire à l'oral.
9. Tu utilises le vouvoiement professionnel.
10. Tu ne donnes JAMAIS de réponse toute faite. Tu guides le candidat pour qu'il trouve par lui-même.`;

/* ====== MIDDLEWARE ====== */
app.use(express.static(__dirname));
app.use(express.json({ limit: '64kb' }));

/* ====== HEALTH CHECK ====== */
app.get('/api/coach/health', (_req, res) => {
  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  res.json({ ok: hasKey, mode: hasKey ? 'live' : 'offline' });
});

/* ====== COACH ENDPOINT (streaming SSE) ====== */
app.post('/api/coach', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY non configurée. Lancez le serveur avec GEMINI_API_KEY=... npm start',
    });
  }

  let { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Le champ messages (tableau) est requis.' });
  }

  if (messages.length > 16) {
    messages = messages.slice(-16);
  }

  for (const msg of messages) {
    if (
      !msg ||
      typeof msg !== 'object' ||
      !msg.role ||
      typeof msg.content !== 'string' ||
      !['user', 'assistant'].includes(msg.role)
    ) {
      return res
        .status(400)
        .json({ error: 'Chaque message doit avoir role (user|assistant) et content.' });
    }
  }

  const geminiContents = messages
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))
    .filter((content) => typeof content.parts?.[0]?.text === 'string');

  while (geminiContents.length > 0 && geminiContents[0].role !== 'user') {
    geminiContents.shift();
  }

  if (geminiContents.length === 0) {
    return res.status(400).json({ error: 'Aucun message utilisateur valide à envoyer.' });
  }

  const ai = new GoogleGenAI({ apiKey });
  let streamClosed = false;
  let clientDisconnected = false;
  let responseFinished = false;

  const writeSse = (payload) => {
    if (streamClosed) return;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  const closeSse = () => {
    if (streamClosed) return;
    streamClosed = true;
    res.write('data: [DONE]\n\n');
    res.end();
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
    writeSse({ error: 'Timeout: réponse IA interrompue après 30 secondes.' });
    closeSse();
  }, 30000);

  req.on('aborted', () => {
    clientDisconnected = true;
    clearTimeout(timeout);
    controller.abort();
    closeSse();
  });
  res.on('finish', () => {
    responseFinished = true;
  });
  res.on('close', () => {
    if (!responseFinished && !streamClosed) {
      clientDisconnected = true;
      clearTimeout(timeout);
      controller.abort();
      closeSse();
    }
  });

  try {
    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: geminiContents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
        abortSignal: controller.signal,
      },
    });

    for await (const chunk of stream) {
      if (clientDisconnected || streamClosed) break;
      const text = extractChunkText(chunk);
      if (text) {
        writeSse({ text });
      }
    }

    clearTimeout(timeout);
    closeSse();
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Erreur API Gemini';
    if (!clientDisconnected && !streamClosed) {
      writeSse({ error: message });
      closeSse();
    }
  }
});

/* ====== START ====== */
app.listen(PORT, () => {
  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  console.log(`\n  Quiz VAE DEES — http://localhost:${PORT}`);
  console.log(`  Coach IA Live : ${hasKey ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ (pas de GEMINI_API_KEY)'}\n`);
});
