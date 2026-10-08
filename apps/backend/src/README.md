# Patch backend — tout dans Medusa (v6) : fréquentation, vérification email, réglages du site

Répond à trois choses : plus aucun outil externe (Meilisearch, Umami —
tout est maintenant dans Medusa), la vérification d'email à l'inscription,
et ta question sur `db:generate`/`db:migrate`.

## 0. Pourquoi `db:generate`/`db:migrate` ne marchait pas pour toi

Ce n'est pas une erreur de ta part : la commande existe, mais il faut
lui donner le nom du **module** à migrer, pas au hasard. Pour ce patch :

```bash
npx medusa db:generate review site-analytics email-verification site-settings
npx medusa db:migrate
```

`db:generate <module>` regarde le modèle du module et écrit le fichier
de migration SQL correspondant dans le dossier `migrations/` du module ;
`db:migrate` (sans argument) applique TOUTES les migrations en attente,
tous modules confondus. C'est pour ça que le deuxième n'a pas de nom de
module après lui.

Si tu avais déjà tenté d'installer un patch précédent (avis clients,
suivi de commande) sans lancer `db:generate`, relance aussi :
```bash
npx medusa db:generate review
```

## 1. Copier les fichiers

Tous les fichiers de ce zip, aux mêmes chemins, dans
`backuak/apps/backend/`. En particulier :
- `src/api/middlewares.ts` — **remplace entièrement** l'existant (il
  corrige aussi l'erreur "Cannot find name 'PostAdminReview'" que tu
  avais dans VS Code : il manquait l'import)
- `medusa-config.ts` — **remplace entièrement** l'existant (4 nouveaux
  modules ajoutés à la liste)

## 2. Variables d'environnement (.env)

```
# Email (SMTP du cPanel, ou de n'importe quel hébergeur email) — pour le
# code de vérification à l'inscription. Sans ça, le code s'affiche juste
# dans le terminal du backend (pratique pour tester en local).
SMTP_HOST=mail.tondomaine.com
SMTP_PORT=465
SMTP_USER=noreply@tondomaine.com
SMTP_PASS=le-mot-de-passe-du-compte-email
SMTP_FROM="KuakuMarket <noreply@tondomaine.com>"
```

## 3. Migrations + redémarrage

```bash
npm install nodemailer
npx medusa db:generate review site-analytics email-verification site-settings
npx medusa db:migrate
npx medusa develop
```

## Ce que ça ajoute, en résumé

### Fréquentation du site (remplace Umami)
Table `site_event` dans la base Medusa elle-même. Le front envoie un
évènement à chaque page vue, clic produit, ajout au panier — voir
`/store/site-events`. Aucune donnée personnelle stockée (pas d'IP, pas
de nom), juste un identifiant anonyme par navigateur. Les chiffres
apparaissent directement dans la page **Statistiques** de l'admin
(onglet déjà livré précédemment, enrichi ici avec visites/pages
vues/clics). Un job automatique (`cleanup-site-events`) supprime chaque
nuit les évènements de plus de 90 jours pour ne pas alourdir la base.

### Vérification d'email à l'inscription
Deux protections, cumulées :
1. **À l'inscription** : l'adresse est contrôlée automatiquement — format
   valide, pas de faute de frappe connue (gmial.com…), pas d'adresse
   jetable (yopmail, mailinator…), et le domaine doit réellement recevoir
   du courrier (vérification DNS). Une adresse du genre `j@k.com` est
   rejetée avant même la création du compte, avec un message clair.
2. **Après inscription** : un code à 6 chiffres est envoyé par email ;
   la cliente le saisit dans un bandeau sur `/compte` (front déjà
   branché). Ça ne bloque pas la navigation ni la commande — c'est une
   incitation, pas une barrière, pour ne jamais perdre une vente à cause
   d'un email arrivé en retard.

Aucune de ces deux protections ne remplace l'autre : la première élimine
les adresses forcément fausses, la seconde confirme que la vraie
personne a accès à la boîte mail donnée.

### Réglages du site
Nouvelle page **Réglages du site** dans l'admin : téléphone, WhatsApp,
email, adresse, horaires, réseaux sociaux, messages de la bannière
défilante. Toute personne qui gère le site au quotidien modifie ça
elle-même, sans toucher au code ni redéployer — le front les relit à
chaque affichage. Ta page Contact et ton bouton WhatsApp basculent
automatiquement dessus.

## Interface admin en français

Bonne nouvelle, vérifiée en ligne : Medusa a bien une traduction
française officielle du tableau de bord. Dans l'admin, en haut à droite
→ réglages du compte (icône profil) → langue → choisir **Français**.
Ça traduit tout de suite Produits, Commandes, Clients, et le reste du
dashboard natif. Les pages que j'ai ajoutées (Statistiques, Marques,
Avis, Réglages du site) sont, elles, déjà en français puisque je les ai
écrites moi-même, quelle que soit la langue choisie dans ce menu.
