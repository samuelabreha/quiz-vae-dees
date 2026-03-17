# ORGANIGRAMME CHRONOLOGIQUE – TRAVAIL EN RÉSEAU (AIS)

*Appui à l’Intégration Scolaire – Fonctionnement réel et partenarial*

---

## Version structurée (texte)

### ÉTAT DE GENÈVE / COMMUNES

- **DIP – Département de l’Instruction Publique**
  - **DGEO – Direction générale de l’enseignement obligatoire**
    - **SERVICE DES REMPLACEMENTS (SeREP)**
      - **Chef du Service des Remplacements**
        - Supervision institutionnelle
        - Validation des missions AIS
      - **Commis administratif**
        - Appel de mission (dès 6h30)
        - Désignation officielle AIS
        - Envoi du courriel de mission
        - Mise en copie du réseau :
          - Direction
          - Secrétariat
          - Coordinatrice AIS
          - Responsable socio-éducative
          - Enseignant·e(s)
          - Parascolaire (GIAP si concerné)

### ÉTABLISSEMENT SCOLAIRE *(Lieu d’intervention)*

- **Direction d’établissement**
  - Cadre institutionnel
  - Garantie de la cohérence éducative
- **Responsable socio-éducative**
  - Supervision des missions AIS
  - Validation administrative (factures)
  - Interlocutrice de référence en cas de difficulté
- **Secrétariat d’établissement**
  - Accueil administratif
  - Badges, clés, documents internes
  - Relais administratif avec le SeREP
- **Coordinatrice du dispositif AIS**
  - Suivi qualitatif de la mission
  - Ajustements organisationnels
  - Organisation des réunions de réseau
- **Enseignant·e(s) titulaire(s) de la classe**
  - Responsable pédagogique
  - Définition des objectifs et consignes
  - Adaptations pédagogiques
  - Partenaire direct de l’AIS au quotidien

### ARRIVÉE À L’ÉCOLE – ENTRÉE DANS LE RÉSEAU

- **Présentation auprès de l’enseignant·e titulaire**
  - Clarification du cadre de la journée
  - Échange sur les besoins spécifiques de l’élève
- **Consultation du PAI – Projet d’Accueil Individualisé (si existant)**
  - Lecture des consignes médicales (SSEJ)
  - Prise en compte des recommandations éducatives
  - Ajustements immédiats de l’accompagnement

### MOI – Assistant à l’Intégration Scolaire (AIS)

- Mise en œuvre du cahier des charges AIS
- Application du PAI
- Accompagnement individualisé
- Observation professionnelle continue
- Coordination avec les acteurs du réseau

### Travail en réseau quotidien autour de l’élève

- **Binôme AIS (organisation institutionnelle)**
  - Travail en binôme selon les besoins du Service des Remplacements
  - Relais et transmissions régulières entre AIS
  - Continuité éducative assurée entre différentes interventions
  - Organisation permettant à un même AIS d’intervenir sur plusieurs missions distinctes, parfois en binôme sur différentes situations
  - Changement de mission organisé institutionnellement après plusieurs années d’intervention (environ 3 ans), afin de diversifier les accompagnements et d’adapter les ressources aux besoins du dispositif
- **Équipe parascolaire (GIAP)**
  - Relais temps de midi
  - Transitions éducatives
  - Sécurité / bien-être
- **Autres professionnels**
  - Psychologue scolaire
  - Infirmier·ère scolaire
  - Logopédiste
  - Autres partenaires

### Élève à besoins spécifiques et famille

- Accueil et départs quotidiens
- Consignes médicales et éducatives
- Informations sur la fatigue, la santé, le vécu de la journée

### FIN DE LA MISSION

- **Réunion de fin de journée (16h10)**
  - Échange avec l’enseignant·e
  - Partage des observations de la journée
  - Ajustement des stratégies éducatives
  - Transmission d’éléments utiles au réseau

---

## Version organigramme (Mermaid)

```mermaid
flowchart TB
  A[ÉTAT DE GENÈVE / COMMUNES] --> B[DIP – Département de l’Instruction Publique]
  B --> C[DGEO – Direction générale de l’enseignement obligatoire]
  C --> D[SERVICE DES REMPLACEMENTS (SeREP)]

  D --> E[Chef du Service des Remplacements]
  D --> F[Commis administratif]

  E --> E1[Supervision institutionnelle]
  E --> E2[Validation des missions AIS]

  F --> F1[Appel de mission (dès 6h30)]
  F --> F2[Désignation officielle AIS]
  F --> F3[Envoi du courriel de mission]
  F --> F4[Mise en copie du réseau : Direction / Secrétariat / Coordinatrice AIS / Responsable socio-éducative / Enseignant·e(s) / Parascolaire (GIAP si concerné)]

  D --> G[ÉTABLISSEMENT SCOLAIRE (Lieu d’intervention)]

  G --> H[Direction d’établissement]
  G --> I[Responsable socio-éducative]
  G --> J[Secrétariat d’établissement]
  G --> K[Coordinatrice du dispositif AIS]
  G --> L[Enseignant·e(s) titulaire(s) de la classe]

  L --> M[ARRIVÉE À L’ÉCOLE – ENTRÉE DANS LE RÉSEAU]
  M --> N[Présentation auprès de l’enseignant·e titulaire]
  N --> N1[Clarification du cadre de la journée]
  N --> N2[Échange sur les besoins spécifiques de l’élève]

  M --> O[Consultation du PAI (si existant)]
  O --> O1[Lecture des consignes médicales (SSEJ)]
  O --> O2[Prise en compte des recommandations éducatives]
  O --> O3[Ajustements immédiats de l’accompagnement]

  O --> P[MOI – Assistant à l’Intégration Scolaire (AIS)]
  N --> P

  P --> Q[Travail en réseau quotidien autour de l’élève]

  Q --> R[Binôme AIS]
  Q --> S[Équipe parascolaire (GIAP)]
  Q --> T[Autres professionnels]

  Q --> U[Élève à besoins spécifiques et famille]

  U --> V[FIN DE LA MISSION]
  V --> W[Réunion de fin de journée (16h10)]
```
