# Veracto — Document de référence projet

## Vue d'ensemble

**Veracto** est un SaaS de veille et de GEO (Generative Engine Optimization) pour les PME françaises et les indépendants. Il surveille en continu le secteur, les concurrents et la visibilité IA d'une marque, et transforme ces données en actions concrètes chaque semaine.

**Proposition de valeur :**
> "Veracto surveille ton marché et ta visibilité en ligne, et transforme ça en actions concrètes chaque semaine."

**Antifragilité :** le produit est agnostique au modèle IA — peu importe quel LLM gagne la guerre des modèles (ChatGPT, Gemini, Claude...), les entreprises auront toujours besoin d'y être citées.

---

## Architecture produit

### Moteur core — Agent de Veille Sectorielle

Un seul agent surveille en continu :
- Secteur / niche de l'utilisateur
- Concurrents (mentions, nouveautés, positionnement)
- GEO — comment les LLMs citent la marque vs concurrents

**Sources ingérées :** RSS/Blogs, Newsletters, YouTube, Podcasts, Reddit/HN, LinkedIn, sources web custom

### Deux sorties actionnables

**1. Présence Humaine (module Veille)**
- Posts réseaux sociaux (LinkedIn, Instagram...) ancrés dans la veille réelle, dans le ton de l'utilisateur
- Recommandations de contenu pour le site web (articles, pages à créer/mettre à jour)
- Digest hebdo actionnable structuré par thème
- Analyse des patterns de viralité de la niche
- Planification et publication

**2. Présence IA (module GEO)**
- Audit de visibilité IA (ChatGPT, Perplexity, Gemini, Claude)
- Diagnostic : pourquoi la marque n'est pas citée vs concurrents
- Génération de contenu GEO-ready (FAQ, données structurées, schema markup)
- Actions prioritaires chaque semaine
- Monitoring continu + alertes de chute de visibilité

---

## Cibles et positionnement

### Cible prioritaire
**PME de 5 à 50 personnes** — dirigeant ou responsable marketing qui :
- Fait de la veille de façon artisanale (Feedly ignoré, alertes Google non lues)
- Commence à entendre parler du GEO et se demande si ses concurrents ont de l'avance
- A un budget de 100–300 €/mois si la valeur est claire
- Va taper "comment apparaître dans ChatGPT" ou "outil GEO français" sur Google ou Perplexity

### Cible secondaire
**Indépendants / freelances / consultants / solopreneurs** — entrée par le module Veille, moins sensibles au GEO aujourd'hui (marché encore précoce sur cette cible).

### Cible revendeur
**Agences SEO, web, communication françaises** — cherchent à ajouter le GEO à leurs offres sans embaucher. Programme revendeur à 30%.

---

## Tarification modulaire

La segmentation se fait à l'usage (nombre de marques suivies, LLMs monitorés, volume de contenu, reporting), pas à la déclaration de statut.

| Segment | Veille seule | GEO seul | Bundle complet |
|---|---|---|---|
| **Indépendant** | €39/mois | €49/mois | €69/mois (−20%) |
| **PME** | €99/mois | €119/mois | €179/mois (−25%) |
| **Agence** | €299/mois | €349/mois | €449/mois (−30% + revendeur) |

**Logique :** chaque client entre par sa douleur (Veille ou GEO) et découvre le second module dans le produit. Le bundle n'est pas un upsell — c'est l'évidence naturelle.

---

## Hooks d'acquisition

### Hook GEO → cible PME
**Page :** "Les IA vous recommandent-elles à vos clients ?"
- Champ : nom de marque + secteur
- Résultat : audit instantané sur 4 LLMs simulés, score /100, concurrents détectés
- CTA : email pour recevoir le rapport complet (diagnostic uniquement, sans plan d'action)
- Canal : SEO organique sur requêtes "visibilité IA", "GEO français", "ChatGPT marque"

**Mécanique email :**
- J+0 : email de confirmation immédiat avec score préliminaire + annonce du rapport demain
- J+1 : rapport complet sur 6 LLMs (diagnostic pur — pas de conseils, pas de plan d'action)

**Pourquoi pas de plan d'action dans le rapport gratuit :**
Le rapport est un miroir, pas une solution. Il montre les faits bruts (score, concurrents cités à la place, requêtes sur lesquelles la marque est absente). La frustration naturelle — "comment je règle ça ?" — est ce que Veracto résout en tant que produit payant.

### Hook Veille → cible indépendants
**Page :** "Ton digest IA de la semaine"
- Champ : 3 sujets de veille à choisir
- Résultat : digest one-shot formaté et structuré, immédiat, sans compte
- CTA : abonnement pour recevoir ça chaque semaine automatiquement
- Canal : communautés LinkedIn, Slack indés, bouche-à-oreille

---

## Stack technique

### Frontend
- HTML/CSS/JS vanilla (hook GEO — page statique)
- Hébergement initial : VPS Hostinger, sous-domaine `audit.nivel.fr`
- Migration prévue vers `audit.veracto.fr` si validation

### Backend
- **Supabase** — base de données PostgreSQL, auth, RLS, webhooks
- **N8N** — orchestration des workflows (auto-hébergé sur VPS)
- **API Anthropic** — génération des analyses GEO et des rapports (claude-sonnet-4-20250514)
- **SMTP** — Resend (recommandé, gratuit jusqu'à 3 000 emails/mois)

### Sécurité importante
L'appel à l'API Anthropic doit se faire **côté serveur uniquement** (endpoint Node/Express ou Edge Function Supabase) — jamais exposer la clé API côté client.

---

## Schéma base de données (Supabase)

### Table `audits`
Créée dès que l'utilisateur clique "Auditer" — avant même qu'il laisse son email. Permet de collecter les données de toutes les recherches, même celles qui ne convertissent pas.

```sql
CREATE TABLE audits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name    TEXT NOT NULL,
  sector        TEXT NOT NULL,
  score         SMALLINT NOT NULL CHECK (score >= 0 AND score <= 100),
  cited_count   SMALLINT NOT NULL DEFAULT 0,
  total_llms    SMALLINT NOT NULL DEFAULT 4,
  results_json  JSONB NOT NULL DEFAULT '[]',
  ip_hash       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Structure de `results_json` :**
```json
[
  {
    "llm_id": "chatgpt",
    "llm_label": "ChatGPT",
    "cited": true,
    "confidence": "haute",
    "excerpt": "Réponse simulée du LLM...",
    "reason": "Raison courte",
    "competitors_mentioned": ["Concurrent A", "Concurrent B"]
  }
]
```

### Table `leads`
Créée quand l'email est soumis, liée à l'audit.

```sql
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  audit_id        UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  report_sent_at  TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'failed', 'unsubscribed')),
  source          TEXT DEFAULT 'geo-hook',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_leads_email_audit ON leads (email, audit_id);
```

### Table `reports`
Rapport complet généré par Claude, stocké séparément pour ne pas alourdir `audits`.

```sql
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id      UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content_html  TEXT,
  content_json  JSONB,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model_used    TEXT DEFAULT 'claude-sonnet-4-20250514'
);
```

### Vue `pending_reports`
Point d'entrée N8N — leads prêts à recevoir leur rapport (>18h après soumission).

```sql
CREATE VIEW pending_reports AS
SELECT
  l.id           AS lead_id,
  l.email,
  l.created_at   AS lead_created_at,
  a.id           AS audit_id,
  a.brand_name,
  a.sector,
  a.score,
  a.cited_count,
  a.total_llms,
  a.results_json
FROM leads l
JOIN audits a ON a.id = l.audit_id
WHERE l.status = 'pending'
  AND l.report_sent_at IS NULL
  AND l.created_at < NOW() - INTERVAL '18 hours'
ORDER BY l.created_at ASC;
```

### RLS (Row Level Security)
- Clé `anon` (page publique) : INSERT uniquement sur `audits` et `leads`
- Clé `service_role` (N8N) : accès complet en lecture/écriture
- Pas de SELECT public = données protégées

---

## Workflows N8N

### Workflow 1 — Confirmation immédiate J+0
**Déclencheur :** Webhook Supabase sur INSERT dans `leads`

**Étapes :**
1. Valider le payload (email + audit_id présents)
2. Récupérer les détails de l'audit lié
3. Envoyer l'email de confirmation avec :
   - Score préliminaire (4 LLMs)
   - Annonce du rapport complet demain matin (8h–10h)
   - Ce que contiendra le rapport (6 LLMs, concurrents, score sectoriel...)
4. Notif Slack interne (nouveau lead)

**Setup Supabase :** Database > Webhooks > Table `leads` > Event INSERT > URL webhook N8N

### Workflow 2 — Rapport complet J+1
**Déclencheur :** Schedule toutes les heures

**Étapes :**
1. Récupérer les leads en attente depuis >18h via vue `pending_reports`
2. Si aucun lead → stop
3. Pour chaque lead (SplitInBatches) :
   a. Appeler Claude API pour générer le rapport HTML
   b. Sauvegarder dans table `reports`
   c. Envoyer l'email avec le rapport complet
   d. Mettre à jour le statut du lead (`sent` ou `failed`)
   e. Notif Slack interne

**Prompt système pour la génération du rapport :**
```
Tu es un expert en GEO pour les PME françaises.
Tu génères des rapports de visibilité IA précis, factuels et sans complaisance.
Tu ne donnes PAS de conseils ni de plan d'action — uniquement des données et constats.
Le rapport est en HTML inline (pas de balises html/head/body).
```

**Structure du rapport généré :**
1. En-tête : score visuel, marque, secteur, date
2. Résumé exécutif : 2–3 phrases factuelles
3. Tableau par LLM : Cité/Absent, confiance, extrait simulé
4. Concurrents détectés : marques citées à la place de la marque analysée
5. Analyse sectorielle : comparaison score vs moyenne secteur
6. Pied de rapport : mention Veracto, lien veracto.fr

---

## Credentials N8N à configurer

| Credential | Type | Valeur |
|---|---|---|
| Supabase Veracto | Supabase API | URL + Service Role Key |
| Anthropic API | Header Auth | `x-api-key: sk-ant-xxxx` |
| SMTP Veracto | SMTP | Config Resend ou autre provider |
| SLACK_WEBHOOK_URL | Variable d'env | URL webhook Slack (optionnel) |

---

## Prochaines étapes techniques

### Priorité 1 — Sécuriser l'API Anthropic côté serveur
La page HTML actuelle appelle l'API Anthropic directement depuis le navigateur (clé exposée). En production, créer un endpoint serveur :
- Option A : endpoint Node/Express sur le VPS
- Option B : Edge Function Supabase (plus simple, pas de serveur à gérer)

L'endpoint reçoit `{ brand_name, sector }`, appelle l'API Anthropic, retourne les résultats. La clé API reste côté serveur.

### Priorité 2 — Connecter la page HTML à Supabase
Ajouter le SDK Supabase JS à la page d'audit pour :
1. Créer l'enregistrement `audits` après l'analyse
2. Créer l'enregistrement `leads` à la soumission de l'email

### Priorité 3 — Hébergement et domaine
- Court terme : `audit.nivel.fr` sur VPS Hostinger
- Long terme : `audit.veracto.fr` sur domaine dédié + serveur dédié si volume

### Priorité 4 — Hook Veille
Le second hook d'acquisition (générateur de digest one-shot) pour la cible indépendants. Même logique que le hook GEO : outil gratuit → email → abonnement.

---

## Go-to-market par phase

| Phase | Timing | Objectif |
|---|---|---|
| **MVP** | Semaines 1–8 | Hook GEO + core engine, tester sur Nivel |
| **Beta privée** | Mois 2–3 | 20 indépendants + 5 PME/agences, feedback rétention |
| **Canal agences** | Mois 4–6 | 500 agences SEO françaises, programme revendeur 30% |
| **Autorité** | Mois 6+ | Publier les premières données GEO françaises (% marques citées par secteur) |

---

## Fichiers produits

- `veracto-geo-audit.html` — Page du hook GEO (audit gratuit)
- `veracto-supabase-schema.sql` — Schéma complet Supabase
- `veracto-n8n-workflow.json` — Workflow N8N J+1 (rapport complet)
- `veracto-n8n-confirmation.json` — Workflow N8N J+0 (confirmation immédiate)
- `veracto-architecture.html` — Document de référence visuel (architecture, pricing, GTM)

---

## Contexte marque

- **Marque produit :** Veracto
- **Marque opérateur :** Nivel (nivel.fr) — freelance automation, no-code, IA
- **Stack habituel :** Supabase, N8N, Hostinger VPS
- **Positionnement Nivel :** automation et IA pour indépendants et petites structures
