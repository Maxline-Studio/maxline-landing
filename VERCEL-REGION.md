# Région d'exécution des fonctions — pourquoi `cdg1`

`vercel.json` n'accepte aucun commentaire (le schéma rejette toute clé
supplémentaire, `//` compris) : l'explication vit donc ici.

## Le problème

Les fonctions s'exécutaient à **`iad1` (Washington)**, la valeur par défaut de
Vercel, jamais modifiée. Or :

- les utilisateurs sont en **France** ;
- la base Supabase est en **Irlande** ;
- le bucket R2 est en **Europe Ouest** (`WEUR`).

Chaque requête faisait donc **Paris → Washington → Irlande → Washington →
Paris**. Mesuré sur `/r/ABC123`, une route qui ne fait *rien* d'autre que poser
un cookie et rediriger : **260 ms de plancher**, avant le moindre travail utile.
Une page d'éditeur qui enchaîne 5 à 7 requêtes Supabase payait ce péage à chaque
aller-retour.

## La correction

```json
"regions": ["cdg1"]
```

Paris est à ~10 ms des utilisateurs et ~25 ms de l'Irlande. Le même plancher est
retombé à **~170 ms** (dont ~90 ms de simple établissement de connexion TLS), et
le gain se cumule sur chaque requête d'une page.

## Vérifier que c'est bien actif

```bash
curl -s -D - -o /dev/null https://www.maxlinestudio.fr/login | grep -i x-vercel-id
```

Attendu : `x-vercel-id: cdg1::cdg1::…`
Le **premier** segment est l'entrée réseau (toujours proche de l'utilisateur), le
**second** est la région d'exécution réelle. Si le second affiche `iad1`, le
réglage n'est pas pris.

> Le réglage existe aussi dans l'interface (Settings → Functions → Function
> Region). Les deux sont cohérents ; `vercel.json` fait foi au déploiement.
