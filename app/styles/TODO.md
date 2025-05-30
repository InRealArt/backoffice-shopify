# TODO: Système de Style Unifié

Ce document liste les améliorations prévues pour le système de style unifié.

## Priorité Haute

- [x] Migrer les composants LoadingSpinner et Modal vers le système de style global
- [ ] Ajouter des variantes de boutons (outline, text-only)
- [x] Créer des styles de formulaire cohérents
- [ ] Appliquer le système sur toutes les pages principales
- [x] Optimiser la gestion des notifications d'erreur en utilisant la classe `toast-notification`
- [ ] Créer une directive pour standardiser les modales dans l'ensemble de l'application
- [x] Améliorer les styles de navigation et de menu

## Priorité Moyenne

- [ ] Créer des composants pour les cartes et tiles
- [ ] Ajouter une fonctionnalité de thème (clair/sombre)
- [x] Optimiser les performances CSS (purge des classes non utilisées) - Documentation: [docs/css-optimization.md](/docs/css-optimization.md)
- [ ] Standardiser les styles des tableaux de données avec pagination
- [x] Créer un composant de filtre réutilisable
- [ ] Ajouter des animations de transition pour les changements d'état
- [ ] Ajouter une option de prévisualisation pour les modifications

## Priorité Basse

- [ ] Créer des animations réutilisables
- [ ] Implémenter un système de grille personnalisé
- [ ] Documenter toutes les variables et classes avec des exemples
- [ ] Créer une page de styleguide dans l'application
- [ ] Optimiser les styles pour les grands écrans (>1920px)
- [ ] Améliorer le contraste des couleurs pour l'accessibilité
- [ ] Ajouter un mode sombre

## Composants standardisés

- [x] LoadingSpinner - Réutilisable
- [x] RoleBadge - Pour les badges de rôle utilisateur
- [x] StatusBadge - Pour les badges de statut dans toute l'application
- [x] NftStatusBadge - Utilise maintenant StatusBadge
- [x] Button - Boutons standards avec variants et états de chargement
- [x] BlockchainAddress - Affichage des adresses blockchain
- [x] ProductCard - Cartes de produits standardisées
- [x] Dashboard et DashboardCard - Composants du tableau de bord
- [x] Modal
- [x] Form components
- [x] Toast notifications
- [x] TagInput - Composant pour la saisie de tags multiples
- [ ] Dropdowns et menus déroulants
- [ ] Accordéons et onglets
- [ ] Pagination
- [ ] Breadcrumbs

## Composants à standardiser

- [ ] Menu déroulants
- [ ] Datepicker
- [ ] Tabs
- [ ] Upload de fichier

## Pages migrées

- [x] blockchain/collections
- [x] blockchain/smartContracts
- [x] dataAdministration/artists
- [x] blockchain/royalties
- [x] blockchain/royaltyBeneficiaries
- [x] marketplace/nftsToMint
- [x] marketplace/nftsToMint/[id]/edit
- [x] marketplace/royaltiesSettings
- [x] marketplace/marketplaceListing
- [x] art/collection
- [x] boAdmin/users
- [ ] blockchain/marketplace
- [ ] users/list
- [ ] settings

## Formulaires standardisés

- [x] blockchain/collections/[id]/edit (EditCollectionForm) - sert de modèle pour les autres formulaires d'édition
- [ ] dataAdministration/artists/[id]/edit
- [x] marketplace/nftsToMint/[id]/edit
- [x] blockchain/smartContracts/[id]/EditSmartContractForm
- [x] marketplace/royaltiesSettings/[id]/edit (avec conservation du SCSS pour les styles spécifiques)

## Bugs Connus

- [ ] Problèmes d'affichage sur certains navigateurs mobiles
- [ ] Conflit potentiel avec certains styles spécifiques aux composants
- [ ] Les boutons n'ont pas la bonne taille sur les écrans très petits (<375px)
- [ ] Certaines transitions ne fonctionnent pas correctement sur Safari
