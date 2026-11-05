# Mon Budget

Appli de budget personnelle (PWA) : état théorique / à jour, dépenses fixes avec OK, courantes, revenus, courses, historique, épargne, dettes.
Les données restent **uniquement sur le téléphone** (localStorage).

## Mise en ligne (GitHub Pages)
1. Settings > Pages > Source : *Deploy from a branch* > branche `main`, dossier `/ (root)` > Save.
2. Après ~1 minute l'adresse est `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.

## Installation sur Android
Ouvre l'adresse dans Chrome > menu ⋮ > **Installer l'application** (icône sur l'écran d'accueil, plein écran, hors ligne).

## Mise à jour
Remplace les fichiers dans le dépôt (Add file > Upload files, « Commit changes »). L'appli installée se met à jour toute seule
à la prochaine ouverture avec du réseau (ferme-la et rouvre-la une fois ou deux). Les données ne sont pas touchées.

## Sauvegarde
Engrenage > *Exporter une sauvegarde* (fichier .json) / *Importer une sauvegarde*.

## APK Android
Chaque envoi sur `main` construit automatiquement l'APK (onglet Actions) et le publie ici :
`https://github.com/TomSHMTE/mon-budget/releases/latest/download/mon-budget.apk`
(même clé de signature à chaque version : on installe par-dessus, les données sont conservées.)
