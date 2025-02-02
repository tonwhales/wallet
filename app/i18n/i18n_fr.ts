import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, "" | "_plural"> = {
    "lang": "fr",
    "common": {
        "and": "et",
        "accept": "Accepter",
        "start": "Démarrer",
        "continue": "Continuer",
        "continueAnyway": "Continuer quand même",
        "back": "Retour",
        "logout": "Se déconnecter",
        "logoutFrom": "Se déconnecter de {{name}}",
        "cancel": "Annuler",
        "balance": "Solde",
        "totalBalance": "Solde total",
        "walletAddress": "Adresse de portefeuille",
        "recipientAddress": "Adresse du destinataire",
        "recipient": "Destinataire",
        "copy": "Copier",
        "copiedAlert": "Copié dans le presse-papiers",
        "copied": "Copié",
        "share": "Partager",
        "send": "Envoyer",
        "yes": "Oui",
        "no": "Non",
        "amount": "Montant",
        "today": "Aujourd’hui",
        "yesterday": "Hier",
        "comment": "Commentaire",
        "products": "Produits",
        "confirm": "Confirmer",
        "soon": "bientôt",
        "in": "dans",
        "max": "Max",
        "close": "Fermer",
        "delete": "Supprimer",
        "apply": "Appliquer",
        "domainOrAddress": "Adresse de portefeuille ou domaine",
        "domainOrAddressOrContact": "Adresse, domaine ou nom",
        "domain": "Domaine",
        "search": "Rechercher",
        "termsOfService": "Conditions\u00A0d’utilisation",
        "privacyPolicy": "Politique\u00A0de\u00A0confidentialité",
        "apy": "APY",
        "tx": "Transaction",
        "add": "Ajouter",
        "connect": "Connecter",
        "gotIt": "J’ai compris",
        "error": "Erreur",
        "wallet": "Portefeuille",
        "wallets": "Portefeuilles",
        "later": "Plus tard",
        "select": "Sélectionner",
        "show": "Afficher",
        "hide": "Masquer",
        "showAll": "Tout afficher",
        "hideAll": "Tout masquer",
        "done": "Terminé",
        "mainWallet": "Portefeuille principal",
        "walletName": "Nom du portefeuille",
        "from": "De",
        "to": "À",
        "transaction": "Transaction",
        "somethingWentWrong": "Quelque chose s’est mal passé",
        "checkInternetConnection": "Vérifiez votre connexion internet",
        "reload": "Recharger",
        "errorOccurred": "Une erreur s’est produite : {{error}}",
        "recent": "Récent",
        "ok": "OK",
        "attention": "Attention",
        "save": "Enregistrer",
        "assets": "Actifs",
        "message": "Message",
        "messages": "Messages",
        "airdrop": "Airdrop",
        "myWallets": "Mes portefeuilles",
        "showMore": "Afficher plus",
        "balances": "Soldes",
        "loading": "Chargement...",
        "notFound": "Introuvable",
        "unverified": "Non vérifié",
        "addressBook": "Carnet d’adresses",
        "gasless": "Sans gaz",
        "address": "Adresse",
        "currencyChanged": "Devise changée",
        "required": "requis"
    },
    "syncStatus": {
        "connecting": "Connexion",
        "updating": "Mise à jour",
        "online": "Connecté"
    },
    "home": {
        "home": "Accueil",
        "history": "Historique",
        "browser": "Navigateur",
        "more": "Plus"
    },
    "settings": {
        "title": "Plus",
        "backupKeys": "Sauvegarder les clés",
        "holdersAccounts": "Comptes de dépenses",
        "migrateOldWallets": "Migrer les anciens portefeuilles",
        "termsOfService": "Conditions d’utilisation",
        "privacyPolicy": "Politique de confidentialité",
        "developerTools": "Outils de développement",
        "spamFilter": "Filtre SPAM",
        "primaryCurrency": "Devise principale",
        "experimental": "Expérimental",
        "support": {
            "title": "Support",
            "telegram": "Telegram",
            "form": "Formulaire de support",
            "holders": "Carte bancaire & comptes",
            "tonhub": "Tonhub"
        },
        "telegram": "Telegram",
        "rateApp": "Noter l’application",
        "deleteAccount": "Supprimer le compte",
        "theme": "Thème",
        "searchEngine": "Moteur de recherche",
        "language": "Langue"
    },
    "theme": {
        "title": "Thème",
        "light": "Clair",
        "dark": "Sombre",
        "system": "Système"
    },
    "wallet": {
        "sync": "Téléchargement des données du portefeuille",
        "balanceTitle": "Solde Ton",
        "actions": {
            "receive": "Recevoir",
            "send": "Envoyer",
            "buy": "Acheter",
            "swap": "Échanger",
            "deposit": "Déposer"
        },
        "empty": {
            "message": "Aucune transaction",
            "receive": "Recevoir TON",
            "description": "Effectuez votre première transaction"
        },
        "pendingTransactions": "Transactions en attente"
    },
    "transactions": {
        "title": "Transactions",
        "history": "Historique",
        "filter": {
            "holders": "Cartes",
            "ton": "Transactions du portefeuille",
            "any": "Tous",
            "type": "Type",
            "accounts": "Dépenses"
        }
    },
    "tx": {
        "sending": "Envoi en cours",
        "sent": "Envoyé",
        "received": "Reçu",
        "bounced": "Rebondi",
        "tokenTransfer": "Transfert de jeton",
        "airdrop": "Airdrop",
        "failed": "Échoué",
        "timeout": "Expiration",
        "batch": "Lot"
    },
    "txPreview": {
        "sendAgain": "Envoyer à nouveau",
        "blockchainFee": "Frais de réseau",
        "blockchainFeeDescription": "Ces frais sont également appelés GAS. Ils sont requis pour qu’une transaction soit traitée avec succès dans la blockchain. Le montant dépend du travail que les validateurs doivent fournir pour inclure la transaction dans le bloc."
    },
    "receive": {
        "title": "Recevoir",
        "subtitle": "Envoyez uniquement des Toncoin et des jetons sur le réseau TON à cette adresse, sinon vous risquez de perdre vos fonds.",
        "share": {
            "title": "Mon adresse Tonhub",
            "error": "Échec du partage de l’adresse, veuillez réessayer ou contacter le support"
        },
        "holdersJettonWarning": "Transférez uniquement {{symbol}} à cette adresse, si vous envoyez un autre jeton, vous le perdrez.",
        "assets": "Jetons et comptes",
        "fromExchange": "Depuis un échange",
        "otherCoins": "Autres jetons",
        "deposit": "Déposer sur"
    },
    "transfer": {
        "title": "Envoyer",
        "titleAction": "Action",
        "confirm": "Êtes-vous sûr de vouloir continuer ?",
        "error": {
            "invalidAddress": "Adresse invalide",
            "invalidAddressMessage": "Veuillez vérifier l’adresse du destinataire",
            "invalidAmount": "Montant invalide",
            "invalidDomain": "Domaine invalide",
            "invalidDomainString": "Minimum 4 caractères, maximum 126. Lettres latines (a-z), chiffres (0-9) et tiret (-) autorisés. Pas de tiret au début ou à la fin.",
            "sendingToYourself": "Vous ne pouvez pas vous envoyer de pièces à vous-même",
            "zeroCoins": "Impossible d’envoyer zéro pièce",
            "zeroCoinsAlert": "Vous essayez d’envoyer zéro pièce",
            "notEnoughCoins": "Vous n’avez pas assez de fonds sur votre solde",
            "addressIsForTestnet": "Cette adresse est pour le réseau de test",
            "addressCantReceive": "Cette adresse ne peut pas recevoir de pièces",
            "addressIsNotActive": "Ce portefeuille n’a pas d’historique",
            "addressIsNotActiveDescription": "Aucune transaction n’a été effectuée depuis cette adresse",
            "invalidTransaction": "Transaction invalide",
            "invalidTransactionMessage": "Veuillez vérifier les détails de la transaction",
            "memoRequired": "Ajoutez un mémo/tag pour éviter la perte de fonds",
            "holdersMemoRequired": "Tag/MEMO",
            "memoChange": "Modifier le mémo/tag en \"{{memo}}\"",
            "gaslessFailed": "Échec de l’envoi de la transaction",
            "gaslessFailedMessage": "Veuillez réessayer ou contacter le support",
            "gaslessFailedEstimate": "Échec de l’estimation des frais, réessayez plus tard ou contactez le support",
            "gaslessCooldown": "Vous ne pouvez payer les frais de réseau en jetons qu’une fois toutes les quelques minutes. Veuillez patienter ou payer les frais en TON.",
            "gaslessCooldownTitle": "Attendez quelques minutes avant la prochaine transaction",
            "gaslessCooldownWait": "Je vais attendre",
            "gaslessCooldownPayTon": "Payer le gaz en TON",
            "gaslessNotEnoughFunds": "Fonds insuffisants",
            "gaslessNotEnoughFundsMessage": "Le montant du transfert sans gaz et les frais sont supérieurs à votre solde, essayez d’envoyer un montant plus petit ou contactez le support",
            "gaslessTryLater": "Réessayez plus tard",
            "gaslessTryLaterMessage": "Vous pouvez réessayer plus tard ou contacter le support",
            "gaslessNotEnoughCoins": "{{fee}} de frais requis pour envoyer, il manque {{missing}}",
            "notEnoughJettons": "Pas assez de {{symbol}}",
            "jettonChange": "Le destinataire ne prend en charge que les transferts {{symbol}}, veuillez changer le destinataire ou la devise",
            "notEnoughGasTitle": "TON insuffisant pour couvrir les frais de gaz",
            "notEnoughGasMessage": "Veuillez recharger votre portefeuille avec TON (au moins {{diff}} TON de plus est nécessaire) et réessayer"
        },
        "changeJetton": "Basculer en {{symbol}}",
        "sendAll": "Max",
        "scanQR": "scanner le code QR",
        "sendTo": "Envoyer à",
        "fee": "Frais de réseau : {{fee}}",
        "feeEmpty": "Les frais seront calculés plus tard",
        "feeTitle": "Frais de blockchain",
        "feeTotalTitle": "Frais totaux de blockchain",
        "purpose": "But de la transaction",
        "comment": "Message (facultatif)",
        "commentDescription": "Le message sera visible par tous sur la blockchain",
        "commentRequired": "Vérifiez votre mémo/tag avant l’envoi",
        "commentLabel": "Message",
        "checkComment": "Vérifier avant l’envoi",
        "confirmTitle": "Confirmer la transaction",
        "confirmManyTitle": "Confirmer {{count}} transactions",
        "unknown": "Opération inconnue",
        "moreDetails": "Plus de détails",
        "gasFee": "Frais de gaz",
        "contact": "Votre contact",
        "firstTime": "Premier envoi",
        "requestsToSign": "{{app}} demande une signature",
        "smartContract": "Opération de contrat intelligent",
        "txsSummary": "Total",
        "txsTotal": "Montant total",
        "gasDetails": "Détails des frais de gaz",
        "jettonGas": "Gaz pour l'envoi de jetons",
        "unusualJettonsGas": "Le gaz est plus élevé que d'habitude",
        "unusualJettonsGasTitle": "Les frais d'envoi de jetons sont de {{amount}} TON",
        "unusualJettonsGasMessage": "Les frais de transaction des jetons (Gaz) sont plus élevés que d'habitude",
        "addressNotActive": "Ce portefeuille n'a eu aucune transaction sortante",
        "wrongJettonTitle": "Jeton incorrect",
        "wrongJettonMessage": "Vous essayez d'envoyer un jeton que vous n'avez pas",
        "notEnoughJettonsTitle": "Pas assez de jetons",
        "notEnoughJettonsMessage": "Vous essayez d'envoyer plus de jetons que vous n'en avez",
        "aboutFees": "À propos des frais",
        "aboutFeesDescription": "Les frais pour les transactions dépendent de plusieurs facteurs, tels que la congestion du réseau, la taille de la transaction, le prix du gaz et les paramètres de configuration de la blockchain. Plus la demande est élevée ou plus la taille de la transaction est grande (message/commentaire), plus les frais seront élevés.",
        "gaslessTransferSwitch": "Payer les frais de gaz en {{symbol}}"
    },
    "auth": {
        "phoneVerify": "Vérifier le numéro",
        "phoneNumber": "Numéro de téléphone",
        "phoneTitle": "Votre numéro",
        "phoneSubtitle": "Nous enverrons un code de vérification pour confirmer\nvotre numéro.",
        "codeTitle": "Entrez le code",
        "codeSubtitle": "Nous avons envoyé un code de vérification à ",
        "codeHint": "Code",
        "title": "Connexion à {{name}}",
        "message": "demande à se connecter à votre compte portefeuille {{wallet}}",
        "hint": "Aucun fonds ne sera transféré à l’application et aucun accès à vos coins ne sera accordé.",
        "action": "Autoriser",
        "expired": "Cette demande d’authentification est expirée",
        "failed": "Échec de l’authentification",
        "completed": "Cette demande d’authentification est déjà terminée",
        "authorized": "Demande d’autorisation approuvée",
        "authorizedDescription": "Vous pouvez maintenant revenir à l’application.",
        "noExtensions": "Aucune extension pour le moment",
        "noApps": "Aucune application connectée pour le moment",
        "name": "Applications connectées",
        "yourWallet": "Votre portefeuille",
        "revoke": {
            "title": "Êtes-vous sûr de vouloir révoquer cette application ?",
            "message": "Cela détruira le lien entre votre portefeuille et l’application, mais vous pourrez toujours essayer de vous reconnecter.",
            "action": "Révoquer"
        },
        "apps": {
            "title": "Applications de confiance",
            "delete": {
                "title": "Supprimer cette extension ?",
                "message": "Cela détruira le lien entre votre portefeuille et l’extension, mais vous pourrez toujours essayer de vous reconnecter."
            },
            "description": "Les applications ou extensions que vous avez autorisées s’afficheront ici. Vous pouvez révoquer leur accès à tout moment.",
            "installExtension": "Installez et ouvrez l’extension pour cette application",
            "moreWallets": "Plus de portefeuilles ({{count}})",
            "connectionSecureDescription": "Aucun fonds ne sera transféré à l’application et aucun accès à vos coins ne sera accordé"
        },
        "consent": "En cliquant sur Continuer, vous acceptez nos"
    },
    "install": {
        "title": "Demande de connexion",
        "message": "<strong>{{name}}</strong> souhaite se connecter à votre compte",
        "action": "Installer"
    },
    "sign": {
        "title": "Demande de signature",
        "message": "Demande de signature d’un message",
        "hint": "Aucun fonds ne sera transféré à l’application et aucun accès à vos coins ne sera accordé.",
        "action": "Signer"
    },
    "migrate": {
        "title": "Migrer les anciens portefeuilles",
        "subtitle": "Si vous utilisez des portefeuilles obsolètes, vous pouvez automatiquement déplacer tous les fonds depuis vos anciennes adresses.",
        "inProgress": "Migration des anciens portefeuilles...",
        "transfer": "Transfert des coins depuis {{address}}",
        "check": "Vérification de l’adresse {{address}}",
        "keyStoreTitle": "Transition vers une nouvelle méthode de sécurité",
        "keyStoreSubtitle": "Nous voulons que vos clés soient toujours en sécurité, nous avons donc mis à jour la méthode de protection. Nous avons besoin de votre autorisation pour transférer vos clés vers un nouveau stockage sécurisé.",
        "failed": "Échec de la migration"
    },
    "qr": {
        "title": "Dirigez la caméra vers le code QR",
        "requestingPermission": "Demande d’autorisations de la caméra...",
        "noPermission": "Autoriser l’accès à la caméra pour scanner les codes QR",
        "requestPermission": "Ouvrir les paramètres",
        "failedToReadFromImage": "Impossible de lire le code QR depuis l’image"
    },
    "products": {
        "addNew": "Ajouter un nouveau produit",
        "tonConnect": {
            "errors": {
                "connection": "Erreur de connexion",
                "invalidKey": "Clé dApp invalide",
                "invalidSession": "Session invalide",
                "invalidTestnetFlag": "Réseau invalide",
                "alreadyCompleted": "Demande déjà terminée",
                "unknown": "Erreur inconnue, veuillez réessayer ou contacter le support"
            },
            "successAuth": "Connecté"
        },
        "savings": "Épargne",
        "accounts": "Tokens",
        "services": "Extensions",
        "oldWallets": {
            "title": "Anciens portefeuilles",
            "subtitle": "Appuyez pour migrer les anciens portefeuilles"
        },
        "transactionRequest": {
            "title": "Transaction demandée",
            "subtitle": "Appuyez pour voir la demande",
            "groupTitle": "Demandes de transaction",
            "wrongNetwork": "Mauvais réseau",
            "wrongFrom": "Mauvais expéditeur",
            "invalidFrom": "Adresse d’expéditeur invalide",
            "noConnection": "L’application n’est pas connectée",
            "expired": "Demande expirée",
            "invalidRequest": "Demande invalide",
            "failedToReport": "La transaction est envoyée mais n’a pas pu être signalée à l’application",
            "failedToReportCanceled": "La transaction est annulée mais n’a pas pu être signalée à l’application"
        },
        "signatureRequest": {
            "title": "Signature demandée",
            "subtitle": "Appuyez pour voir la demande"
        },
        "staking": {
            "earnings": "Revenus",
            "title": "TON Staking",
            "balance": "Solde staking",
            "subtitle": {
                "join": "Gagnez jusqu’à {{apy}}% sur vos TON",
                "joined": "Gagnez jusqu’à {{apy}}%",
                "rewards": "Intérêt estimé",
                "apy": "~13.3% de rendement annuel sur la contribution",
                "devPromo": "Multipliez vos pièces de test"
            },
            "pools": {
                "title": "Pools de staking",
                "active": "Actif",
                "best": "Meilleur",
                "alternatives": "Alternatives",
                "private": "Pools privés",
                "restrictedTitle": "Pool restreint",
                "restrictedMessage": "Ce pool de staking est uniquement disponible pour les membres du Whales Club",
                "viewClub": "Voir Whales Club",
                "nominators": "Nominateurs",
                "nominatorsDescription": "Pour tout le monde",
                "club": "Club",
                "clubDescription": "Pour les membres du Whales Club",
                "team": "Équipe",
                "teamDescription": "Pour les coéquipiers Ton Whales et le TOP 15 des membres du Whales Club",
                "joinClub": "Rejoindre",
                "joinTeam": "Rejoindre",
                "clubBanner": "Rejoignez notre Club",
                "clubBannerLearnMore": "En savoir plus sur notre club",
                "clubBannerDescription": "Pour les membres du Whales Club",
                "teamBanner": "Rejoignez notre Équipe",
                "teamBannerLearnMore": "En savoir plus sur notre équipe",
                "teamBannerDescription": "Pour notre équipe et le TOP 15 des membres du Whales Club",
                "epnPartners": "ePN Partners",
                "epnPartnersDescription": "Rejoignez plus de 200 000 webmasters",
                "moreAboutEPN": "Info",
                "lockups": "Lockups Pool",
                "lockupsDescription": "Permet aux détenteurs de gros lockups en TON de gagner un revenu supplémentaire",
                "tonkeeper": "Tonkeeper",
                "tonkeeperDescription": "Portefeuille mobile convivial sur TON",
                "liquid": "Staking Liquide",
                "liquidDescription": "Envoyez du TON en staking et recevez à la place des wsTON",
                "rateTitle": "Taux de change"
            },
            "transfer": {
                "stakingWarning": "Vous pouvez toujours déposer une nouvelle mise ou augmenter l’existante avec n’importe quel montant. Notez que le montant minimum est : {{minAmount}}",
                "depositStakeTitle": "Staking",
                "depositStakeConfirmTitle": "Confirmer le Staking",
                "withdrawStakeTitle": "Demande de Retrait",
                "withdrawStakeConfirmTitle": "Confirmer le Retrait",
                "topUpTitle": "Recharger",
                "topUpConfirmTitle": "Confirmer la Recharge",
                "notEnoughStaked": "malheureusement vous n’avez pas suffisamment de coins en staking",
                "confirmWithdraw": "Demander le Retrait",
                "confirmWithdrawReady": "Retirer maintenant",
                "restrictedTitle": "Ce Pool de Staking est restreint",
                "restrictedMessage": "Vos fonds ne participeront pas au staking si votre adresse de portefeuille n’est pas sur la liste autorisée, mais resteront au solde du pool en attente de retrait",
                "notEnoughCoinsFee": "Vous n’avez pas assez de TON sur le solde de votre portefeuille pour payer les frais. Veuillez noter que les {{amount}} TON de frais doivent être sur le solde principal, et non sur le solde de staking",
                "notEnoughCoins": "Vous n’avez pas assez de fonds sur le solde de votre portefeuille pour recharger le solde de staking",
                "ledgerSignText": "Staking : {{action}}"
            },
            "nextCycle": "Prochain cycle",
            "cycleNote": "Toutes les transactions prennent effet une fois le cycle terminé",
            "cycleNoteWithdraw": "Votre demande sera exécutée après la fin du cycle. Le retrait devra être confirmé à nouveau.",
            "buttonTitle": "staker",
            "balanceTitle": "Solde Staking",
            "actions": {
                "deposit": "Déposer",
                "top_up": "Recharger",
                "withdraw": "Retirer",
                "calc": "Calculer",
                "swap": "Échanger instantanément"
            },
            "join": {
                "title": "Devenez validateur TON",
                "message": "Le staking est un bien public pour l’écosystème TON. Vous pouvez aider à sécuriser le réseau et toucher des récompenses dans le processus",
                "buttonTitle": "Commencer à Gagner",
                "moreAbout": "En savoir plus sur Ton Whales Staking Pool",
                "earn": "Gagnez jusqu’à",
                "onYourTons": "sur vos TON",
                "apy": "13.3%",
                "yearly": "Rendement annuel",
                "cycle": "Recevez vos récompenses de staking toutes les 36h",
                "ownership": "Les TON stakés restent à vous",
                "withdraw": "Retirez et rechargez à tout moment",
                "successTitle": "{{amount}} TON stakés",
                "successEtimation": "Vos gains annuels estimés sont de {{amount}}\u00A0TON\u00A0(${{price}}).",
                "successNote": "Vos TON stakés seront activés au début du prochain cycle."
            },
            "pool": {
                "balance": "Mise Totale",
                "members": "Nominateurs",
                "profitability": "Rentabilité"
            },
            "empty": {
                "message": "Vous n’avez aucune transaction"
            },
            "pending": "en attente",
            "withdrawStatus": {
                "pending": "Retrait en attente",
                "ready": "Retrait prêt",
                "withdrawNow": "Appuyez pour retirer maintenant"
            },
            "depositStatus": {
                "pending": "Dépôt en attente"
            },
            "withdraw": "Retirer",
            "sync": "Téléchargement des données de staking",
            "unstake": {
                "title": "Êtes-vous sûr de vouloir demander un retrait ?",
                "message": "Veuillez noter qu’en demandant un retrait, tous les dépôts en attente seront également retournés."
            },
            "unstakeLiquid": {
                "title": "Retirez vos wsTON",
                "message": "Vous pouvez retirer les fonds directement après la fin du cycle ou échanger instantanément wsTON contre TON sur "
            },
            "learnMore": "Info",
            "moreInfo": "Plus d’infos",
            "calc": {
                "yearly": "Gains annuels",
                "monthly": "Gains mensuels",
                "daily": "Gains quotidiens",
                "note": "Calcul incluant tous les frais",
                "text": "Calculateur de gains",
                "yearlyTopUp": "Après la Recharge",
                "yearlyTotal": "Total des gains sur un an",
                "yearlyCurrent": "Actuel",
                "topUpTitle": "Vos gains annuels",
                "goToTopUp": "Aller à la Recharge"
            },
            "info": {
                "rate": "jusqu’à 13.3%",
                "rateTitle": "Rendement Annuel",
                "frequency": "Toutes les 36 heures",
                "frequencyTitle": "Fréquence des Récompenses",
                "minDeposit": "Dépôt minimal",
                "poolFee": "3.3%",
                "poolFeeTitle": "Frais du Pool",
                "depositFee": "Frais de Dépôt",
                "withdrawFee": "Frais de Retrait",
                "withdrawRequestFee": "Frais de Demande de Retrait",
                "withdrawCompleteFee": "Frais de Finalisation du Retrait",
                "depositFeeDescription": "Montant TON qui sera déduit du dépôt pour couvrir les frais d’action de dépôt; le montant inutilisé vous sera retourné",
                "withdrawFeeDescription": "Montant du transfert TON nécessaire pour couvrir les frais d’action de retrait; le montant inutilisé vous sera retourné",
                "withdrawCompleteDescription": "Montant du transfert TON nécessaire pour couvrir les frais de finalisation du retrait; le montant inutilisé vous sera retourné",
                "blockchainFee": "Frais de blockchain",
                "cooldownTitle": "Période Simplifiée",
                "cooldownActive": "Active",
                "cooldownInactive": "Inactive",
                "cooldownDescription": "Toutes les transactions prennent effet instantanément pendant cette période",
                "cooldownAlert": "Au début de chaque cycle de staking, la Période Simplifiée est active. Pendant cette période, vous n’avez pas à attendre la fin du cycle pour retirer ou recharger – cela se fait instantanément et vous n’avez pas besoin d’envoyer une seconde transaction pour retirer, ce qui réduit de moitié les frais de retrait. Vous pouvez transférer des fonds d’un pool à un autre sans perdre les bénéfices du cycle si la Période Simplifiée est active dans les deux pools",
                "lockedAlert": "Pendant le cycle de staking, les retraits et dépôts sont en attente. Toutes les transactions prennent effet à la fin du cycle"
            },
            "minAmountWarning": "Le montant minimal est {{minAmount}} TON",
            "tryAgainLater": "Veuillez réessayer plus tard",
            "banner": {
                "estimatedEarnings": "Vos gains annuels estimés diminueront de {{amount}}\u00A0TON\u00A0({{price}})",
                "estimatedEarningsDev": "Vos gains annuels estimés diminueront",
                "message": "Êtes-vous sûr de vouloir arrêter le staking ?"
            },
            "activePools": "Pools actifs",
            "analytics": {
                "operations": "Opérations",
                "operationsDescription": "Recharger et retirer",
                "analyticsTitle": "Analyses",
                "analyticsSubtitle": "Profit total",
                "labels": {
                    "week": "1S",
                    "month": "1M",
                    "year": "1A",
                    "allTime": "Tout"
                }
            }
        },
        "holders": {
            "title": "Compte bancaire",
            "loadingLongerTitle": "Problèmes de connexion",
            "loadingLonger": "Vérifiez votre connexion Internet et rechargez la page. Si le problème persiste, veuillez contacter le support",
            "accounts": {
                "title": "Dépenses",
                "prepaidTitle": "Cartes prépayées",
                "account": "Compte",
                "basicAccount": "Compte de dépenses",
                "proAccount": "Compte pro",
                "noCards": "Pas de cartes",
                "prepaidCard": "Tonhub Prepaid *{{lastFourDigits}}",
                "prepaidCardDescription": "Carte rechargeable pour un usage quotidien",
                "hiddenCards": "Cartes cachées",
                "hiddenAccounts": "Comptes cachés",
                "primaryName": "Compte principal",
                "paymentName": "Compte de paiement {{accountIndex}}",
                "topUp": "Recharger le compte",
                "addNew": "Ajouter un compte"
            },
            "pageTitles": {
                "general": "Cartes Tonhub",
                "card": "Carte Tonhub",
                "cardDetails": "Détails de la carte",
                "cardCredentials": "Informations sur la carte",
                "cardLimits": "Limites de la carte {{cardNumber}}",
                "cardLimitsDefault": "Limites de la carte",
                "cardDeposit": "Recharger en TON",
                "transfer": "Transférer",
                "cardSmartContract": "Smart Contract de la carte",
                "setUpCard": "Configurer la carte",
                "pin": "Changer le code PIN"
            },
            "card": {
                "card": "Carte",
                "cards": "Cartes des détenteurs",
                "title": "Carte Tonhub {{cardNumber}}",
                "defaultSubtitle": "Payez partout avec USDT ou TON par carte",
                "defaultTitle": "Carte Tonhub",
                "eurSubtitle": "Tonhub EUR",
                "type": {
                    "physical": "Carte Physique",
                    "virtual": "Virtuelle"
                },
                "notifications": {
                    "type": {
                        "card_ready": "Carte activée",
                        "deposit": "Recharge de la carte",
                        "charge": "Paiement",
                        "charge_failed": "Paiement",
                        "limits_change": {
                            "pending": "Changement de limites en cours",
                            "completed": "Limites modifiées"
                        },
                        "card_withdraw": "Transfert vers le portefeuille",
                        "contract_closed": "Contrat fermé",
                        "card_block": "Carte bloquée",
                        "card_freeze": "Carte gelée",
                        "card_unfreeze": "Carte dégélée",
                        "card_paid": "Émission de la carte bancaire"
                    },
                    "category": {
                        "deposit": "Recharge",
                        "card_withdraw": "Transfert",
                        "charge": "Achats",
                        "charge_failed": "Achats",
                        "other": "Autre"
                    },
                    "status": {
                        "charge_failed": {
                            "limit": {
                                "onetime": "Échoué (dépasse la limite ponctuelle)",
                                "daily": "Échoué (dépasse la limite quotidienne)",
                                "monthly": "Échoué (dépasse la limite mensuelle)"
                            },
                            "failed": "Échoué"
                        },
                        "completed": "Terminé"
                    }
                }
            },
            "confirm": {
                "title": "Êtes-vous sûr de vouloir fermer cet écran ?",
                "message": "Cette action annulera toutes vos modifications"
            },
            "enroll": {
                "poweredBy": "Basé sur TON, propulsé par ZenPay",
                "description_1": "Vous seul contrôlez le smart-contract",
                "description_2": "Personne d’autre que vous n’a accès à vos fonds",
                "description_3": "Vous possédez vraiment votre argent",
                "moreInfo": "Plus d’infos sur ZenPay Card",
                "buttonSub": "KYC et émission de la carte en ~5 min",
                "failed": {
                    "title": "Échec de l’autorisation",
                    "noAppData": "Pas de données app",
                    "noDomainKey": "Pas de clé de domaine",
                    "createDomainKey": "Durant la création de la clé de domaine",
                    "fetchToken": "Durant la récupération du jeton",
                    "createSignature": "Durant la création de la signature"
                }
            },
            "otpBanner": {
                "title": "Nouvelle demande de paiement",
                "accept": "Accepter",
                "decline": "Refuser",
                "expired": "Expiré"
            },
            "banner": {
                "fewMore": "Plus que quelques étapes",
                "ready": "Vérification terminée ! Votre carte est prête !",
                "readyAction": "Obtenez-la maintenant",
                "emailAction": "Vérifiez votre e-mail",
                "kycAction": "Complétez la vérification",
                "failedAction": "Échec de la vérification"
            },
            "transaction": {
                "type": {
                    "cardReady": "Carte activée",
                    "accountReady": "Compte activé",
                    "deposit": "Recharge de compte",
                    "prepaidTopUp": "Recharge prépayée",
                    "payment": "Paiement",
                    "decline": "Refus",
                    "refund": "Remboursement",
                    "limitsChanging": "Modification des limites",
                    "limitsChanged": "Limites modifiées",
                    "cardWithdraw": "Transfert au portefeuille",
                    "contractClosed": "Contrat fermé",
                    "cardBlock": "Carte bloquée",
                    "cardFreeze": "Carte gelée",
                    "cardUnfreeze": "Carte dégelée",
                    "cardPaid": "Émission de carte bancaire",
                    "unknown": "Inconnu"
                },
                "rejectReason": {
                    "approve": "n/a",
                    "generic": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "fraud_or_ban": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "not_able_to_trace_back_to_original_transaction": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "do_not_honour": "Nous ne pouvons pas effectuer l'opération pour ce commerçant",
                    "card_not_effective": "La transaction a été refusée car votre carte est actuellement bloquée. Pour continuer, débloquez votre carte via l'application mobile ou contactez le support client pour obtenir de l'aide",
                    "expired_card": "Votre carte a atteint la date d'expiration. Commandez une nouvelle carte via l'application mobile",
                    "incorrect_pin": "Il semble y avoir un problème avec votre code PIN. Veuillez vérifier les détails et réessayer. Si le problème persiste, contactez le support client pour obtenir de l'aide",
                    "cvc2_or_cvv2_incorrect": "Le CVV est incorrect. Veuillez vérifier le code à trois chiffres au dos de votre carte et réessayer",
                    "incorrect_expiry_date": "La date d'expiration saisie est incorrecte. Veuillez vérifier la date d'expiration sur votre carte ou dans l'application mobile et réessayer",
                    "invalid_card_number": "Le numéro de carte saisi est incorrect. Veuillez vérifier le numéro sur votre carte ou dans l'application mobile et réessayer",
                    "blocked_merchant_country_code": "Votre carte ne peut pas être utilisée pour des transactions dans ce pays",
                    "insufficient_funds": "Vous n'avez pas assez de fonds sur votre compte pour compléter cette transaction. Veuillez recharger votre compte et réessayer",
                    "exceeds_contactless_payments_daily_limit": "La transaction a été refusée car elle dépasse la limite de dépenses quotidienne. Veuillez contacter le support client pour obtenir de l'aide ou réessayer demain",
                    "exceeds_contactless_payments_monthly_limit": "La transaction a été refusée car elle dépasse la limite de dépenses mensuelle. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_contactless_payments_transaction_limit": "La transaction a été refusée car elle dépasse le montant maximum de la transaction. Veuillez contacter le support client pour obtenir de l'aide",
                    "exceeds_contactless_payments_weekly_limit": "La transaction a été refusée car elle dépasse la limite de dépenses hebdomadaire. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_daily_overall_limit": "La transaction a été refusée car elle dépasse la limite de dépenses quotidienne sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer demain",
                    "exceeds_internet_purchase_payments_daily_limit": "La transaction a été refusée car elle dépasse la limite quotidienne pour les transactions internet. Veuillez contacter le support client pour obtenir de l'aide ou réessayer demain",
                    "exceeds_internet_purchase_payments_monthly_limit": "La transaction a été refusée car elle dépasse la limite mensuelle pour les transactions internet. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_internet_purchase_payments_transaction_limit": "La transaction a été refusée car elle dépasse le montant maximum de la transaction. Veuillez contacter le support client pour obtenir de l'aide",
                    "exceeds_internet_purchase_payments_weekly_limit": "La transaction a été refusée car elle dépasse la limite hebdomadaire pour les transactions internet. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_monthly_overall_limit": "La transaction a été refusée car elle dépasse la limite de dépenses mensuelle sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_purchases_daily_limit": "La transaction a été refusée car elle dépasse la limite de dépenses quotidienne sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer demain",
                    "exceeds_purchases_monthly_limit": "La transaction a été refusée car elle dépasse la limite de dépenses mensuelle sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_purchases_transaction_limit": "La transaction a été refusée car elle dépasse le montant maximum de la transaction. Veuillez contacter le support client pour obtenir de l'aide",
                    "exceeds_purchases_weekly_limit": "La transaction a été refusée car elle dépasse la limite de dépenses hebdomadaire sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_settlement_risk_limit": "La transaction a été refusée car elle dépasse le montant maximum de la transaction. Veuillez contacter le support client pour obtenir de l'aide",
                    "exceeds_weekly_overall_limit": "La transaction a été refusée car elle dépasse la limite de dépenses hebdomadaire sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_withdrawal_amount_limit": "La transaction a été refusée car elle dépasse la limite de retrait en espèces sur la carte. Veuillez contacter le support client pour obtenir de l'aide",
                    "exceeds_withdrawal_maximum_limit": "La transaction a été refusée car elle dépasse la limite de retrait en espèces sur la carte. Veuillez contacter le support client pour obtenir de l'aide",
                    "exceeds_withdrawal_minimum_limit": "Le montant de la transaction est incorrect",
                    "exceeds_withdrawals_daily_limit": "La transaction a été refusée car elle dépasse la limite quotidienne de retrait en espèces sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer demain",
                    "exceeds_withdrawals_monthly_limit": "La transaction a été refusée car elle dépasse la limite mensuelle de retrait en espèces sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "exceeds_withdrawals_transaction_limit": "La transaction a été refusée car elle dépasse la limite de retrait en espèces sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer demain",
                    "exceeds_withdrawals_weekly_limit": "La transaction a été refusée car elle dépasse la limite hebdomadaire de retrait en espèces sur la carte. Veuillez contacter le support client pour obtenir de l'aide ou réessayer plus tard",
                    "transaction_not_permitted_to_card_holder": "Type de transaction non pris en charge. Veuillez contacter le commerçant",
                    "blocked_merchant_category_code": "Nous ne pouvons pas effectuer l'opération pour ce commerçant",
                    "blocked_merchant_id": "Nous ne pouvons pas effectuer l'opération pour ce commerçant",
                    "blocked_merchant_name": "Nous ne pouvons pas effectuer l'opération pour ce commerçant",
                    "blocked_terminal_id": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "no_card_record": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "suspected_fraud": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "token_not_effective": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "client_system_malfunction": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "system_malfunction": "Il semble y avoir un problème. Veuillez réessayer. Si l'erreur persiste, contactez le support client pour obtenir de l'aide",
                    "contactless_payments_switched_off": "La transaction a été refusée car les paiements sans contact sont actuellement désactivés sur votre carte. Veuillez contacter le support client pour obtenir de l'aide",
                    "internet_purchase_payments_switched_off": "La transaction a été refusée car les achats sur internet sont actuellement désactivés sur votre carte. Veuillez contacter le support client pour obtenir de l'aide",
                    "withdrawals_switched_off": "La transaction a été refusée car les retraits en espèces sont actuellement désactivés sur votre carte. Veuillez contacter le support client pour obtenir de l'aide",
                    "purchases_switched_off": "La transaction a été refusée car les achats sont actuellement désactivés sur votre carte. Veuillez contacter le support client pour obtenir de l'aide",
                    "advice_acknowledged_no_financial_liability_accepted": "Nous ne pouvons pas effectuer l'opération pour ce commerçant",
                    "merchant_without_3ds": "Nous ne pouvons pas effectuer l'opération pour ce commerçant"
                },
                "to": {
                    "single": "À",
                    "prepaidCard": "À la carte prépayée",
                    "wallet": "Au portefeuille",
                    "account": "Au compte"
                },
                "from": {
                    "single": "De",
                    "prepaidCard": "De la carte prépayée",
                    "wallet": "Du portefeuille",
                    "account": "Du compte"
                },
                "category": {
                    "transfers": "Retraits",
                    "purchase": "Achat",
                    "cash": "Retraits en espèces",
                    "other": "Autre",
                    "deposit": "Recharges"
                },
                "status": {
                    "failed": "Échoué",
                    "overOnetimeFailed": "Échoué (au-delà de la limite par transaction)",
                    "overDailyFailed": "Échoué (au-delà de la limite quotidienne)",
                    "overMonthlyFailed": "Échoué (au-delà de la limite mensuelle)",
                    "complete": "Terminé"
                },
                "statsBlock": {
                    "title": "Transactions",
                    "description": "Dépenses en {{month}}",
                    "spent": "Dépensé",
                    "in": "en {{month}}"
                },
                "list": {
                    "emptyText": "Aucune transaction pour le moment"
                },
                "single": {
                    "report": "Signaler un problème"
                },
                "pendingPopover": {
                    "title": "Transaction en attente",
                    "cancelButtonText": "Afficher les détails de la transaction",
                    "text": "La validation de la blockchain est actuellement en cours. Cela peut prendre quelques minutes"
                }
            },
        }
    },
    "welcome": {
        "title": "Tonhub",
        "titleDev": "Ton Sandbox Wallet",
        "subtitle": "Portefeuille TON simple et sécurisé",
        "subtitleDev": "Portefeuille pour développeurs",
        "createWallet": "Obtenir un nouveau portefeuille",
        "importWallet": "J’ai déjà un portefeuille",
        "slogan": "Voici le nouveau Tonhub",
        "sloganDev": "Ceci est Ton Sandbox",
        "slide_1": {
            "title": "Protégé",
            "subtitle": "Contrat intelligent fiable, Touch/Face ID avec code d’accès et toutes les transactions sur une blockchain décentralisée"
        },
        "slide_2": {
            "title": "Avec une cryptocard sympa",
            "subtitle": "Commandez une carte maintenant. Transferts internes et achats en quelques minutes.\nTout cela est une carte Tonhub unique"
        },
        "slide_3": {
            "title": "Rapide",
            "subtitle": "Grâce à l’architecture unique de TON, les transactions s’effectuent en quelques secondes"
        }
    },
    "legal": {
        "title": "Mentions légales",
        "subtitle": "J’ai lu et j’accepte ",
        "create": "Créer une sauvegarde",
        "createSubtitle": "Conservez votre clé privée en lieu sûr et ne la partagez avec personne. C’est le seul moyen d’accéder à votre portefeuille si l’appareil est perdu.",
        "privacyPolicy": "Politique de confidentialité",
        "termsOfService": "Conditions d’utilisation"
    },
    "create": {
        "addNew": "Ajouter un nouveau portefeuille",
        "inProgress": "Création...",
        "backupTitle": "Votre clé de sauvegarde",
        "backupSubtitle": "Notez ces 24 mots dans le même ordre et conservez-les dans un endroit secret",
        "okSaved": "OK, je l’ai enregistré",
        "copy": "Copier dans le presse-papiers"
    },
    "import": {
        "title": "Saisissez la clé de sauvegarde",
        "subtitle": "Veuillez restaurer l’accès à votre portefeuille en entrant les 24 mots secrets que vous avez notés lors de sa création",
        "fullSeedPlaceholder": "Entrez 24 mots secrets",
        "fullSeedPaste": "Ou collez la phrase de récupération complète avec chaque mot séparé par un espace"
    },
    "secure": {
        "title": "Protégez votre portefeuille",
        "titleUnprotected": "Votre appareil n’est pas protégé",
        "subtitle": "Nous utilisons la biométrie pour authentifier les transactions et nous assurer que seul vous pouvez transférer vos coins.",
        "subtitleUnprotected": "Il est fortement recommandé d’activer un code d’accès sur votre appareil pour protéger vos actifs.",
        "subtitleNoBiometrics": "Il est fortement recommandé d’activer la biométrie sur votre appareil pour protéger vos actifs. Nous utilisons la biométrie pour sécuriser les transactions.",
        "messageNoBiometrics": "Il est fortement recommandé d’activer la biométrie sur votre appareil pour protéger vos actifs.",
        "protectFaceID": "Activer Face ID",
        "protectTouchID": "Activer Touch ID",
        "protectBiometrics": "Activer la biométrie",
        "protectPasscode": "Activer le code d’accès de l’appareil",
        "upgradeTitle": "Mise à niveau requise",
        "upgradeMessage": "Veuillez autoriser l’application à accéder aux clés du portefeuille pour la mise à niveau. Aucun fonds ne sera transféré. Assurez-vous d’avoir sauvegardé vos clés.",
        "allowUpgrade": "Autoriser la mise à niveau",
        "backup": "Sauvegarder les mots secrets",
        "onLaterTitle": "Configurer plus tard",
        "onLaterMessage": "Vous pourrez configurer la protection plus tard dans les paramètres",
        "onLaterButton": "Configurer plus tard",
        "onBiometricsError": "Erreur lors de l’authentification biométrique",
        "lockAppWithAuth": "Authentifier lors de l’ouverture de l’application",
        "methodPasscode": "code d’accès",
        "passcodeSetupDescription": "Le code PIN aide à protéger votre portefeuille contre tout accès non autorisé"
    },
    "backup": {
        "title": "Votre phrase de récupération",
        "subtitle": "Notez ces 24 mots dans l’ordre indiqué ci-dessous et conservez-les dans un endroit sûr."
    },
    "backupIntro": {
        "title": "Sauvegardez votre portefeuille",
        "subtitle": "Êtes-vous sûr d’avoir enregistré vos 24 mots secrets ?",
        "saved": "Oui, je les ai enregistrés",
        "goToBackup": "Non, aller à la sauvegarde"
    },
    "errors": {
        "incorrectWords": {
            "title": "Mots incorrects",
            "message": "Vous avez entré des mots secrets incorrects. Veuillez vérifier et réessayer."
        },
        "secureStorageError": {
            "title": "Erreur de stockage sécurisé",
            "message": "Impossible de sauvegarder les données."
        },
        "title": "Oups",
        "invalidNumber": "Ce n’est pas un nombre valide. Vérifiez votre saisie et réessayez.",
        "codeTooManyAttempts": "Vous avez trop essayé, réessayez dans 15 minutes.",
        "codeInvalid": "Code invalide. Vérifiez et réessayez.",
        "unknown": "Erreur inconnue. Pouvez-vous essayer de redémarrer ?"
    },
    "confirm": {
        "logout": {
            "title": "Êtes-vous sûr de vouloir déconnecter votre portefeuille de cette application et supprimer toutes vos données ?",
            "message": "Cette action supprimera tous les comptes de cet appareil. Assurez-vous d’avoir sauvegardé vos 24 mots secrets avant de continuer."
        },
        "changeCurrency": "Changer la devise principale en {{currency}}"
    },
    "neocrypto": {
        "buttonTitle": "acheter",
        "alert": {
            "title": "Comment fonctionne le paiement",
            "message": "Remplissez les champs requis -> Sélectionnez la cryptomonnaie et indiquez l’adresse de votre portefeuille ainsi que le montant à acheter -> Procédez au paiement -> Renseignez correctement vos informations de facturation. Le paiement par carte est traité en toute sécurité par nos partenaires -> Terminez l’achat. Aucune inscription n’est requise !"
        },
        "title": "Acheter TON avec carte de crédit (USD, EUR et RUB)",
        "description": "Vous serez redirigé vers Neocrypto. Les services de paiement sont fournis par Neocrypto, qui est une plateforme distincte appartenant à un tiers.\n\nVeuillez lire et accepter les Conditions d’utilisation de Neocrypto avant de les utiliser.",
        "doNotShow": "Ne plus afficher pour Neocrypto",
        "termsAndPrivacy": "J’ai lu et j’accepte ",
        "confirm": {
            "title": "Êtes-vous sûr de vouloir fermer ce formulaire ?",
            "message": "Cette action annulera toutes vos modifications"
        }
    },
    "known": {
        "deposit": "Dépôt",
        "depositOk": "Dépôt accepté",
        "withdraw": "Demande de retrait de {{coins}} TON",
        "withdrawAll": "Demander le retrait de tous les coins",
        "withdrawLiquid": "Retirer",
        "withdrawCompleted": "Retrait effectué",
        "withdrawRequested": "Retrait demandé",
        "upgrade": "Mettre à niveau le code vers {{hash}}",
        "upgradeOk": "Mise à niveau terminée",
        "cashback": "Cashback",
        "tokenSent": "Jeton envoyé",
        "tokenReceived": "Jeton reçu",
        "holders": {
            "topUpTitle": "Montant de recharge",
            "accountTopUp": "Recharge de {{amount}} TON",
            "accountJettonTopUp": "Recharge de compte",
            "limitsChange": "Changement de limites",
            "limitsTitle": "Limites",
            "limitsOneTime": "Par transaction",
            "limitsDaily": "Par jour",
            "limitsMonthly": "Par mois",
            "accountLimitsChange": "Modification des limites du compte"
        }
    },
    "jetton": {
        "token": "jeton",
        "productButtonTitle": "Jetons",
        "productButtonSubtitle": "{{jettonName}} et {{count}} autres",
        "hidden": "Jetons cachés",
        "liquidPoolDescriptionDedust": "Liquidité pour {{name0}}/{{name1}} sur DeDust DEX",
        "liquidPoolDescriptionStonFi": "Liquidité pour {{name0}}/{{name1}} sur STON.fi DEX",
        "emptyBalance": "Solde vide",
        "jettonsNotFound": "Aucun jeton trouvé"
    },
    "connections": {
        "extensions": "Extensions",
        "connections": "Connexions"
    },
    "accounts": {
        "active": "Actif",
        "noActive": "Aucun compte actif",
        "disabled": "Masqué",
        "alertActive": "Marquer {{symbol}} comme actif",
        "alertDisabled": "Marquer {{symbol}} comme masqué",
        "description": "Pour changer le statut d’un compte, maintenez enfoncé le bouton du compte sur l’écran principal ou utilisez ce menu. Le compte sera ajouté à l’écran d’accueil ou masqué.",
        "noAccounts": "Vous n’avez pas encore de compte"
    },
    "spamFilter": {
        "minAmount": "Montant MIN TON",
        "dontShowComments": "Ne pas afficher les commentaires des transactions SPAM",
        "minAmountDescription": "Les transactions avec un montant inférieur à {{amount}} TON seront automatiquement marquées comme SPAM",
        "applyConfig": "Appliquer les paramètres du filtre SPAM",
        "denyList": "Liste bloquée manuellement",
        "denyListEmpty": "Aucune adresse bloquée",
        "unblockConfirm": "Débloquer l’adresse",
        "blockConfirm": "Marquer l’adresse comme spam",
        "description": "Vous pouvez facilement ajouter une adresse à la liste bloquée en cliquant sur une transaction ou une adresse et en sélectionnant « Marquer l’adresse comme spam »."
    },
    "security": {
        "title": "Sécurité",
        "passcodeSettings": {
            "setupTitle": "Configurer le code PIN",
            "confirmTitle": "Confirmer le code PIN",
            "changeTitle": "Modifier le code PIN",
            "resetTitle": "Réinitialiser le code PIN",
            "resetDescription": "Si vous avez oublié votre code PIN, vous pouvez le réinitialiser en entrant les 24 mots secrets que vous avez notés lors de la création du portefeuille.",
            "resetAction": "Réinitialiser",
            "error": "Code PIN incorrect",
            "tryAgain": "Réessayer",
            "success": "Code PIN défini avec succès",
            "enterNew": "Créer un code PIN",
            "confirmNew": "Confirmer le nouveau code PIN",
            "enterCurrent": "Entrez votre code PIN",
            "enterPrevious": "Entrez l’ancien code PIN",
            "enterNewDescription": "La configuration d’un mot de passe ajoute une couche de sécurité supplémentaire",
            "changeLength": "Utiliser un code PIN de {{length}} chiffres",
            "forgotPasscode": "Code PIN oublié ?",
            "logoutAndReset": "Se déconnecter et réinitialiser le code PIN"
        },
        "auth": {
            "biometricsPermissionCheck": {
                "title": "Autorisation requise",
                "message": "Veuillez autoriser l’application à accéder à la biométrie pour l’authentification",
                "openSettings": "Ouvrir les réglages",
                "authenticate": "S’authentifier avec le code d’accès"
            },
            "biometricsSetupAgain": {
                "title": "Nouvelles données biométriques détectées",
                "message": "Veuillez réactiver la biométrie dans les paramètres de sécurité",
                "setup": "Configurer",
                "authenticate": "Continuer avec le code d’accès"
            },
            "biometricsCooldown": {
                "title": "Temporisation biométrique",
                "message": "Veuillez réessayer plus tard, ou verrouillez et déverrouillez votre appareil avec son code d’accès pour réactiver la biométrie"
            },
            "biometricsCorrupted": {
                "title": "Biométrie corrompue et aucun code PIN défini",
                "message": "Votre portefeuille n’est plus disponible. Pour restaurer votre portefeuille, appuyez sur « Restaurer » (vous serez déconnecté) et saisissez vos 24 mots secrets",
                "messageLogout": "Votre portefeuille n’est plus disponible. Pour le restaurer, appuyez sur « Déconnexion » (votre portefeuille actuel sera supprimé) et ajoutez votre portefeuille à nouveau",
                "logout": "Déconnexion",
                "restore": "Restaurer"
            },
            "canceled": {
                "title": "Annulé",
                "message": "Authentification annulée, veuillez réessayer"
            }
        }
    },
    "report": {
        "title": "Signaler",
        "scam": "arnaque",
        "bug": "bogue",
        "spam": "spam",
        "offense": "contenu offensant",
        "posted": "Votre signalement a été envoyé",
        "error": "Erreur lors de l’envoi du signalement",
        "message": "Message (obligatoire)",
        "reason": "Raison du signalement"
    },
    "review": {
        "title": "Évaluer l’extension",
        "rating": "note",
        "review": "Avis (facultatif)",
        "heading": "Titre",
        "error": "Erreur lors de la publication de l’avis",
        "posted": "Merci pour votre retour !",
        "postedDescription": "Votre avis sera publié après modération"
    },
    "deleteAccount": {
        "title": "Êtes-vous sûr de vouloir supprimer le compte ?",
        "action": "Supprimer le compte et toutes les données",
        "logOutAndDelete": "Se déconnecter et tout supprimer",
        "description": "Cette action supprimera toutes les données et le portefeuille sélectionné de cet appareil et votre compte blockchain.\nVous devez transférer tous vos coins TON vers un autre portefeuille. Avant de continuer, assurez-vous d’avoir suffisamment de TON (plus de {{amount}}) pour finaliser la transaction.",
        "complete": "Suppression de compte terminée",
        "error": {
            "hasNfts": "Vous possédez des NFT dans votre portefeuille. Pour le supprimer, envoyez-les vers un autre portefeuille.",
            "fetchingNfts": "Impossible de vérifier s’il y a des NFT. Assurez-vous qu’il n’y en a pas avant de supprimer le compte.",
            "hasUSDTBalanceTitle": "Vous avez du solde USDT dans votre portefeuille",
            "hasUSDTBalanceMessage": "Pour supprimer le compte, envoyez-le vers un autre portefeuille."
        },
        "confirm": {
            "title": "Êtes-vous sûr de vouloir supprimer votre compte et toutes les données de cette application ?",
            "message": "Cette action supprimera votre compte et toutes les données de l’application et transférera tous vos coins TON vers l’adresse spécifiée.\nVérifiez bien l’adresse de réception. Des frais de blockchain standard seront appliqués."
        },
        "checkRecipient": "Vérifier le destinataire",
        "checkRecipientDescription": "Pour désactiver votre compte, vous devez transférer tous les fonds vers un autre portefeuille (adresse destinataire). Vérifiez-la soigneusement avant de continuer."
    },
    "logout": {
        "title": "Êtes-vous sûr de vouloir vous déconnecter de {{name}} ?",
        "logoutDescription": "L’accès au portefeuille sera désactivé. Avez-vous sauvegardé votre clé privée ?"
    },
    "contacts": {
        "title": "Contacts",
        "contact": "Contact",
        "unknown": "Inconnu",
        "contacts": "Mes contacts",
        "name": "Nom",
        "lastName": "Nom de famille",
        "company": "Entreprise",
        "add": "Ajouter un contact",
        "edit": "Modifier",
        "save": "Enregistrer",
        "notes": "Notes",
        "alert": {
            "name": "Nom incorrect",
            "nameDescription": "Le nom du contact ne peut pas être vide ou dépasser 126 caractères",
            "notes": "Champ incorrect",
            "notesDescription": "Le champ ne peut pas dépasser 280 caractères"
        },
        "delete": "Supprimer le contact",
        "empty": "Pas encore de contacts",
        "description": "Vous pouvez ajouter une adresse à vos contacts en maintenant une transaction ou une adresse enfoncée ou en utilisant le bouton « Ajouter » ou la liste des contacts récents ci-dessous",
        "contactAddress": "Adresse du contact",
        "search": "Nom ou adresse de portefeuille",
        "new": "Nouveau contact"
    },
    "currency": {
        "USD": "Dollar américain",
        "EUR": "Euro",
        "RUB": "Rouble russe",
        "GBP": "Livre sterling",
        "CHF": "Franc suisse",
        "CNY": "Yuan chinois",
        "KRW": "Won sud-coréen",
        "IDR": "Roupie indonésienne",
        "INR": "Roupie indienne",
        "JPY": "Yen japonais"
    },
    "txActions": {
        "addressShare": "Partager l’adresse",
        "addressContact": "Ajouter l’adresse aux contacts",
        "addressContactEdit": "Modifier le contact de l’adresse",
        "addressMarkSpam": "Marquer l’adresse comme spam",
        "txShare": "Partager la transaction",
        "txRepeat": "Répéter la transaction",
        "view": "Afficher dans l’explorateur",
        "share": {
            "address": "Adresse TON",
            "transaction": "Transaction TON"
        }
    },
    "hardwareWallet": {
        "ledger": "Ledger",
        "title": "Connecter Ledger",
        "description": "Votre portefeuille matériel Ledger",
        "installationIOS": "Déverrouillez Ledger, connectez-le à votre smartphone via Bluetooth et autorisez Tonhub à y accéder.",
        "installationAndroid": "Déverrouillez Ledger, connectez-le à votre smartphone via Bluetooth ou un câble USB et autorisez Tonhub à y accéder.",
        "installationGuide": "Guide de connexion TON Ledger",
        "connectionDescriptionAndroid": "Connectez votre Ledger via USB ou Bluetooth",
        "connectionDescriptionIOS": "Connectez votre Ledger via Bluetooth",
        "connectionHIDDescription_1": "1. Allumez votre Ledger et déverrouillez-le",
        "connectionHIDDescription_2": "2. Appuyez sur \"Continuer\"",
        "openTheAppDescription": "Ouvrez l’application TON sur votre Ledger",
        "unlockLedgerDescription": "Déverrouillez votre Ledger",
        "chooseAccountDescription": "Sélectionnez le compte que vous souhaitez utiliser",
        "bluetoothScanDescription_1": "1. Allumez votre Ledger et déverrouillez-le",
        "bluetoothScanDescription_2": "2. Assurez-vous que le Bluetooth est activé",
        "bluetoothScanDescription_3": "3. Appuyez sur \"Scanner\" pour rechercher les appareils disponibles et sélectionnez le Ledger Nano X approprié",
        "bluetoothScanDescription_3_and": "3. Appuyez sur \"Scanner\" pour rechercher les appareils disponibles (nous aurons besoin de l’accès aux données de localisation et de l’autorisation pour détecter les appareils à proximité)",
        "bluetoothScanDescription_4_and": "4. Ensuite, sélectionnez le Ledger Nano X approprié",
        "openAppVerifyAddress": "Vérifiez l’adresse du compte sélectionné puis validez-la avec l’application Ledger Ton lorsqu’on vous le demande",
        "devices": "Vos appareils",
        "connection": "Connexion",
        "actions": {
            "connect": "Connecter Ledger",
            "selectAccount": "Sélectionner un compte",
            "account": "Compte #{{account}}",
            "loadAddress": "Vérifier l’adresse",
            "connectHid": "Connecter Ledger via USB",
            "connectBluetooth": "Connecter Ledger via Bluetooth",
            "scanBluetooth": "Scanner de nouveau",
            "confirmOnLedger": "Valider sur Ledger",
            "sending": "Transaction en cours",
            "sent": "Transaction envoyée",
            "mainAddress": "Adresse principale",
            "givePermissions": "Donner les autorisations"
        },
        "confirm": {
            "add": "Êtes-vous sûr de vouloir ajouter cette application ?",
            "remove": "Êtes-vous sûr de vouloir supprimer cette application ?"
        },
        "errors": {
            "bleTitle": "Erreur Bluetooth",
            "noDevice": "Aucun appareil trouvé",
            "appNotOpen": "L’application Ton n’est pas ouverte sur Ledger",
            "turnOnBluetooth": "Veuillez activer le Bluetooth et réessayer",
            "lostConnection": "Connexion perdue avec Ledger",
            "transactionNotFound": "Transaction introuvable",
            "transactionRejected": "Transaction refusée",
            "transferFailed": "Échec du transfert",
            "permissions": "Veuillez autoriser l’accès au Bluetooth et à la localisation",
            "unknown": "Erreur inconnue",
            "reboot": "Veuillez redémarrer votre appareil et réessayer",
            "turnOnLocation": "Veuillez activer les services de localisation et réessayer, c’est nécessaire pour détecter les appareils à proximité",
            "locationServicesUnauthorized": "Services de localisation non autorisés",
            "bluetoothScanFailed": "Échec de la recherche Bluetooth"
        },
        "moreAbout": "En savoir plus sur Ledger"
    },
    "devTools": {
        "switchNetwork": "Réseau",
        "switchNetworkAlertTitle": "Passage au réseau {{network}}",
        "switchNetworkAlertMessage": "Êtes-vous sûr de vouloir changer de réseau ?",
        "switchNetworkAlertAction": "Changer",
        "copySeed": "Copier la phrase secrète de 24 mots",
        "copySeedAlertTitle": "Copie de la phrase secrète de 24 mots dans le presse-papiers",
        "copySeedAlertMessage": "ATTENTION ! Copier la phrase secrète de 24 mots dans le presse-papiers n’est pas sécurisé. Continuez à vos risques et périls.",
        "copySeedAlertAction": "Copier",
        "holdersOfflineApp": "Holders Offline App"
    },
    "wallets": {
        "choose_versions": "Choisissez les portefeuilles à ajouter",
        "switchToAlertTitle": "Passer à {{wallet}}",
        "switchToAlertMessage": "Êtes-vous sûr de vouloir passer à ce portefeuille ?",
        "switchToAlertAction": "Basculer",
        "addNewTitle": "Ajouter un portefeuille",
        "addNewAlertTitle": "Ajout d’un nouveau portefeuille",
        "addNewAlertMessage": "Êtes-vous sûr de vouloir ajouter ce nouveau portefeuille ?",
        "addNewAlertAction": "Ajouter",
        "alreadyExistsAlertTitle": "Le portefeuille existe déjà",
        "alreadyExistsAlertMessage": "Un portefeuille avec cette adresse existe déjà",
        "settings": {
            "changeAvatar": "Changer l’avatar",
            "selectAvatarTitle": "Image",
            "selectColorTitle": "Couleur d’arrière-plan"
        }
    },
    "webView": {
        "checkInternetAndReload": "Veuillez vérifier votre connexion internet et recharger la page",
        "contactSupportOrTryToReload": "Contactez l’assistance ou réessayez de recharger la page",
        "contactSupport": "Contactez l’assistance"
    },
    "appAuth": {
        "description": "Pour continuer à vous connecter à l’application"
    },
    "screenCapture": {
        "title": "Super capture d’écran, mais ce n’est pas sûr",
        "description": "Les copies numériques non chiffrées de votre phrase secrète NE sont PAS recommandées. Cela inclut les copies sauvegardées sur un ordinateur, en ligne ou sous forme de captures d’écran",
        "action": "OK, j’en assume le risque"
    },
    "onboarding": {
        "avatar": "C’est ici que vous pouvez changer l’avatar et le nom de vos portefeuilles",
        "wallet": "C’est ici que vous pouvez ajouter ou basculer entre vos portefeuilles",
        "price": "C’est ici que vous pouvez changer votre devise principale"
    },
    "newAddressFormat": {
        "title": "Format d’adresse",
        "fragmentTitle": "Nouveau type d’adresses",
        "learnMore": "En savoir plus sur les nouvelles adresses",
        "shortDescription": "La mise à jour va rendre la blockchain TON plus sûre et stable. Tout ce qui est envoyé à votre ancienne adresse arrivera toujours sur votre portefeuille.",
        "description_0_0": "Récemment, TON ",
        "description_0_link": "a annoncé cette mise à jour",
        "description_0_1": " pour les adresses et a demandé à tous les portefeuilles de la prendre en charge.",
        "title_1": "Pourquoi ?",
        "description_1": "La mise à jour permet de distinguer plus facilement les adresses de portefeuilles et de contrats, évitant ainsi les erreurs lors de l’envoi de transactions.",
        "title_2": "Que devez-vous faire ?",
        "description_2": "Appuyez sur le bouton de l’écran précédent et autorisez-nous à afficher toutes les adresses dans le nouveau format. Vous pourrez revenir à l’ancien format dans vos réglages.",
        "title_3": "Qu’advient-il de l’ancienne adresse ?",
        "description_3": "Tous les TON, tokens, NFT et autres actifs envoyés à votre ancienne adresse arriveront toujours sur votre portefeuille.",
        "description_4": "Les détails techniques de la mise à jour sont disponibles ici :",
        "action": "Utiliser {{format}}",
        "oldAddress": "Ancienne adresse",
        "newAddress": "Nouvelle adresse",
        "bannerTitle": "Mettez à jour votre adresse",
        "bannerDescription": "De EQ à UQ"
    },
    "changelly": {
        "bannerTitle": "Dépôts USDT et USDC",
        "bannerDescription": "Tron, Solana, Ethereum, Polygon disponibles!"
    },
    "w5": {
        "banner": {
            "title": "Ajouter le portefeuille W5",
            "description": "Transférez des USDT sans frais de gaz"
        },
        "update": {
            "title": "Mettre à jour le portefeuille vers W5",
            "subtitle_1": "Transferts USDT sans gaz",
            "description_1": "Vous n’avez plus besoin de TON pour envoyer des USDT. Les frais sont déduits de votre solde en tokens.",
            "subtitle_2": "Économisez sur les frais",
            "description_2": "W5 permet d’augmenter considérablement le nombre d’opérations dans une seule transaction et de faire des économies sur les frais.",
            "subtitle_3": "Votre phrase secrète reste inchangée",
            "description_3": "Les portefeuilles V4 et W5 partagent la même phrase secrète. Vous pouvez toujours basculer entre les versions en sélectionnant l’adresse souhaitée en haut de l’écran principal.",
            "switch_button": "Passer à W5"
        },
        "gaslessInfo": "TON n’est pas nécessaire pour les frais de gaz en envoyant ce token : ils sont déduits directement de votre solde en tokens."
    },
    "browser": {
        "listings": {
            "categories": {
                "other": "Autre",
                "exchange": "Échanges",
                "defi": "DeFi",
                "nft": "NFT",
                "games": "Jeux",
                "social": "Réseaux sociaux",
                "utils": "Outils",
                "services": "Services"
            },
            "title": "Pour vous"
        },
        "refresh": "Recharger",
        "back": "Retour",
        "forward": "Suivant",
        "share": "Partager",
        "search": {
            "placeholder": "Rechercher",
            "invalidUrl": "URL invalide",
            "urlNotReachable": "URL inaccessible",
            "suggestions": {
                "web": "Rechercher avec {{engine}}",
                "ddg": "DuckDuckGo",
                "google": "Google"
            }
        },
        "alertModal": {
            "message": "Vous êtes sur le point d’ouvrir une application web tierce. Nous ne sommes pas responsables du contenu ou de la sécurité de ces applications.",
            "action": "Ouvrir"
        }
    },
    "swap": {
        "title": "DeDust.io — AMM DEX sur The Open Network",
        "description": "Vous êtes sur le point d’utiliser un service Dedust.io opéré par un tiers indépendant, non affilié à Tonhub.\nVous devez accepter les Conditions d’utilisation et la Politique de confidentialité pour continuer.",
        "termsAndPrivacy": "J’ai lu et j’accepte ",
        "dontShowTitle": "Ne plus afficher pour DeDust.io"
    },
    "mandatoryAuth": {
        "title": "Vérifiez votre sauvegarde",
        "description": "Activez la vérification à l’ouverture du portefeuille. Cela vous aidera à protéger vos informations de carte bancaire.",
        "alert": "Notez les 24 mots secrets dans la section Sécurité des paramètres de votre portefeuille. Cela vous aidera à récupérer l’accès si vous perdez votre téléphone ou oubliez votre code PIN.",
        "confirmDescription": "J’ai noté mes 24 mots secrets et les ai enregistrés en lieu sûr",
        "action": "Activer",
        "settingsDescription": "Une authentification est requise car l’application affiche des produits bancaires. Les données sensibles seront masquées jusqu’à l’activation de l’authentification."
    },
    "update": {
        "callToAction": "Mettez à jour Tonhub"
    },
    "savings": {
        "ton": "Compte d'épargne TON",
        "usdt": "Compte d'épargne USDT"
    },
    "spending": {
        "ton": "Compte de dépenses TON",
        "usdt": "Compte de dépenses USDT"
    }
};

export default schema;
