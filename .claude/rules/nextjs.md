# rule : nextjs

- Server Components par défaut. 'use client' uniquement si hooks React 
(useState,
  useEffect, useRef) ou événements browser sont nécessaires.
- Pas de fetch côté client pour les données initiales — utiliser les 
Server Components.
- Exports nommés pour tous les composants (pas de export default sauf 
pages).
- Dossier components/ pour les composants réutilisables, app/ pour les 
pages uniquement.
- next/image pour toute balise <img> — jamais de <img> natif.
