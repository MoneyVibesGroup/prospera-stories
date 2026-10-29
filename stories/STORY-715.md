# STORY-715 : mTLS sur la route de rappel et sur les appels sortants

Status: blocked

**Épic :** EPIC-036 · **Service :** `paiement-service` · **Points :** ≈5 · **Rail :** E2

⛔ **BLOQUÉE PAR CONSIGNE (2026-10-23) : la production PI-SPI reste fermée ; on se limite au bac à
sable.** Le mTLS ne sert que l'hôte de production — et l'hôte à mTLS du simulateur, qui exige des
certificats délivrés par le schéma, que nous n'avons pas.

## Le fait

- Les appels partent par un `fetch` sans agent TLS : l'hôte à mTLS du simulateur refuse la connexion
  (constat de la recette de [[STORY-654]]).
- La route de rappel des notifications n'exige aucun certificat client : la seule barrière contre le
  rejeu reste l'idempotence de la boîte ([[STORY-660]], [[STORY-675]]).

## Critères d'acceptation (à reprendre à l'ouverture de la production)

- [ ] AC-1 — Les appels sortants présentent le certificat client de l'organisation (scellé au coffre,
      comme ses identifiants — [[STORY-666]]).
- [ ] AC-2 — La route de rappel n'accepte que le certificat du schéma (terminaison TLS mutuelle au
      proxy, empreinte vérifiée par le service).
- [ ] AC-3 — Recette sur l'hôte à mTLS du simulateur, certificats fournis par le schéma.

## Prérequis à obtenir

- Les certificats de recette du schéma, et l'arbitrage PO sur la terminaison (proxy ou service).
