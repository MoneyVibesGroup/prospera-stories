# STORY-589 : Chemin d'entrée direct authentifié pour les messages porteurs d'un secret ⛔ C8

Status: ready-for-dev

**Épic :** EPIC-058 — Le service devient l'organe de parole unique
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S42
**Prérequis :** ⛔ **C8 — authentification machine-à-machine (décision PROGRAMME, hors service)** · **STORY-588**
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-2, AR-05, AR-06.

---

## Le fait

⛔⛔ **Story la plus bloquée du module, et son blocage vit ailleurs.** C8 — l'authentification
machine-à-machine entre services — est une **décision programme ouverte depuis STORY-034**. Elle n'est
pas livrable par l'équipe notification.

⚡ **Pourquoi on ne peut pas la contourner ici alors que `paiement-service` l'a fait (son AD-13) :** un
lien à usage unique **est** la preuve d'identité — qui l'a, prend le compte. Le déposer sur un topic
Kafka, c'est le déposer dans un journal **durable, rejouable depuis l'offset 0, lisible par tout
consumer group du programme et copié dans les sauvegardes**.

## Critères d'acceptation

- [ ] AC-1 — ⚡ **Le discriminant est le contenu, jamais l'appelant.** Un message qui transporte un
      **lien à usage unique ou un code** — vérification d'e-mail, invitation, réinitialisation de mot
      de passe — entre par **appel direct authentifié machine-à-machine**. Tout autre déclencheur
      entre par le bus. Le test est **binaire et vérifiable en revue**.
- [ ] AC-2 — La route directe est authentifiée par le mécanisme retenu par C8, et **elle seule**.
      Aucune autre route du service ne l'emprunte.
- [ ] AC-3 — ⚠️ **L'appel direct ne remplace pas l'événement** : `auth-service` publie toujours
      `identity.user.registered` pour les read-models des autres services — **sans le secret**.
- [ ] AC-4 — ⚠️ **Une indisponibilité de ce service ne fait pas échouer l'inscription.** Le client
      sortant de l'appelant réessaie avec backoff — une file de réessai n'est ni un appel SMTP ni un
      appel de canal, donc `SM-1` reste à zéro — et tout message porteur d'un secret expose un chemin
      de **renvoi à l'initiative de l'utilisateur**.
- [ ] AC-5 — Ces envois partent sur la file **`transactionnel-prioritaire`** (STORY-578) : ce sont les
      messages sensibles au temps, `P95 < 10 s` (NFR-3).
- [ ] AC-6 — ⛔ Le secret **n'est jamais journalisé** : ni en clair, ni masqué partiellement, ni dans
      une trace d'erreur (NFR-7). Vérifié sur des journaux réels.

## Notes

⛔ **À trancher avant l'ouverture du S42.** L'ordre de tirage du sprint place EPIC-058 en queue
précisément pour qu'un glissement de C8 coûte 13 points et non un sprint entier.
