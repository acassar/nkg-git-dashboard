# 🚦 NKG Git Dashboard

Dashboard d'équipe pour **monitorer la santé des branches et merge requests
GitLab**. Interface Vue 3 moderne, colorée et responsive (thème clair/sombre).

Indicateurs clés :

- **Branches actives** — commit récent (seuil configurable)
- **Branches en sommeil** — activité ralentie
- **Branches mortes** — plus aucune activité depuis longtemps
- **Branches en merge** — MR ouverte, avec statut (prête, conflits, CI, brouillon…)
- **MR à risque** — merge requests inactives ou en conflit

---

## Stack

Vue 3 (`<script setup>` + TypeScript) · Vite · Pinia · Axios. Aucun backend :
le front interroge directement l'API REST GitLab v4.

## Démarrage

```bash
npm install
cp .env.example .env      # renseigne au moins VITE_GITLAB_URL
npm run dev
```

Puis ouvre l'URL affichée. Au premier lancement, le panneau **Réglages**
s'ouvre : URL, token et cibles peuvent aussi être saisis directement dans
l'interface (stockés en `localStorage`).

Scripts : `npm run dev` · `npm run build` · `npm run preview` · `npm run type-check`.

---

## 🔌 Ce dont j'ai besoin pour connecter un GitLab entreprise

Pour brancher le dashboard sur ton instance, il me faut **3 choses** :

### 1. L'URL de l'instance GitLab

Ex : `https://gitlab.mon-entreprise.com` (l'URL de base, sans `/api/...`).

### 2. Un Access Token avec le scope `read_api`

Le dashboard n'a besoin **que de la lecture**. Trois options, du plus simple
au plus propre pour une équipe :

| Type de token | Où le créer | Recommandé pour |
|---|---|---|
| **Personal Access Token** | _Preferences → Access Tokens_ | tester / usage perso |
| **Group Access Token** | _Groupe → Settings → Access Tokens_ | **une équipe** (lié au groupe, pas à une personne) |
| **Project Access Token** | _Projet → Settings → Access Tokens_ | un ou deux projets ciblés |

Scope minimal : **`read_api`**. Rôle `Reporter` suffisant. Pense à mettre une
**date d'expiration** et à la renouveler.

> ⚠️ Le token donne accès en lecture à ton GitLab — ne le commite jamais.
> Il est stocké dans le `localStorage` du navigateur (ou dans `.env` en local).

### 3. Le périmètre à monitorer

Le(s) **groupe(s)** (sous-groupes inclus automatiquement) et/ou **projets**
à suivre — par chemin (`mon-groupe/mon-sous-groupe`) ou par ID numérique.

---

## ⚠️ Point important : CORS / accès réseau

Le navigateur appelle l'API GitLab directement. Selon ta configuration :

- **En développement** — c'est déjà géré. Vite proxie les appels via
  `/gitlab-api` vers `VITE_GITLAB_URL` (voir `vite.config.ts`), donc **pas de
  souci de CORS** tant que tu passes par `npm run dev`.

- **En production** — deux possibilités :
  1. **Reverse-proxy** (recommandé) : servir le dashboard et proxifier
     `/gitlab-api` vers GitLab depuis le même domaine (nginx, Traefik…). Le
     token ne transite alors pas en clair vers un tiers.
  2. **Autoriser le CORS côté GitLab** : configurer les origines autorisées
     pour l'API. Nécessite un accès admin à l'instance.

Si tu me dis **comment ton GitLab est exposé** (accès admin ? possibilité de
reverse-proxy ? réseau interne uniquement ?), je peux ajouter la configuration
de déploiement adaptée (Dockerfile + nginx par exemple).

---

## Réglages avancés

Les seuils d'analyse sont configurables dans le panneau Réglages :

| Seuil | Défaut | Effet |
|---|---|---|
| Active si commit ≤ N jours | 14 | branche « active » |
| Morte si commit ≥ N jours | 60 | branche « morte » |
| MR inactive si ≥ N jours | 14 | MR marquée « à risque » |

## Structure

```
src/
  services/gitlabApi.ts     # client API GitLab (pagination, erreurs)
  utils/branchAnalysis.ts   # classification des branches + KPI
  stores/                   # config (persistée) + données du dashboard
  components/               # tuiles KPI, table de branches, liste de MR, réglages
  assets/theme.css          # design tokens (palette validée, light/dark)
```

## Pistes d'évolution

- Historique / tendances (sparklines d'activité par branche)
- Alertes (Slack/Teams) sur MR bloquées trop longtemps
- Vue par contributeur, filtres par projet
- Support GitHub / Bitbucket en plus de GitLab
