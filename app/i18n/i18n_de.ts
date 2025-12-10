import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, "" | "_plural"> = {
    "lang": "de",
    "common": {
        "and": "und",
        "accept": "Akzeptieren",
        "start": "Starten",
        "continue": "Fortsetzen",
        "continueAnyway": "Trotzdem fortsetzen",
        "back": "Zurück",
        "logout": "Abmelden",
        "logoutFrom": "Von {{name}} abmelden",
        "cancel": "Abbrechen",
        "balance": "Guthaben",
        "totalBalance": "Gesamtguthaben",
        "walletAddress": "Walletadresse",
        "recipientAddress": "Empfängeradresse",
        "recipient": "Empfänger",
        "copy": "Kopieren",
        "copiedAlert": "In die Zwischenablage kopiert",
        "copied": "Kopiert",
        "share": "Teilen",
        "send": "Senden",
        "yes": "Ja",
        "no": "Nein",
        "amount": "Betrag",
        "today": "Heute",
        "yesterday": "Gestern",
        "comment": "Kommentar",
        "products": "Produkte",
        "confirm": "Bestätigen",
        "soon": "bald",
        "in": "in",
        "max": "Max",
        "close": "Schließen",
        "delete": "Löschen",
        "apply": "Anwenden",
        "domainOrAddress": "Walletadresse oder Domain",
        "domainOrAddressOrContact": "Adresse, Domain oder Kontakt",
        "domain": "Domain",
        "search": "Suchen",
        "termsOfService": "Nutzungsbedingungen",
        "privacyPolicy": "Datenschutzrichtlinie",
        "apy": "APY",
        "tx": "Transaktion",
        "add": "Hinzufügen",
        "connect": "Verbinden",
        "gotIt": "Verstanden",
        "error": "Fehler",
        "wallet": "Wallet",
        "wallets": "Wallets",
        "cards": "Karten",
        "later": "Später",
        "select": "Auswählen",
        "show": "Anzeigen",
        "hide": "Verbergen",
        "showAll": "Alle anzeigen",
        "hideAll": "Alle verbergen",
        "done": "Fertig",
        "mainWallet": "Hauptwallet",
        "walletName": "Walletname",
        "from": "Von",
        "to": "An",
        "transaction": "Transaktion",
        "somethingWentWrong": "Etwas ist schiefgelaufen",
        "checkInternetConnection": "Überprüfen Sie Ihre Internetverbindung",
        "reload": "Neu laden",
        "errorOccurred": "Fehler aufgetreten: {{error}}",
        "recent": "Kürzlich",
        "ok": "OK",
        "attention": "Achtung",
        "save": "Speichern",
        "assets": "Vermögenswerte",
        "message": "Nachricht",
        "messages": "Nachrichten",
        "airdrop": "Airdrop",
        "myWallets": "Meine Wallets",
        "showMore": "Mehr anzeigen",
        "balances": "Guthaben",
        "loading": "Laden...",
        "notFound": "Nicht gefunden",
        "unverified": "Unbestätigt",
        "addressBook": "Adressbuch",
        "gasless": "Gasfrei",
        "address": "Adresse",
        "poolAddress": "Pool-Adresse",
        "currencyChanged": "Währung geändert",
        "required": "erforderlich",
        "operation": "Vorgang",
        "description": "Beschreibung",
        "openSettings": "Einstellungen öffnen",
        "exchanges": "Börsen",
        "directDepositAddress": "Direkte Einzahlungsadresse",
        "goBackTo": "Zurück zu {{name}}",
        "viewIn": "In {{name}} anzeigen"
    },
    "syncStatus": {
        "connecting": "Verbinden",
        "updating": "Aktualisieren",
        "online": "Verbunden"
    },
    "home": {
        "home": "Startseite",
        "history": "Verlauf",
        "browser": "Browser",
        "settings": "Einstellungen"
    },
    "settings": {
        "title": "Mehr",
        "backupKeys": "Schlüssel sichern",
        "holdersAccounts": "Ausgabenkonten",
        "migrateOldWallets": "Alte Wallets migrieren",
        "termsOfService": "Nutzungsbedingungen",
        "privacyPolicy": "Datenschutzrichtlinie",
        "developerTools": "Entwicklerwerkzeuge",
        "spamFilter": "Spamfilter",
        "primaryCurrency": "Primärwährung",
        "experimental": "Experimentell",
        "support": {
            "title": "Support",
            "telegram": "Telegram",
            "form": "Supportformular",
            "holders": "Bankkarten & Konten",
            "tonhub": "Tonhub"
        },
        "telegram": "Abonnieren Sie unser Telegram",
        "rateApp": "App bewerten",
        "deleteAccount": "Konto löschen",
        "theme": "Thema",
        "searchEngine": "Suchmaschine",
        "deleteWallet": "Wallet löschen",
        "deleteWalletWithName": "Wallet \"{{name}}\" löschen",
        "disconnectWallet": "Wallet trennen",
        "disconnectWalletWithName": "Wallet \"{{name}}\" trennen",
        "language": "Sprache"
    },
    "walletImportSelector": {
        "description": "Geben Sie Ihre Wiederherstellungsphrase ein oder verbinden Sie Ledger sicher",
        "title": "Wallet importieren",
        "seed": "Wiederherstellungswörter eingeben"
    },
    "ledgerOnboarding": {
        "title": "Sicherheitseinrichtung",
        "description": "Bevor Sie den Ledger verbinden, erstellen wir eine zusätzliche Wallet, um die Sicherheitseinrichtung abzuschließen",
        "button": "Wallet erstellen"
    },
    "theme": {
        "title": "Thema",
        "light": "Hell",
        "dark": "Dunkel",
        "system": "System"
    },
    "wallet": {
        "sync": "Wallet-Daten herunterladen",
        "balanceTitle": "Ton-Guthaben",
        "owner": "Eigentümer",
        "mainAccount": "Hauptkonto",
        "actions": {
            "receive": "Empfangen",
            "send": "Senden",
            "buy": "Kaufen",
            "swap": "Tauschen",
            "deposit": "Einzahlen",
            "payments": "Zahlungen",
            "scan": "Scannen",
        },
        "empty": {
            "message": "Sie haben keine Transaktionen",
            "receive": "TON empfangen",
            "description": "Machen Sie Ihre erste Transaktion"
        },
        "pendingTransactions": "Ausstehende Transaktionen"
    },
    "transactions": {
        "title": "Transaktionen",
        "history": "Verlauf",
        "filter": {
            "holders": "Karten",
            "ton": "Wallet-Transaktionen",
            "any": "Alle",
            "type": "Typ",
            "accounts": "Ausgaben"
        }
    },
    "tx": {
        "sending": "Senden",
        "sent": "Gesendet",
        "received": "Empfangen",
        "bounced": "Abgelehnt",
        "tokenTransfer": "Token-Übertragung",
        "airdrop": "Airdrop",
        "tokenMint": "Token-Minting",
        "failed": "Fehlgeschlagen",
        "timeout": "Zeitüberschreitung",
        "batch": "Stapel"
    },
    "txPreview": {
        "sendAgain": "Erneut senden",
        "blockchainFee": "Netzwerkgebühr",
        "blockchainFeeDescription": "Diese Gebühr, auch GAS genannt, ist notwendig, damit eine Transaktion in der Blockchain verarbeitet wird. Die Höhe des GAS hängt von der Arbeitsmenge der Validatoren ab."
    },
    "receive": {
        "title": "Empfangen",
        "subtitleTon": "Senden Sie nur Toncoin und Token im TON-Netzwerk an diese Adresse, sonst könnten Sie Ihre Gelder verlieren.",
        "subtitleSolana": "Senden Sie nur SOL und SPL-Token im Solana-Netzwerk an diese Adresse, sonst könnten Sie Ihre Gelder verlieren.",
        "share": {
            "title": "Meine Tonhub-Adresse",
            "button": "Details teilen",
            "error": "Fehler beim Teilen der Adresse, bitte versuchen Sie es erneut oder kontaktieren Sie den Support"
        },
        "holdersJettonWarning": "Überweisen Sie nur {{symbol}} an diese Adresse, sonst verlieren Sie andere Token.",
        "assets": "Tokens und Konten",
        "fromExchange": "Einzahlung von einer Börse",
        "fromAnotherWallet": "Einzahlung von einer anderen Wallet",
        "otherCoins": "Andere Token",
        "deposit": "Einzahlen auf"
    },
    "transfer": {
        "title": "Senden",
        "titleAction": "Aktion",
        "confirm": "Sind Sie sicher, dass Sie fortfahren möchten?",
        "error": {
            "invalidAddress": "Ungültige Adresse",
            "invalidAddressMessage": "Bitte überprüfen Sie die Empfängeradresse",
            "invalidAmount": "Ungültiger Betrag",
            "invalidDomain": "Ungültige Domain",
            "invalidDomainString": "Mindestens 4, maximal 126 Zeichen. Erlaubt sind: a-z, 0-9 und ein Bindestrich (-), der nicht am Anfang oder Ende stehen darf.",
            "sendingToYourself": "Sie können keine Münzen an sich selbst senden",
            "zeroCoins": "Leider können Sie keine null Münzen senden",
            "zeroCoinsAlert": "Sie versuchen, null Münzen zu senden",
            "notEnoughCoins": "Sie haben nicht genug Guthaben auf Ihrem Konto",
            "addressIsForTestnet": "Diese Adresse ist für das Testnetz",
            "addressCantReceive": "Diese Adresse kann keine Münzen empfangen",
            "addressIsNotActive": "Dieses Wallet hat keine Historie",
            "addressIsNotActiveDescription": "Das bedeutet, dass von dieser Walletadresse keine Transaktionen durchgeführt wurden",
            "invalidTransaction": "Ungültige Transaktion",
            "invalidTransactionMessage": "Bitte überprüfen Sie die Transaktionsdetails",
            "memoRequired": "Fügen Sie ein Memo/Tag hinzu, um den Verlust von Geldern zu vermeiden",
            "holdersMemoRequired": "Tag/MEMO",
            "memoChange": "Ändern Sie das Memo/Tag in \"{{memo}}\"",
            "gaslessFailed": "Fehler beim Senden der Transaktion",
            "gaslessFailedMessage": "Bitte versuchen Sie es erneut oder kontaktieren Sie den Support",
            "gaslessFailedEstimate": "Fehler bei der Schätzung der Gebühren, bitte versuchen Sie es später erneut oder kontaktieren Sie den Support",
            "gaslessCooldown": "Sie können die Gasgebühr in der Token-Währung nur alle paar Minuten bezahlen. Bitte warten Sie oder zahlen Sie die Transaktionsgebühr in TON.",
            "gaslessCooldownTitle": "Warten Sie ein paar Minuten vor der nächsten Transaktion",
            "gaslessCooldownWait": "Ich warte",
            "gaslessCooldownPayTon": "Gas in TON bezahlen",
            "gaslessNotEnoughFunds": "Nicht genug Guthaben",
            "gaslessNotEnoughFundsMessage": "Der gaslose Überweisungsbetrag mit Gebühr ist höher als Ihr Guthaben, versuchen Sie, einen kleineren Betrag zu senden oder kontaktieren Sie den Support",
            "gaslessTryLater": "Versuchen Sie es später erneut",
            "gaslessTryLaterMessage": "Sie können es später erneut versuchen oder den Support kontaktieren",
            "gaslessNotEnoughCoins": "{{fee}} an Gebühren erforderlich, um zu senden, es fehlen {{missing}}",
            "notEnoughJettons": "Nicht genug {{symbol}}",
            "jettonChange": "Der Empfänger unterstützt nur {{symbol}}-Überweisungen, bitte ändern Sie den Empfänger oder die Überweisungswährung",
            "ledgerErrorConnectionTitle": "Ledger ist nicht verbunden",
            "ledgerErrorConnectionMessage": "Bitte verbinden Sie Ledger und versuchen Sie es erneut",
            "notEnoughGasTitle": "Nicht genug TON, um die Gasgebühr zu decken",
            "notEnoughGasMessage": "Bitte füllen Sie Ihr Wallet mit TON auf (mindestens {{diff}} TON mehr erforderlich) und versuchen Sie es erneut"
        },
        "changeJetton": "Wechseln zu {{symbol}}",
        "sendAll": "Max",
        "scanQR": "QR-Code scannen",
        "sendTo": "Senden an",
        "fee": "Netzwerkgebühr: {{fee}}",
        "feeEmpty": "Gebühren werden später berechnet",
        "feeTitle": "Netzwerkgebühren",
        "feeTotalTitle": "Gesamte Netzwerkgebühren",
        "purpose": "Zweck der Transaktion",
        "comment": "Nachricht (optional)",
        "commentDescription": "Die Nachricht wird für alle auf der Blockchain sichtbar sein",
        "commentRequired": "Überprüfen Sie Ihr Memo/Tag vor dem Senden",
        "commentLabel": "Nachricht",
        "checkComment": "Vor dem Senden überprüfen",
        "confirmTitle": "Transaktion bestätigen",
        "confirmManyTitle": "{{count}} Transaktionen bestätigen",
        "unknown": "Unbekannte Operation",
        "moreDetails": "Mehr Details",
        "gasFee": "Gasgebühr",
        "contact": "Ihr Kontakt",
        "firstTime": "Zum ersten Mal senden",
        "requestsToSign": "{{app}} fordert zur Signatur auf",
        "smartContract": "Smart-Contract-Operation",
        "txsSummary": "Gesamt",
        "txsTotal": "Gesamtbetrag",
        "gasDetails": "Gasdetails",
        "jettonGas": "Gas für das Senden von Token",
        "unusualJettonsGas": "Gas ist höher als üblich",
        "unusualJettonsGasTitle": "Die Gebühr für das Senden von Tokens beträgt {{amount}} TON",
        "unusualJettonsGasMessage": "Die Gebühr für Token-Transaktionen (Gas) ist höher als üblich",
        "addressNotActive": "Dieses Wallet hatte keine ausgehenden Transaktionen",
        "wrongJettonTitle": "Falscher Token",
        "wrongJettonMessage": "Sie versuchen, einen Token zu senden, den Sie nicht haben",
        "notEnoughJettonsTitle": "Nicht genug Tokens",
        "notEnoughJettonsMessage": "Sie versuchen, mehr Tokens zu senden, als Sie haben",
        "aboutFees": "Über Gebühren",
        "aboutFeesDescription": "Die Gebühren für Transaktionen auf der Blockchain hängen von mehreren Faktoren ab, wie z.B. Netzwerkauslastung, Transaktionsgröße, Gaspreis und Blockchain-Konfigurationsparametern. Je höher die Nachfrage nach Transaktionsverarbeitung auf der Blockchain oder je größer die Transaktionsgröße (Nachricht/Kommentar), desto höher sind die Gebühren.",
        "gaslessTransferSwitch": "Gasgebühr in {{symbol}} bezahlen",
        "solana": {
            "error": {
                "title": "Solana-Transaktionsfehler",
                "networkRequestFailed": "Netzwerkfehler, bitte versuchen Sie es später erneut oder kontaktieren Sie den Support",
                "connectionTimeout": "Verbindungstimeout, bitte versuchen Sie es später erneut oder kontaktieren Sie den Support",
                "connectionRefused": "Verbindung abgelehnt, bitte versuchen Sie es später erneut oder kontaktieren Sie den Support",
                "connectionReset": "Verbindung zurückgesetzt, bitte versuchen Sie es später erneut oder kontaktieren Sie den Support",
                "insufficientLamports": "Unzureichende SOL-Mittel",
                "insufficientLamportsWithAmount": "Unzureichende SOL-Mittel, benötigen {{amount}} mehr",
                "insufficientTokenFunds": "Unzureichende Token-Mittel",
                "rateLimited": "Wir verzeichnen eine hohe Nachfrage, bitte versuchen Sie es später erneut oder kontaktieren Sie den Support",
                "signingFailed": "Transaktionssignatur fehlgeschlagen",
                "insufficientFundsForRentTitle": "Transaktionsbetrag ist unter dem Mindestbetrag",
                "insufficientFundsForRent": "Unzureichende SOL für das Senden an: {{address}}, benötigen {{amount}} mehr"
            }
        }
    },
    "auth": {
        "phoneVerify": "Telefon verifizieren",
        "phoneNumber": "Telefonnummer",
        "phoneTitle": "Ihre Nummer",
        "phoneSubtitle": "Wir senden einen Bestätigungscode, um Ihre Nummer zu verifizieren.",
        "codeTitle": "Code eingeben",
        "codeSubtitle": "Wir haben einen Bestätigungscode an gesendet ",
        "codeHint": "Code",
        "title": "Anmelden bei {{name}}",
        "message": "fordert die Verbindung zu Ihrem Wallet-Konto {{wallet}} an",
        "hint": "Es werden keine Gelder an die App übertragen und kein Zugriff auf Ihre Münzen gewährt.",
        "action": "Erlauben",
        "expired": "Diese Authentifizierungsanfrage ist bereits abgelaufen",
        "failed": "Authentifizierung fehlgeschlagen",
        "completed": "Diese Authentifizierungsanfrage wurde bereits abgeschlossen",
        "authorized": "Autorisierungsanfrage genehmigt",
        "authorizedDescription": "Sie können jetzt zur App zurückkehren.",
        "noExtensions": "Noch keine Erweiterungen",
        "noApps": "Noch keine verbundenen Apps",
        "name": "Verbundene Apps",
        "yourWallet": "Ihr Wallet",
        "revoke": {
            "title": "Möchten Sie diese App wirklich widerrufen?",
            "message": "Dies wird die Verbindung zwischen Ihrem Wallet und der App zerstören, aber Sie können jederzeit versuchen, sich erneut zu verbinden.",
            "action": "Widerrufen"
        },
        "apps": {
            "title": "Vertrauenswürdige Apps",
            "delete": {
                "title": "Diese Erweiterung löschen?",
                "message": "Dies wird die Verbindung zwischen Ihrem Wallet und der Erweiterung zerstören, aber Sie können jederzeit versuchen, sich erneut zu verbinden."
            },
            "description": "Hier werden Anwendungen oder Erweiterungen angezeigt, die Sie autorisiert haben. Sie können den Zugriff jederzeit von jeder App oder Erweiterung widerrufen.",
            "installExtension": "Erweiterung für diese Anwendung installieren und öffnen",
            "moreWallets": "Weitere Wallets ({{count}})",
            "connectionSecureDescription": "Es werden keine Gelder an die App übertragen und kein Zugriff auf Ihre Münzen gewährt",
            "invalidManifest": "App manifest Fehler",
            "invalidManifestDescription": "Diese App konnte nicht mit Ihrem Wallet verbunden werden. Bitte kontaktieren Sie den Support der App.",
            "authorized": "{{name}} wurde erfolgreich mit Ihrer Wallet verbunden"
        },
        "consent": "Durch Klicken auf Weiter akzeptieren Sie unsere"
    },
    "install": {
        "title": "Verbindungsanfrage",
        "message": "<strong>{{name}}</strong> möchte sich mit Ihrem Konto verbinden",
        "action": "Installieren"
    },
    "sign": {
        "title": "Signaturanfrage",
        "message": "Angefordert, eine Nachricht zu signieren",
        "hint": "Es werden keine Gelder an die App übertragen und kein Zugriff auf Ihre Münzen gewährt.",
        "action": "Signieren",
        "binary": "Binäre Nachricht",
        "binaryData": "Binärdaten",
        "cellSchema": "Zellschema",
        "cellData": "Zelldaten"
    },
    "migrate": {
        "title": "Alte Wallets migrieren",
        "subtitle": "Wenn Sie veraltete Wallets verwendet haben, können Sie automatisch alle Gelder von Ihren alten Adressen verschieben.",
        "inProgress": "Alte Wallets migrieren...",
        "transfer": "Münzen von {{address}} übertragen",
        "check": "Adresse {{address}} überprüfen",
        "keyStoreTitle": "Übergang zu einer neuen Sicherheitsmethode",
        "keyStoreSubtitle": "Wir möchten, dass Ihre Schlüssel immer sicher sind, daher haben wir die Art und Weise, wie wir sie schützen, aktualisiert. Wir benötigen Ihre Erlaubnis, um Ihre Schlüssel in einen neuen sicheren Speicher zu übertragen.",
        "failed": "Migration fehlgeschlagen"
    },
    "qr": {
        "title": "Kamera auf QR-Code richten",
        "requestingPermission": "Kameraberechtigungen anfordern...",
        "noPermission": "Erlauben Sie den Kamerazugriff, um QR-Codes zu scannen",
        "requestPermission": "Einstellungen öffnen",
        "failedToReadFromImage": "Fehler beim Lesen des QR-Codes aus dem Bild",
        "galleryPermissionTitle": "Berechtigung Erforderlich",
        "galleryPermissionMessage": "Um QR-Codes aus Ihren Fotos zu scannen, benötigt die App Zugriff auf Ihre Galerie"
    },
    "products": {
        "addNew": "Ein Produkt hinzufügen",
        "tonConnect": {
            "errors": {
                "connection": "Verbindungsfehler",
                "invalidKey": "Ungültiger dApp-Schlüssel",
                "invalidSession": "Ungültige Sitzung",
                "invalidTestnetFlag": "Ungültiges Netzwerk",
                "alreadyCompleted": "Anfrage bereits abgeschlossen",
                "unknown": "Unbekannter Fehler, bitte versuchen Sie es erneut oder kontaktieren Sie den Support"
            },
            "successAuth": "Verbunden"
        },
        "savings": "Ersparnisse",
        "accounts": "Tokens",
        "services": "Erweiterungen",
        "oldWallets": {
            "title": "Alte Wallets",
            "subtitle": "Zum Migrieren alter Wallets drücken"
        },
        "transactionRequest": {
            "title": "Transaktion angefordert",
            "subtitle": "Zum Anzeigen der Anfrage drücken",
            "groupTitle": "Transaktionsanfragen",
            "wrongNetwork": "Falsches Netzwerk",
            "wrongFrom": "Falscher Absender",
            "invalidFrom": "Ungültige Absenderadresse",
            "noConnection": "App ist nicht verbunden",
            "expired": "Anfrage abgelaufen",
            "invalidRequest": "Ungültige Anfrage",
            "failedToReport": "Transaktion gesendet, aber Rückmeldung an die App fehlgeschlagen",
            "failedToReportCanceled": "Transaktion abgebrochen, aber Rückmeldung an die App fehlgeschlagen"
        },
        "signatureRequest": {
            "title": "Signatur angefordert",
            "subtitle": "Zum Anzeigen der Anfrage drücken"
        },
        "staking": {
            "earnings": "Einnahmen",
            "title": "TON Staking",
            "usdeTitle": "USDe Staking",
            "balance": "Staking-Guthaben",
            "subtitle": {
                "join": "Verdiene bis zu {{apy}}% mit {{tokenName}}",
                "joined": "Verdiene bis zu {{apy}}%",
                "rewards": "Geschätzte Verzinsung",
                "apy": "~13,3 % APY auf den Einsatz",
                "devPromo": "Vervielfache deine Testmünzen"
            },
            "pools": {
                "title": "Staking-Pools",
                "active": "Aktiv",
                "best": "Beste",
                "alternatives": "Alternativen",
                "private": "Private Pools",
                "restrictedTitle": "Pool ist eingeschränkt",
                "restrictedMessage": "Dieser Staking-Pool ist nur für Mitglieder des Whales Club verfügbar",
                "viewClub": "Whales Club ansehen",
                "nominators": "Nominatoren",
                "nominatorsDescription": "Für alle",
                "club": "Club",
                "clubDescription": "Für Mitglieder des Whales Club",
                "team": "Team",
                "teamDescription": "Für Ton Whales Teammitglieder und die TOP 15 des Whales Club",
                "joinClub": "Beitreten",
                "joinTeam": "Beitreten",
                "clubBanner": "Trete unserem Club bei",
                "clubBannerLearnMore": "Mehr über unseren Club erfahren",
                "clubBannerDescription": "Für unsere Whales Club Mitglieder",
                "teamBanner": "Trete unserem Team bei",
                "teamBannerLearnMore": "Mehr über unser Team erfahren",
                "teamBannerDescription": "Für unser Team und die TOP 15 des Whales Club",
                "epnPartners": "ePN-Partner",
                "epnPartnersDescription": "Schließe dich über 200.000 Webmastern an",
                "moreAboutEPN": "Info",
                "lockups": "Lockups-Pool",
                "lockupsDescription": "Ermöglicht Inhabern großer TON-Lockups zusätzliche Einnahmen zu erzielen",
                "tonkeeper": "Tonkeeper",
                "tonkeeperDescription": "Benutzerfreundliche mobile Wallet auf TON",
                "liquid": "Liquid Staking",
                "liquidDescription": "Sende TON zum Staking und erhalte stattdessen wsTON-Token",
                "rateTitle": "Wechselkurs",
                "liquidUsde": "Liquid USDe Staking",
                "liquidUsdeDescription": "Sende USDe zum Staking und erhalte stattdessen tsUSDe-Token",
                "ethenaPoints": "Mehr Belohnungen erhalten",
                "ethenaPointsDescription": "Verifiziere deine Identität, um deine Staking-Belohnungen zu erhöhen",
            },
            "transfer": {
                "stakingWarning": "Du kannst jederzeit neues Stake-Guthaben einzahlen oder bestehendes erhöhen. Bitte beachte, dass der Mindestbetrag {{minAmount}} ist.",
                "depositStakeTitle": "Staking",
                "depositStakeConfirmTitle": "Staking bestätigen",
                "withdrawStakeTitle": "Auszahlungsanfrage",
                "withdrawStakeConfirmTitle": "Auszahlung bestätigen",
                "topUpTitle": "Aufstocken",
                "topUpConfirmTitle": "Aufstockung bestätigen",
                "notEnoughStaked": "Leider haben Sie nicht genügend Münzen gestaked",
                "confirmWithdraw": "Auszahlung anfordern",
                "confirmWithdrawReady": "Jetzt auszahlen",
                "restrictedTitle": "Dieser Staking-Pool ist eingeschränkt",
                "restrictedMessage": "Deine Mittel nehmen nicht am Staking teil, wenn deine Wallet-Adresse nicht auf der Zugriffs-Liste steht. Sie verbleiben auf dem Pool-Guthaben und warten auf eine Auszahlung.",
                "notEnoughCoinsFee": "Es sind nicht genug TON auf deinem Wallet-Guthaben, um die Gebühr zu zahlen. Bitte beachte, dass die {{amount}} TON Gebühr im Hauptguthaben vorhanden sein muss, nicht im Staking-Guthaben.",
                "notEnoughCoins": "Es sind nicht genug Mittel auf deinem Wallet-Guthaben, um das Staking-Guthaben aufzustocken",
                "ledgerSignText": "Staking: {{action}}"
            },
            "nextCycle": "Nächster Zyklus",
            "cycleNote": "Alle Transaktionen werden wirksam, sobald der Zyklus endet",
            "cycleNoteWithdraw": "Deine Anfrage wird nach Ende des Zyklus ausgeführt. Die Auszahlung muss anschließend nochmals bestätigt werden.",
            "buttonTitle": "Staken",
            "balanceTitle": "Staking-Guthaben",
            "actions": {
                "deposit": "Einzahlen",
                "top_up": "Aufstocken",
                "withdraw": "Abheben",
                "calc": "Berechnen",
                "swap": "Sofort tauschen"
            },
            "join": {
                "title": "Werde ein TON-Validator",
                "message": "Staking ist ein öffentliches Gut für das TON-Ökosystem. Du hilfst dabei, das Netzwerk zu sichern und erhältst dafür Belohnungen.",
                "buttonTitle": "Verdienen starten",
                "moreAbout": "Mehr über Ton Whales Staking-Pool",
                "earn": "Verdiene bis zu",
                "onYourTons": "auf deine TONs",
                "apy": "13,3%",
                "yearly": "APY",
                "cycle": "Erhalte alle 36h Belohnungen für Staking",
                "ownership": "Gesetzte TONs bleiben dir erhalten",
                "withdraw": "Abheben und Aufstocken jederzeit möglich",
                "successTitle": "{{amount}} TON gestakt",
                "successEtimation": "Deine geschätzte Jahresrendite beträgt {{amount}}\u00A0TON\u00A0(${{price}}).",
                "successNote": "Deine gestakten TON werden aktiviert, sobald der nächste Zyklus beginnt."
            },
            "pool": {
                "balance": "Gesamtstake",
                "members": "Nominatoren",
                "profitability": "Rentabilität"
            },
            "empty": {
                "message": "Du hast keine Transaktionen"
            },
            "pending": "Ausstehend",
            "withdrawStatus": {
                "pending": "Auszahlung ausstehend",
                "ready": "Auszahlung bereit",
                "withdrawNow": "Zum sofortigen Abheben klicken"
            },
            "depositStatus": {
                "pending": "Einzahlung ausstehend"
            },
            "withdraw": "Abheben",
            "sync": "Staking-Daten werden geladen",
            "unstake": {
                "title": "Bist du sicher, dass du eine Auszahlung anfordern möchtest?",
                "message": "Bitte beachte, dass bei der Auszahlungsanfrage alle ausstehenden Einzahlungen ebenfalls zurückgegeben werden."
            },
            "unstakeLiquid": {
                "title": "Ziehe deine wsTON ab",
                "message": "Du kannst die Mittel direkt nach Ende des Zyklus abheben oder wsTON sofort gegen TON tauschen auf "
            },
            "unstakeLiquidUsde": {
                "title": "Ziehe deine tsUSDe ab",
                "message": "Du kannst die Mittel direkt nach Ende des Zeit-Lock-Zeitraums (7 Tage nach erster Auszahlungsanfrage) abheben oder tsUSDe sofort gegen USDe tauschen auf "
            },
            "learnMore": "Info",
            "moreInfo": "Mehr Info",
            "calc": {
                "yearly": "Jährliche Rendite",
                "monthly": "Monatliche Rendite",
                "daily": "Tägliche Rendite",
                "note": "Berechnung unter Einbeziehung aller Gebühren",
                "text": "Ertragsrechner",
                "yearlyTopUp": "Gewinn nach Aufladung",
                "yearlyTotal": "Gesamtrendite in einem Jahr",
                "yearlyCurrent": "Aktueller Gewinn (in einem Jahr)",
                "topUpTitle": "Deine jährliche Rendite",
                "goToTopUp": "Zur Aufstockung"
            },
            "info": {
                "rate": "bis zu 13,3%",
                "rateTitle": "APY",
                "frequency": "Alle 36 Stunden",
                "frequencyTitle": "Belohnungszyklus",
                "minDeposit": "Mindesteinzahlung",
                "poolFee": "3,3%",
                "poolFeeTitle": "Pool-Gebühr",
                "depositFee": "Einzahlungsgebühr",
                "withdrawFee": "Abhebungsgebühr",
                "withdrawRequestFee": "Gebühr für Auszahlungsanfrage",
                "withdrawCompleteFee": "Gebühr für Auszahlungsabschluss",
                "depositFeeDescription": "TON-Betrag, der vom Einzahlungsbetrag für die Einzahlungsaktion abgezogen wird. Nicht genutzte Mittel werden zurück auf dein Wallet-Guthaben überwiesen",
                "withdrawFeeDescription": "TON-Transferbetrag für die Abhebungsaktion. Nicht genutzte Mittel werden zurück auf dein Wallet-Guthaben überwiesen",
                "withdrawCompleteDescription": "TON-Transferbetrag für die Auszahlungsabschlussaktion. Nicht genutzte Mittel werden zurück auf dein Wallet-Guthaben überwiesen",
                "blockchainFee": "Blockchain-Gebühr",
                "cooldownTitle": "Vereinfachte Phase",
                "cooldownActive": "Aktiv",
                "cooldownInactive": "Inaktiv",
                "cooldownDescription": "Alle Transaktionen werden während dieser Phase sofort wirksam",
                "cooldownAlert": "Zu Beginn jedes Staking-Zyklus ist die Vereinfachte Phase aktiv. In dieser Phase musst du nicht bis zum Ende des Zyklus warten, um abzuheben oder aufzustocken – es erfolgt sofort, und du musst keine zweite Transaktion senden, was die Auszahlungsgebühr halbiert. Du kannst Mittel von einem Pool zu einem anderen verschieben, ohne Zyklusgewinne zu verlieren, sofern die Vereinfachte Phase in beiden Pools aktiv ist.",
                "lockedAlert": "Während des Staking-Zyklus werden Auszahlungen und Einzahlungen aufgeschoben. Alle Transaktionen werden wirksam, sobald der Zyklus beendet ist"
            },
            "minAmountWarning": "Der Mindestbetrag beträgt {{minAmount}} TON",
            "tryAgainLater": "Bitte versuche es später erneut",
            "banner": {
                "estimatedEarnings": "Deine geschätzte Jahresrendite verringert sich um {{amount}}\u00A0TON\u00A0({{price}})",
                "estimatedEarningsDev": "Deine geschätzte Jahresrendite verringert sich",
                "message": "Bist du sicher, dass du das Unstaking durchführen möchtest?"
            },
            "activePools": "Aktive Pools",
            "analytics": {
                "operations": "Transaktionen",
                "operationsDescription": "Aufstocken und Abheben",
                "analyticsTitle": "Analyse",
                "analyticsSubtitle": "Gesamtgewinn",
                "labels": {
                    "week": "1W",
                    "month": "1M",
                    "year": "1J",
                    "allTime": "Gesamt"
                }
            }
        },
        "holders": {
            "title": "Bankkonto",
            "loadingLongerTitle": "Verbindungsprobleme",
            "loadingLonger": "Überprüfe deine Internetverbindung und lade die Seite neu. Wenn das Problem weiterhin besteht, kontaktiere bitte den Support.",
            "accounts": {
                "title": "Ausgaben",
                "prepaidTitle": "Prepaid-Karten",
                "account": "Konto",
                "basicAccount": "Ausgabenkonto",
                "proAccount": "Pro-Konto",
                "noCards": "Keine Karten",
                "prepaidCard": "Tonhub Prepaid *{{lastFourDigits}}",
                "prepaidCardDescription": "Aufladbare Karte für den täglichen Gebrauch",
                "hiddenCards": "Versteckte Karten",
                "hiddenAccounts": "Versteckte Konten",
                "primaryName": "Hauptkonto",
                "paymentName": "Zahlungskonto {{accountIndex}}",
                "vestingName": "Treuhandkonto {{accountIndex}}",
                "vestingPrimaryName": "Treuhandkonto",
                "topUp": "Konto aufladen",
                "addNew": "Konto hinzufügen",
                "network": "{{networkName}}-Netzwerk",
            },
            "pageTitles": {
                "general": "Tonhub-Karten",
                "card": "Tonhub-Karte",
                "cardDetails": "Kartendetails",
                "cardCredentials": "Kartendetails",
                "cardLimits": "{{cardNumber}} Kartenlimits",
                "cardLimitsDefault": "Kartenlimits",
                "cardDeposit": "TON aufladen",
                "transfer": "Überweisen",
                "cardSmartContract": "Karten-Smart-Contract",
                "setUpCard": "Karte einrichten",
                "pin": "PIN ändern"
            },
            "card": {
                "card": "Karte",
                "cards": "Holders-Karten",
                "title": "Tonhub-Karte {{cardNumber}}",
                "defaultSubtitle": "Bezahlen Sie überall mit USDT oder TON per Karte",
                "defaultTitle": "Tonhub-Karte",
                "eurSubtitle": "Tonhub EUR",
                "type": {
                    "physical": "Physische Karte",
                    "virtual": "Virtuell"
                },
                "notifications": {
                    "type": {
                        "card_ready": "Karte aktiviert",
                        "deposit": "Karte aufladen",
                        "charge": "Zahlung",
                        "charge_failed": "Zahlung",
                        "limits_change": {
                            "pending": "Limits werden geändert",
                            "completed": "Limits geändert"
                        },
                        "card_withdraw": "Überweisung auf Wallet",
                        "contract_closed": "Vertrag geschlossen",
                        "card_block": "Karte blockiert",
                        "card_freeze": "Karte eingefroren",
                        "card_unfreeze": "Karte aufgetaut",
                        "card_paid": "Bankkartenausgabe"
                    },
                    "category": {
                        "deposit": "Aufladung",
                        "card_withdraw": "Überweisung",
                        "charge": "Einkäufe",
                        "charge_failed": "Einkäufe",
                        "other": "Sonstiges"
                    },
                    "status": {
                        "charge_failed": {
                            "limit": {
                                "onetime": "Fehlgeschlagen (Limit einmalig überschritten)",
                                "daily": "Fehlgeschlagen (Tageslimit überschritten)",
                                "monthly": "Fehlgeschlagen (Monatslimit überschritten)"
                            },
                            "failed": "Fehlgeschlagen"
                        },
                        "completed": "Abgeschlossen"
                    }
                }
            },
            "confirm": {
                "title": "Bist du sicher, dass du diesen Bildschirm schließen möchtest?",
                "message": "Diese Aktion verwirft alle deine Änderungen"
            },
            "enroll": {
                "poweredBy": "Basierend auf TON, unterstützt von ZenPay",
                "description_1": "Nur du verwaltest den Smart-Contract",
                "description_2": "Niemand außer dir hat Zugriff auf deine Mittel",
                "description_3": "Du bist der wahre Eigentümer deines Geldes",
                "moreInfo": "Mehr über die ZenPay-Karte",
                "buttonSub": "KYC und Kartenausstellung dauern ~5 Minuten",
                "failed": {
                    "title": "Autorisierung fehlgeschlagen",
                    "noAppData": "Keine App-Daten",
                    "noDomainKey": "Kein Domain-Schlüssel",
                    "createDomainKey": "Fehler beim Erstellen des Domain-Schlüssels",
                    "fetchToken": "Fehler beim Token-Abruf",
                    "createSignature": "Fehler bei der Signaturerstellung"
                },
                "ledger": {
                    "confirmTitle": "Mit Ledger fortfahren",
                    "confirmMessage": "Autorisierung unterschreiben & Wallet-Adresse bestätigen"
                }
            },
            "otpBanner": {
                "title": "Neue Zahlungsanfrage",
                "accept": "Akzeptieren",
                "decline": "Ablehnen",
                "expired": "Abgelaufen"
            },
            "banner": {
                "fewMore": "Nur noch ein paar Schritte",
                "ready": "Verifizierung abgeschlossen! Ihre Karte ist bereit!",
                "readyAction": "Jetzt holen",
                "emailAction": "Bestätigen Sie Ihre E-Mail",
                "kycAction": "Verifizieren Sie sich",
                "failedAction": "Verifizierung fehlgeschlagen",
                "dogsTitle": "DOGS jetzt unterstützt",
                "dogsSubtitle": "Einfach mit DOGS aufladen",
            },
            "transaction": {
                "type": {
                    "cardReady": "Karte aktiviert",
                    "accountReady": "Konto aktiviert",
                    "deposit": "Konto aufladen",
                    "prepaidTopUp": "Prepaid aufladen",
                    "payment": "Zahlung",
                    "decline": "Ablehnen",
                    "refund": "Rückerstattung",
                    "limitsChanging": "Limits ändern",
                    "limitsChanged": "Limits geändert",
                    "cardWithdraw": "Überweisung auf Wallet",
                    "contractClosed": "Vertrag geschlossen",
                    "cardBlock": "Karte blockiert",
                    "cardFreeze": "Karte eingefroren",
                    "cardUnfreeze": "Karte aufgetaut",
                    "cardPaid": "Bankkarte ausgestellt",
                    "unknown": "Unbekannt"
                },
                "rejectReason": {
                    "approve": "n/a",
                    "generic": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "fraud_or_ban": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "not_able_to_trace_back_to_original_transaction": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "do_not_honour": "Wir können die Operation für diesen Händler nicht durchführen",
                    "card_not_effective": "Die Transaktion wurde abgelehnt, da Ihre Karte derzeit gesperrt ist. Um fortzufahren, entsperren Sie bitte Ihre Karte über die mobile App oder wenden Sie sich an den Kundensupport",
                    "expired_card": "Ihre Karte ist abgelaufen. Bitte bestellen Sie eine neue über die mobile App",
                    "incorrect_pin": "Es scheint ein Problem mit Ihrer PIN zu geben. Bitte überprüfen Sie die Details und versuchen Sie es erneut. Wenn das Problem weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "cvc2_or_cvv2_incorrect": "Der CVV ist nicht korrekt. Bitte überprüfen Sie den dreistelligen Code auf der Rückseite Ihrer Karte und versuchen Sie es erneut",
                    "incorrect_expiry_date": "Das eingegebene Ablaufdatum ist nicht korrekt. Bitte überprüfen Sie das Ablaufdatum auf Ihrer Karte oder in der mobilen App und versuchen Sie es erneut",
                    "invalid_card_number": "Die eingegebene Kartennummer ist nicht korrekt. Bitte überprüfen Sie die Nummer auf Ihrer Karte oder in der mobilen App und versuchen Sie es erneut",
                    "blocked_merchant_country_code": "Ihre Karte kann für Transaktionen in diesem Land nicht verwendet werden",
                    "insufficient_funds": "Sie haben nicht genügend Guthaben auf Ihrem Konto, um diese Transaktion abzuschließen. Bitte laden Sie Ihr Konto auf und versuchen Sie es erneut",
                    "exceeds_contactless_payments_daily_limit": "Die Transaktion wurde abgelehnt, da sie Ihr tägliches Ausgabenlimit überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es morgen erneut",
                    "exceeds_contactless_payments_monthly_limit": "Die Transaktion wurde abgelehnt, da sie Ihr monatliches Ausgabenlimit überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_contactless_payments_transaction_limit": "Die Transaktion wurde abgelehnt, da sie den maximalen Transaktionsbetrag überschreitet. Bitte wenden Sie sich an den Kundensupport",
                    "exceeds_contactless_payments_weekly_limit": "Die Transaktion wurde abgelehnt, da sie Ihr wöchentliches Ausgabenlimit überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_daily_overall_limit": "Die Transaktion wurde abgelehnt, da sie Ihr tägliches Ausgabenlimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es morgen erneut",
                    "exceeds_internet_purchase_payments_daily_limit": "Die Transaktion wurde abgelehnt, da sie Ihr tägliches Limit für Internet-Transaktionen überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es morgen erneut",
                    "exceeds_internet_purchase_payments_monthly_limit": "Die Transaktion wurde abgelehnt, da sie Ihr monatliches Limit für Internet-Transaktionen überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_internet_purchase_payments_transaction_limit": "Die Transaktion wurde abgelehnt, da sie den maximalen Transaktionsbetrag überschreitet. Bitte wenden Sie sich an den Kundensupport",
                    "exceeds_internet_purchase_payments_weekly_limit": "Die Transaktion wurde abgelehnt, da sie Ihr wöchentliches Limit für Internet-Transaktionen überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_monthly_overall_limit": "Die Transaktion wurde abgelehnt, da sie Ihr monatliches Ausgabenlimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_purchases_daily_limit": "Die Transaktion wurde abgelehnt, da sie Ihr tägliches Ausgabenlimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es morgen erneut",
                    "exceeds_purchases_monthly_limit": "Die Transaktion wurde abgelehnt, da sie Ihr monatliches Ausgabenlimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_purchases_transaction_limit": "Die Transaktion wurde abgelehnt, da sie den maximalen Transaktionsbetrag überschreitet. Bitte wenden Sie sich an den Kundensupport",
                    "exceeds_purchases_weekly_limit": "Die Transaktion wurde abgelehnt, da sie Ihr wöchentliches Ausgabenlimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_settlement_risk_limit": "Die Transaktion wurde abgelehnt, da sie den maximalen Transaktionsbetrag überschreitet. Bitte wenden Sie sich an den Kundensupport",
                    "exceeds_weekly_overall_limit": "Die Transaktion wurde abgelehnt, da sie Ihr wöchentliches Ausgabenlimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_withdrawal_amount_limit": "Die Transaktion wurde abgelehnt, da sie das Abhebungslimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport",
                    "exceeds_withdrawal_maximum_limit": "Die Transaktion wurde abgelehnt, da sie das Abhebungslimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport",
                    "exceeds_withdrawal_minimum_limit": "Der Transaktionsbetrag ist nicht korrekt",
                    "exceeds_withdrawals_daily_limit": "Die Transaktion wurde abgelehnt, da sie das tägliche Abhebungslimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es morgen erneut",
                    "exceeds_withdrawals_monthly_limit": "Die Transaktion wurde abgelehnt, da sie das monatliche Abhebungslimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "exceeds_withdrawals_transaction_limit": "Die Transaktion wurde abgelehnt, da sie das Abhebungslimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es morgen erneut",
                    "exceeds_withdrawals_weekly_limit": "Die Transaktion wurde abgelehnt, da sie das wöchentliche Abhebungslimit auf der Karte überschreitet. Bitte wenden Sie sich an den Kundensupport oder versuchen Sie es später erneut",
                    "transaction_not_permitted_to_card_holder": "Transaktionstyp wird nicht unterstützt. Bitte wenden Sie sich an den Händler",
                    "blocked_merchant_category_code": "Wir können die Operation für diesen Händler nicht durchführen",
                    "blocked_merchant_id": "Wir können die Operation für diesen Händler nicht durchführen",
                    "blocked_merchant_name": "Wir können die Operation für diesen Händler nicht durchführen",
                    "blocked_terminal_id": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "no_card_record": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "suspected_fraud": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "token_not_effective": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "client_system_malfunction": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "system_malfunction": "Es scheint ein Problem zu geben. Bitte versuchen Sie es erneut. Wenn der Fehler weiterhin besteht, wenden Sie sich bitte an den Kundensupport",
                    "contactless_payments_switched_off": "Die Transaktion wurde abgelehnt, da kontaktlose Zahlungen derzeit auf Ihrer Karte deaktiviert sind. Bitte wenden Sie sich an den Kundensupport",
                    "internet_purchase_payments_switched_off": "Die Transaktion wurde abgelehnt, da Internetkäufe derzeit auf Ihrer Karte deaktiviert sind. Bitte wenden Sie sich an den Kundensupport",
                    "withdrawals_switched_off": "Die Transaktion wurde abgelehnt, da Abhebungen derzeit auf Ihrer Karte deaktiviert sind. Bitte wenden Sie sich an den Kundensupport",
                    "purchases_switched_off": "Die Transaktion wurde abgelehnt, da Käufe derzeit auf Ihrer Karte deaktiviert sind. Bitte wenden Sie sich an den Kundensupport",
                    "advice_acknowledged_no_financial_liability_accepted": "Wir können die Operation für diesen Händler nicht durchführen",
                    "merchant_without_3ds": "Wir können die Operation für diesen Händler nicht durchführen"
                },
                "to": {
                    "single": "Zu",
                    "prepaidCard": "Zu Prepaid-Karte",
                    "wallet": "Zu Wallet",
                    "account": "Zu Konto"
                },
                "from": {
                    "single": "Von",
                    "prepaidCard": "Von Prepaid-Karte",
                    "wallet": "Von Wallet",
                    "account": "Von Konto"
                },
                "category": {
                    "transfers": "Abhebungen",
                    "purchase": "Kauf",
                    "cash": "Bargeldabhebungen",
                    "other": "Andere",
                    "deposit": "Aufladungen"
                },
                "status": {
                    "failed": "Fehlgeschlagen",
                    "overOnetimeFailed": "Fehlgeschlagen (über einmaliges Limit)",
                    "overDailyFailed": "Fehlgeschlagen (über tägliches Limit)",
                    "overMonthlyFailed": "Fehlgeschlagen (über monatliches Limit)",
                    "complete": "Abgeschlossen"
                },
                "statsBlock": {
                    "title": "Transaktionen",
                    "description": "Ausgaben im {{month}}",
                    "spent": "Ausgegeben",
                    "in": "im {{month}}"
                },
                "list": {
                    "emptyText": "Noch keine Transaktionen"
                },
                "single": {
                    "report": "Ein Problem melden"
                },
                "pendingPopover": {
                    "title": "Ausstehende Transaktion",
                    "cancelButtonText": "Transaktionsdetails anzeigen",
                    "text": "Die Blockchain-Validierung läuft derzeit. Dies kann einige Minuten dauern"
                }
            },
            "noDirectDeposit": {
                "warningTitle": "Direkte Einzahlung wird nicht unterstützt",
                "alertTitle": "Wir haben den Vertrag aktualisiert",
                "alertDescription": "Bitte erstellen Sie ein neues Konto und übertragen Sie alle Ihre Gelder und Karten darauf. Es ist sicherer und unterstützt direkte Einzahlungen",
                "buttonTitle": "Ein neues Konto erstellen"
            }
        },
    },
    "welcome": {
        "title": "Tonhub",
        "titleDev": "Ton Sandbox Wallet",
        "subtitle": "Einfache und sichere TON-Geldbörse",
        "subtitleDev": "Geldbörse für Entwickler",
        "createWallet": "Neue Geldbörse erstellen",
        "importWallet": "Ich habe bereits eine",
        "slogan": "Dies ist das neue Tonhub",
        "sloganDev": "Dies ist Ton Sandbox",
        "slide_1": {
            "title": "Geschützt",
            "subtitle": "Zuverlässiger Smart Contract, Touch/Face ID mit PIN und alle Transaktionen auf einer dezentralen Blockchain"
        },
        "slide_2": {
            "title": "Mit einer coolen Kryptokarte",
            "subtitle": "Bestelle jetzt eine Karte. Interne Überweisungen und Käufe in wenigen Minuten.\nAll das ist die einzigartige Tonhub-Karte"
        },
        "slide_3": {
            "title": "Schnell",
            "subtitle": "Dank der einzigartigen TON-Architektur erfolgen Transaktionen in Sekundenschnelle"
        }
    },
    "legal": {
        "title": "Rechtliches",
        "subtitle": "Ich habe gelesen und akzeptiere ",
        "create": "Backup erstellen",
        "createSubtitle": "Bewahren Sie Ihren privaten Schlüssel sicher auf und teilen Sie ihn niemandem. Er ist der einzige Weg, um auf Ihre Geldbörse zuzugreifen, falls das Gerät verloren geht.",
        "privacyPolicy": "Datenschutzrichtlinie",
        "termsOfService": "Nutzungsbedingungen"
    },
    "create": {
        "addNew": "Neue Geldbörse hinzufügen",
        "inProgress": "Wird erstellt...",
        "backupTitle": "Ihr Sicherungsschlüssel",
        "backupSubtitle": "Schreiben Sie diese 24 Wörter in genau der gleichen Reihenfolge auf und bewahren Sie sie an einem geheimen Ort auf",
        "okSaved": "OK, ich habe sie gespeichert",
        "copy": "In die Zwischenablage kopieren"
    },
    "import": {
        "title": "Sicherungsschlüssel eingeben",
        "subtitle": "Bitte stellen Sie den Zugriff auf Ihre Geldbörse wieder her, indem Sie die 24 geheimen Wörter eingeben, die Sie beim Erstellen der Geldbörse notiert haben",
        "fullSeedPlaceholder": "Geben Sie 24 geheime Wörter ein",
        "fullSeedPaste": "Oder Sie können die gesamte Seed-Phrase einfügen, wobei jedes Wort durch ein Leerzeichen getrennt ist"
    },
    "secure": {
        "title": "Schützen Sie Ihre Geldbörse",
        "titleUnprotected": "Ihr Gerät ist nicht geschützt",
        "subtitle": "Wir verwenden biometrische Daten, um Transaktionen zu authentifizieren und sicherzustellen, dass niemand außer Ihnen Ihre Coins übertragen kann.",
        "subtitleUnprotected": "Es wird dringend empfohlen, ein Kennwort auf Ihrem Gerät zu aktivieren, um Ihre Assets zu schützen.",
        "subtitleNoBiometrics": "Es wird dringend empfohlen, biometrische Daten auf Ihrem Gerät zu aktivieren, um Ihre Assets zu schützen. Wir verwenden biometrische Daten, um Transaktionen zu authentifizieren und sicherzustellen, dass niemand außer Ihnen Ihre Coins übertragen kann.",
        "messageNoBiometrics": "Es wird dringend empfohlen, biometrische Daten auf Ihrem Gerät zu aktivieren, um Ihre Assets zu schützen.",
        "protectFaceID": "Face ID aktivieren",
        "protectTouchID": "Touch ID aktivieren",
        "protectBiometrics": "Biometrische Daten aktivieren",
        "protectPasscode": "Gerätekennwort aktivieren",
        "upgradeTitle": "Upgrade erforderlich",
        "upgradeMessage": "Bitte erlauben Sie der App den Zugriff auf Wallet-Schlüssel für ein Upgrade. Während dieses Upgrades werden keine Gelder übertragen. Bitte stellen Sie sicher, dass Sie Ihre Schlüssel gesichert haben.",
        "allowUpgrade": "Upgrade zulassen",
        "backup": "Geheime Wörter sichern",
        "onLaterTitle": "Später einrichten",
        "onLaterMessage": "Sie können den Schutz später in den Einstellungen konfigurieren",
        "onLaterButton": "Später einrichten",
        "onBiometricsError": "Fehler bei der Authentifizierung mit biometrischen Daten",
        "lockAppWithAuth": "Authentifizierung beim Start der App",
        "methodPasscode": "Kennwort",
        "passcodeSetupDescription": "Ein PIN-Code hilft, Ihre Geldbörse vor unbefugtem Zugriff zu schützen"
    },
    "backup": {
        "title": "Ihre Wiederherstellungsphrase",
        "subtitle": "Schreiben Sie diese 24 Wörter in der unten angegebenen Reihenfolge auf und bewahren Sie sie an einem geheimen, sicheren Ort auf."
    },
    "backupIntro": {
        "title": "Sichern Sie Ihre Geldbörse",
        "subtitle": "Sind Sie sicher, dass Sie Ihre 24 geheimen Wörter gespeichert haben?",
        "saved": "Ja, ich habe sie gespeichert",
        "goToBackup": "Nein, zur Sicherung wechseln"
    },
    "errors": {
        "incorrectWords": {
            "title": "Falsche Wörter",
            "message": "Sie haben falsche geheime Wörter eingegeben. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut."
        },
        "secureStorageError": {
            "title": "Fehler im sicheren Speicher",
            "message": "Leider können wir die Daten nicht speichern."
        },
        "title": "Ups",
        "invalidNumber": "Nein, das ist keine echte Zahl. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
        "codeTooManyAttempts": "Sie haben es zu oft versucht. Bitte versuchen Sie es in 15 Minuten erneut.",
        "codeInvalid": "Nein, der eingegebene Code ist ungültig. Bitte überprüfen Sie ihn und versuchen Sie es erneut.",
        "unknown": "Uff, das ist ein unbekannter Fehler. Ich habe wirklich keine Ahnung, was los ist. Können Sie versuchen, es an- und auszuschalten?"
    },
    "confirm": {
        "logout": {
            "title": "Sind Sie sicher, dass Sie Ihre Geldbörse von dieser App trennen und alle Daten aus der App löschen möchten?",
            "message": "Diese Aktion führt dazu, dass alle Konten von diesem Gerät gelöscht werden. Stellen Sie sicher, dass Sie Ihre 24 geheimen Wörter gesichert haben, bevor Sie fortfahren."
        },
        "changeCurrency": "Primäre Währung auf {{currency}} wechseln"
    },
    "neocrypto": {
        "buttonTitle": "kaufen",
        "alert": {
            "title": "So funktioniert der Checkout",
            "message": "Füllen Sie die erforderlichen Felder aus -> Wählen Sie Kryptowährung und geben Sie Empfängeradresse und den zu kaufenden Betrag an -> Gehen Sie zur Kasse -> Geben Sie Ihre Rechnungsdaten korrekt ein. Ihre Kreditkartenzahlung wird sicher von unseren Partnern verarbeitet -> Kauf abschließen. Kein Konto erforderlich!"
        },
        "title": "Kaufen Sie TON mit Kreditkarte für USD, EUR und RUB",
        "description": "Sie werden zu Neocrypto weitergeleitet. Dienste im Zusammenhang mit Zahlungen werden von Neocrypto bereitgestellt, einer separaten Plattform, die einem Drittanbieter gehört\n\nBitte lesen und akzeptieren Sie die Nutzungsbedingungen von Neocrypto, bevor Sie deren Dienst nutzen",
        "doNotShow": "Nicht mehr für Neocrypto anzeigen",
        "termsAndPrivacy": "Ich habe gelesen und stimme zu den ",
        "confirm": {
            "title": "Sind Sie sicher, dass Sie dieses Formular schließen möchten?",
            "message": "Diese Aktion verwirft alle Ihre Änderungen"
        }
    },
    "known": {
        "deposit": "Einzahlung",
        "depositOk": "Einzahlung akzeptiert",
        "withdraw": "Auszahlungsanforderung über {{coins}} TON",
        "withdrawAll": "Antrag auf Auszahlung aller Coins",
        "withdrawLiquid": "Auszahlen",
        "withdrawCompleted": "Auszahlung abgeschlossen",
        "withdrawRequested": "Auszahlung angefordert",
        "upgrade": "Code auf {{hash}} aktualisieren",
        "upgradeOk": "Upgrade abgeschlossen",
        "cashback": "Tokenback",
        "tokenSent": "Token gesendet",
        "tokenReceived": "Token empfangen",
        "holders": {
            "topUpTitle": "Aufladebetrag",
            "accountTopUp": "Aufladung von {{amount}} TON",
            "accountJettonTopUp": "Konto aufladen",
            "limitsChange": "Limits ändern",
            "limitsTitle": "Limits",
            "limitsOneTime": "Pro Transaktion",
            "limitsDaily": "Täglich",
            "limitsMonthly": "Monatlich",
            "accountLimitsChange": "Limits ändern"
        }
    },
    "jetton": {
        "token": "token",
        "productButtonTitle": "Token",
        "productButtonSubtitle": "{{jettonName}} und {{count}} weitere",
        "hidden": "Versteckte Token",
        "liquidPoolDescriptionDedust": "Liquidität für {{name0}}/{{name1}} auf DeDust DEX",
        "liquidPoolDescriptionStonFi": "Liquidität für {{name0}}/{{name1}} auf STON.fi DEX",
        "emptyBalance": "Kein Guthaben",
        "jettonsNotFound": "Keine Token gefunden"
    },
    "connections": {
        "extensions": "Erweiterungen",
        "connections": "Verbindungen"
    },
    "accounts": {
        "active": "Aktiv",
        "noActive": "Keine aktiven Konten",
        "disabled": "Ausgeblendet",
        "alertActive": "{{symbol}} als aktiv markieren",
        "alertDisabled": "{{symbol}} als ausgeblendet markieren",
        "description": "Um den Status eines Kontos zu ändern, halten Sie die Kontoschaltfläche auf dem Startbildschirm gedrückt oder drücken Sie in diesem Menü. Das Konto wird zum Startbildschirm hinzugefügt oder ausgeblendet.",
        "noAccounts": "Sie haben noch keine Konten"
    },
    "spamFilter": {
        "minAmount": "Minimaler TON-Betrag",
        "dontShowComments": "Keine Kommentare zu SPAM-Transaktionen anzeigen",
        "minAmountDescription": "Transaktionen mit einem TON-Betrag unter {{amount}} werden automatisch als SPAM markiert",
        "applyConfig": "Ausgewählte SPAMfilter-Einstellungen anwenden",
        "denyList": "Manueller Spamfilter",
        "denyListEmpty": "Keine blockierten Adressen",
        "unblockConfirm": "Adresse freigeben",
        "blockConfirm": "Adresse als Spam markieren",
        "description": "Sie können ganz einfach eine Adresse zur Liste der manuell blockierten Adressen hinzufügen, indem Sie auf eine beliebige Transaktion oder Adresse klicken und im Popup-Menü \"Adresse als Spam markieren\" auswählen"
    },
    "security": {
        "title": "Sicherheit",
        "passcodeSettings": {
            "setupTitle": "PIN-Code einrichten",
            "confirmTitle": "PIN-Code bestätigen",
            "changeTitle": "PIN-Code ändern",
            "resetTitle": "PIN-Code zurücksetzen",
            "resetDescription": "Wenn Sie Ihren PIN-Code vergessen haben, können Sie ihn zurücksetzen, indem Sie die 24 geheimen Wörter eingeben, die Sie beim Erstellen der Geldbörse notiert haben.",
            "resetAction": "Zurücksetzen",
            "error": "Falscher PIN-Code",
            "tryAgain": "Erneut versuchen",
            "success": "PIN-Code erfolgreich festgelegt",
            "enterNew": "PIN-Code erstellen",
            "confirmNew": "Neuen PIN-Code bestätigen",
            "enterCurrent": "Geben Sie Ihren PIN-Code ein",
            "enterPrevious": "Aktuellen PIN-Code eingeben",
            "enterNewDescription": "Durch das Festlegen eines Kennworts wird eine zusätzliche Sicherheitsebene bei der Verwendung der Anwendung hinzugefügt",
            "changeLength": "Verwenden Sie einen {{length}}-stelligen PIN-Code",
            "forgotPasscode": "PIN-Code vergessen?",
            "logoutAndReset": "Abmelden und PIN-Code zurücksetzen"
        },
        "auth": {
            "biometricsPermissionCheck": {
                "title": "Erforderliche Berechtigung",
                "message": "Bitte erlauben Sie der App den Zugriff auf biometrische Daten zur Authentifizierung",
                "openSettings": "Einstellungen öffnen",
                "authenticate": "Mit PIN-Code authentifizieren"
            },
            "biometricsSetupAgain": {
                "title": "Neue biometrische Daten erkannt",
                "message": "Bitte richten Sie die biometrische Authentifizierung in den Sicherheitseinstellungen erneut ein",
                "setup": "Einrichten",
                "authenticate": "Mit PIN-Code fortfahren"
            },
            "biometricsCooldown": {
                "title": "Abkühlphase für biometrische Daten",
                "message": "Bitte versuchen Sie es später erneut, oder sperren Sie Ihr Gerät und entsperren Sie es wieder mit dem Gerätekennwort, um biometrische Daten zu aktivieren"
            },
            "biometricsCorrupted": {
                "title": "Biometrische Daten beschädigt und kein PIN-Code festgelegt",
                "message": "Leider ist Ihre Geldbörse nicht mehr verfügbar, um Ihre Geldbörse wiederherzustellen, tippen Sie auf \"Wiederherstellen\" (Sie werden von Ihrer aktuellen Geldbörse abgemeldet) und geben Sie Ihre 24 geheimen Wörter ein.",
                "messageLogout": "Leider ist Ihre Geldbörse nicht mehr verfügbar, um sie wiederherzustellen, tippen Sie auf \"Abmelden\" (Sie werden von Ihrer aktuellen Geldbörse abgemeldet) und fügen Sie Ihre Geldbörse erneut hinzu",
                "logout": "Abmelden",
                "restore": "Wiederherstellen"
            },
            "canceled": {
                "title": "Abgebrochen",
                "message": "Die Authentifizierung wurde abgebrochen, bitte versuchen Sie es erneut"
            }
        }
    },
    "report": {
        "title": "Melden",
        "scam": "Betrug",
        "bug": "Fehler",
        "spam": "Spam",
        "offense": "Anstößige Inhalte",
        "posted": "Ihre Meldung wurde gesendet",
        "error": "Fehler beim Senden der Meldung",
        "message": "Nachricht (erforderlich)",
        "reason": "Grund für die Meldung"
    },
    "review": {
        "title": "Erweiterung bewerten",
        "rating": "Bewertung",
        "review": "Bewertung (optional)",
        "heading": "Titel",
        "error": "Fehler beim Senden der Bewertung",
        "posted": "Danke für Ihr Feedback!",
        "postedDescription": "Ihre Bewertung wird nach der Moderation veröffentlicht"
    },
    "deleteAccount": {
        "title": "Sind Sie sicher, dass Sie das Konto löschen möchten?",
        "action": "Konto und alle Daten löschen",
        "logOutAndDelete": "Abmelden und alle Daten löschen",
        "description": "Diese Aktion wird alle Daten und das aktuell ausgewählte Wallet von diesem Gerät und Ihrem Blockchain-Konto löschen.\nSie müssen alle Ihre TON-Coins in ein anderes Wallet übertragen. Bevor Sie fortfahren, stellen Sie sicher, dass Sie mehr als {{amount}} TON auf Ihrem Konto haben, um die Transaktion abzuschließen.",
        "complete": "Kontolöschung abgeschlossen",
        "error": {
            "hasNfts": "Sie haben NFTs in Ihrem Wallet. Um das Konto zu löschen, senden Sie diese bitte an ein anderes Wallet.",
            "fetchingNfts": "Es konnte nicht festgestellt werden, ob sich NFTs im Wallet befinden. Um das Konto zu löschen, stellen Sie bitte sicher, dass sich keine NFTs darin befinden.",
            "hasUSDTBalanceTitle": "Sie haben ein USDT-Guthaben in Ihrem Wallet",
            "hasUSDTBalanceMessage": "Um das Konto zu löschen, senden Sie es bitte an ein anderes Wallet."
        },
        "confirm": {
            "title": "Sind Sie sicher, dass Sie Ihr Konto und alle Daten aus dieser Anwendung löschen möchten?",
            "message": "Diese Aktion löscht Ihr Konto und alle Daten aus dieser Anwendung und überträgt alle Ihre TON-Coins an die angegebene Wallet-Adresse.\nBitte überprüfen Sie die Empfängeradresse sorgfältig, bevor Sie fortfahren. Bei dieser Transaktion fallen übliche Blockchain-Gebühren an."
        },
        "checkRecipient": "Empfänger überprüfen",
        "checkRecipientDescription": "Um Ihr Konto zu deaktivieren, müssen Sie alle Mittel an ein anderes Wallet (Empfängeradresse) übertragen. Bitte überprüfen Sie die Adresse sorgfältig, bevor Sie fortfahren"
    },
    "logout": {
        "title": "Sind Sie sicher, dass Sie sich bei {{name}} abmelden möchten?",
        "logoutDescription": "Der Zugriff auf das Wallet wird deaktiviert. Haben Sie Ihren Private Key gesichert?"
    },
    "contacts": {
        "title": "Kontakte",
        "contact": "Kontakt",
        "unknown": "Unbekannt",
        "contacts": "Meine Kontakte",
        "name": "Name",
        "lastName": "Nachname",
        "company": "Unternehmen",
        "add": "Kontakt hinzufügen",
        "edit": "Bearbeiten",
        "save": "Speichern",
        "notes": "Notizen",
        "alert": {
            "name": "Ungültiger Name",
            "nameDescription": "Der Kontaktname darf nicht leer sein oder mehr als 126 Zeichen enthalten",
            "notes": "Ungültiges Feld",
            "notesDescription": "Kontaktfelder dürfen nicht länger als 280 Zeichen sein"
        },
        "delete": "Kontakt löschen",
        "empty": "Noch keine Kontakte",
        "description": "Sie können eine Adresse zu Ihren Kontakten hinzufügen, indem Sie in einer Transaktion oder Adresse lange drücken oder die Schaltfläche \"Hinzufügen\" verwenden oder aus der Liste der zuletzt verwendeten Kontakte unten",
        "contactAddress": "Kontaktadresse",
        "search": "Name oder Wallet-Adresse",
        "new": "Neuer Kontakt"
    },
    "currency": {
        "USD": "US-Dollar",
        "EUR": "Euro",
        "RUB": "Russischer Rubel",
        "GBP": "Britische Pfund",
        "CHF": "Schweizer Franken",
        "CNY": "Chinesischer Yuan",
        "KRW": "Südkoreanischer Won",
        "IDR": "Indonesische Rupiah",
        "INR": "Indische Rupie",
        "JPY": "Japanischer Yen"
    },
    "txActions": {
        "addressShare": "Adresse teilen",
        "addressContact": "Adresse zu Kontakten hinzufügen",
        "addressContactEdit": "Adresskontakt bearbeiten",
        "addressMarkSpam": "Adresse als Spam markieren",
        "viewInExplorer": "Im Explorer anzeigen",
        "txShare": "Transaktion teilen",
        "txRepeat": "Transaktion wiederholen",
        "view": "In Tonviewer anzeigen",
        "share": {
            "address": "TON-Adresse",
            "transaction": "TON-Transaktion"
        }
    },
    "hardwareWallet": {
        "ledger": "Ledger",
        "title": "Ledger verbinden",
        "description": "Ihr Ledger-Hardware-Wallet",
        "installationIOS": "Ledger entsperren, mit Ihrem Smartphone per Bluetooth verbinden und Tonhub Zugriff gewähren.",
        "installationAndroid": "Ledger entsperren, mit Ihrem Smartphone per Bluetooth oder USB-Kabel verbinden und Tonhub Zugriff gewähren.",
        "installationGuide": "TON Ledger-Verbindungsanleitung",
        "connectionDescriptionAndroid": "Verbinden Sie Ihr Ledger per USB oder Bluetooth",
        "connectionDescriptionIOS": "Verbinden Sie Ihr Ledger per Bluetooth",
        "connectionHIDDescription_1": "1. Schalten Sie Ihr Ledger ein und entsperren Sie es",
        "connectionHIDDescription_2": "2. Drücken Sie \"Weiter\"",
        "openTheAppDescription": "Öffnen Sie die TON-App auf Ihrem Ledger",
        "unlockLedgerDescription": "Entsperren Sie Ihr Ledger",
        "chooseAccountDescription": "Wählen Sie das Konto, das Sie verwenden möchten",
        "bluetoothScanDescription_1": "1. Schalten Sie Ihr Ledger ein und entsperren Sie es",
        "bluetoothScanDescription_2": "2. Stellen Sie sicher, dass Sie Bluetooth aktiviert haben",
        "bluetoothScanDescription_3": "3. Drücken Sie \"Scannen\", um nach verfügbaren Geräten zu suchen, und wählen Sie den passenden Ledger Nano X aus",
        "bluetoothScanDescription_3_and": "3. Drücken Sie \"Scannen\", um nach verfügbaren Geräten zu suchen (wir benötigen Zugriff auf Standortdaten und die Berechtigung, in der Nähe befindliche Geräte zu suchen)",
        "bluetoothScanDescription_4_and": "4. Wählen Sie anschließend den passenden Ledger Nano X aus",
        "openAppVerifyAddress": "Prüfen Sie die ausgewählte Kontoadresse und verifizieren Sie diese dann, wenn die Ledger Ton App dazu auffordert",
        "devices": "Ihre Geräte",
        "connection": "Verbindung",
        "actions": {
            "connect": "Ledger verbinden",
            "selectAccount": "Konto auswählen",
            "account": "Konto #{{account}}",
            "loadAddress": "Adresse verifizieren",
            "connectHid": "Ledger per USB verbinden",
            "connectBluetooth": "Ledger per Bluetooth verbinden",
            "scanBluetooth": "Erneut scannen",
            "confirmOnLedger": "Auf Ledger verifizieren",
            "sending": "Transaktion wird ausgeführt",
            "sent": "Transaktion gesendet",
            "mainAddress": "Hauptadresse",
            "givePermissions": "Berechtigungen erteilen"
        },
        "confirm": {
            "add": "Sind Sie sicher, dass Sie diese App hinzufügen möchten?",
            "remove": "Sind Sie sicher, dass Sie diese App entfernen möchten?"
        },
        "errors": {
            "bleTitle": "Bluetooth-Fehler",
            "noDevice": "Kein Gerät gefunden",
            "appNotOpen": "TON-App ist nicht auf Ledger geöffnet",
            "openApp": "Bitte öffnen Sie die TON-App auf Ihrem Ledger",
            "turnOnBluetooth": "Bitte schalten Sie Bluetooth ein und versuchen Sie es erneut",
            "lostConnection": "Verbindung mit Ledger verloren",
            "transactionNotFound": "Transaktion nicht gefunden",
            "transactionRejected": "Transaktion abgelehnt",
            "transferFailed": "Übertragung fehlgeschlagen",
            "permissions": "Bitte erlauben Sie Zugriff auf Bluetooth und Standort",
            "unknown": "Unbekannter Fehler",
            "reboot": "Bitte starten Sie Ihr Gerät neu und versuchen Sie es erneut",
            "turnOnLocation": "Bitte aktivieren Sie die Standortdienste und versuchen Sie es erneut, da dies zum Scannen nach Geräten in der Nähe erforderlich ist",
            "locationServicesUnauthorized": "Standortdienste sind nicht autorisiert",
            "bluetoothScanFailed": "Bluetooth-Scan fehlgeschlagen",
            "unsafeTransfer": "Bitte erlauben Sie das Blind-Signing in der TON Ledger App",
            "userCanceled": "Auf Ledger abgelehnt",
            "updateApp": "Bitte aktualisieren Sie die TON-App in Ledger Live auf die neueste Version",
            "permissionsIos": "Bitte erlauben Sie Zugriff auf Bluetooth"
        },
        "moreAbout": "Mehr über Ledger",
        "verifyAddress": {
            "title": "Adresse auf Ledger bestätigen",
            "message": "Bitte bestätigen Sie die Adresse: {{address}} auf Ihrem Ledger Gerät",
            "action": "Bestätigen",
            "invalidAddressTitle": "Ungültige Adresse",
            "invalidAddressMessage": "Diese Adresse ist ungültig. Bitte überprüfen Sie die Adresse und versuchen Sie es erneut",
            "failed": "Bestätigung der Adresse fehlgeschlagen",
            "failedMessage": "Bitte verbinden Sie Ledger erneut und versuchen Sie es noch einmal",
            "verifying": "Auf Ledger bestätigen",
            "validAddressTitle": "Diese Adresse ist gültig"
        }
    },
    "devTools": {
        "switchNetwork": "Netzwerk",
        "switchNetworkAlertTitle": "Wechsel zum {{network}} Netzwerk",
        "switchNetworkAlertMessage": "Sind Sie sicher, dass Sie das Netzwerk wechseln möchten?",
        "switchNetworkAlertAction": "Wechseln",
        "copySeed": "24-Wörter-Seed-Phrase kopieren",
        "copySeedAlertTitle": "24-Wörter-Seed-Phrase in die Zwischenablage kopieren",
        "copySeedAlertMessage": "WARNUNG! Das Kopieren der 24-Wörter-Seed-Phrase in die Zwischenablage ist nicht sicher. Fahren Sie auf eigenes Risiko fort.",
        "copySeedAlertAction": "Kopieren",
        "holdersOfflineApp": "Holders Offline App"
    },
    "wallets": {
        "choose_versions": "Wählen Sie Wallets zum Hinzufügen",
        "noVersionTitle": "Wählen Sie eine Version",
        "noVersionDescription": "Keine Wallet-Version ausgewählt",
        "switchToAlertTitle": "Wechsel zu {{wallet}}",
        "switchToAlertMessage": "Sind Sie sicher, dass Sie Wallets wechseln möchten?",
        "switchToAlertAction": "Wechseln",
        "addNewTitle": "Wallet hinzufügen",
        "addNewAlertTitle": "Neues Wallet hinzufügen",
        "addNewAlertMessage": "Sind Sie sicher, dass Sie ein neues Wallet hinzufügen möchten?",
        "addNewAlertAction": "Hinzufügen",
        "alreadyExistsAlertTitle": "Wallet existiert bereits",
        "alreadyExistsAlertMessage": "Ein Wallet mit dieser Adresse existiert bereits",
        "settings": {
            "changeAvatar": "Avatar ändern",
            "selectAvatarTitle": "Bild",
            "selectColorTitle": "Hintergrundfarbe"
        }
    },
    "webView": {
        "checkInternetAndReload": "Bitte überprüfen Sie Ihre Internetverbindung und laden Sie die Seite neu",
        "contactSupportOrTryToReload": "Kontaktieren Sie den Support oder versuchen Sie, die Seite neu zu laden",
        "contactSupport": "Support kontaktieren"
    },
    "appAuth": {
        "description": "Um sich weiterhin in der App anzumelden"
    },
    "screenCapture": {
        "title": "Wow, ein cooler Screenshot, aber das ist nicht sicher",
        "description": "Unverschlüsselte digitale Kopien Ihrer geheimen Phrase werden NICHT empfohlen. Beispiele sind das Speichern von Kopien auf dem Computer, auf Online-Konten oder das Aufnehmen von Screenshots",
        "action": "OK, ich gehe das Risiko ein"
    },
    "onboarding": {
        "avatar": "Hier können Sie den Avatar und den Namen Ihres Wallets ändern",
        "wallet": "Hier können Sie neue Wallets hinzufügen oder zwischen Ihren Wallets wechseln",
        "price": "Hier können Sie Ihre Hauptwährung ändern"
    },
    "newAddressFormat": {
        "title": "Adressformat",
        "fragmentTitle": "Neue Adresstypen",
        "learnMore": "Mehr über neue Adressen",
        "shortDescription": "Das Adress-Update macht die TON-Blockchain noch sicherer und stabiler. Alle an Ihre alte Adresse gesendeten Assets werden weiterhin in Ihrem Wallet ankommen.",
        "description_0_0": "Vor Kurzem hat TON ",
        "description_0_link": "dieses Update",
        "description_0_1": " zu Adressen angekündigt und alle Wallets gebeten, es zu unterstützen.",
        "title_1": "Warum?",
        "description_1": "Das Update ermöglicht es Entwicklern, zwischen Wallet- und Vertragsadressen zu unterscheiden und Fehler beim Senden von Transaktionen zu vermeiden.",
        "title_2": "Was müssen Sie tun?",
        "description_2": "Klicken Sie auf dem vorherigen Bildschirm auf die Schaltfläche und autorisieren Sie uns, alle Adressen in der App im neuen Format anzuzeigen. Sie können jederzeit wieder zum alten Format wechseln, indem Sie Ihre Einstellungen anpassen.",
        "title_3": "Was passiert mit der alten Adresse?",
        "description_3": "Alle TONs, Token, NFTs und anderen Assets, die an Ihre alte Adresse gesendet werden, werden weiterhin in Ihrem Wallet ankommen.",
        "description_4": "Technische Details zum Upgrade finden Sie unter",
        "action": "Verwenden Sie {{format}}",
        "oldAddress": "Alte Adresse",
        "newAddress": "Neue Adresse",
        "bannerTitle": "Aktualisieren Sie Ihre Adresse",
        "bannerDescription": "Von EQ zu UQ"
    },
    "changelly": {
        "title": "Changelly ist ein nicht-verwahrter, sofortiger Kryptowährungsaustausch",
        "description": "Sie sind dabei, einen Changelly-Service zu nutzen, der von einer unabhängigen Partei betrieben wird, die nicht mit Tonhub verbunden ist\nSie müssen den Nutzungsbedingungen und der Datenschutzrichtlinie zustimmen, um fortzufahren",
        "dontShowTitle": "Nicht mehr für Changelly anzeigen",
        "bannerTitle": "USDC-Einzahlungen",
        "bannerDescription": "Tron, Solana, Ethereum, Polygon verfügbar!",
        "tonhubBannerTitle": "Changelly in Tonhub!",
        "tonhubBannerDescription": "Einzahlung von anderen Blockchains",
        "minimumAmount": "Minimale Menge: {{amount}}",
        "maximumAmount": "Maximale Menge: {{amount}}",
    },
    "order": {
        "enterAmount": "Übertragungsbetrag eingeben",
        "give": "Geben",
        "get": "Erhalten",
        "exchangeRate": "Wechselkurs",
        "networkServiceFee": "Netzwerk- und Servicegebühr",
        "serviceFee": "Servicegebühr",
        "poweredBy": "Unterstützt von",
        "continue": "Fortfahren",
        "sendToDeposit": "{{currency}} senden, um Ihr Konto aufzuladen",
        "waitingTransfer": "Warten auf Übertragung...",
        "amount": "Betrag",
        "address": "Adresse",
        "network": "Netzwerk",
        "youSend": "Sie senden",
        "wallet": "Wallet",
        "youGet": "Sie erhalten",
        "closeOrder": "Bestellung schließen",
        "deposit": "Einzahlung",
        "waitingForTransfer": "Warten auf Übertragung",
        "chooseCrypto": "Krypto wählen",
        "chooseAsset": "Wählen Sie das Asset aus, das Sie erhalten möchten:",
        "orderCloseTitle": "Sind Sie sicher, dass Sie diese Bestellung schließen möchten?",
        "orderCloseDescription": "Sobald die Bestellung geschlossen ist, gehen alle bereits an die angegebene Adresse gesendeten Gelder dauerhaft verloren und können nicht wiederhergestellt werden.\n\nWenn Sie Probleme haben oder Fragen haben, wenden Sie sich bitte an unser Support-Team.",
        "orderCloseConfirm": "Ja, ich stimme zu, die Bestellung zu schließen",
        "contactSupport": "Support kontaktieren",
        "info": {
            "title": {
                "pending": "Einzahlung ist unterwegs",
                "success": "Einzahlung erfolgreich",
                "failure": "Einzahlung fehlgeschlagen"
            },
            "description": {
                "pending": "Zahlung erhalten. Die Aufladung dauert 5 Minuten bis 10 Stunden.",
                "success": "Krypto auf Ihrem Konto",
                "failure": "Zahlung fehlgeschlagen. Bitte kontaktieren Sie den Support"
            },
            "notifications": {
                "amountCopiedSuccess": "Betrag erfolgreich kopiert",
                "payAddressCopiedSuccess": "Adresse erfolgreich kopiert",
                "orderClosedSuccess": "Bestellung erfolgreich geschlossen"
            },
            "status": {
                "pending": "Unterwegs",
                "success": "Zahlung erfolgreich",
                "failure": "Zahlung fehlgeschlagen"
            },
        },
    },
    "w5": {
        "banner": {
            "title": "Wallet W5 hinzufügen",
            "description": "USDT ohne Gas transferieren"
        },
        "update": {
            "title": "Wallet auf W5 aktualisieren",
            "subtitle_1": "Gaslose USDT-Transfers",
            "description_1": "Sie benötigen kein TON mehr, um USDT zu senden. Die Transaktionsgebühren können aus Ihrem Token-Guthaben gedeckt werden.",
            "subtitle_2": "Gebühren sparen",
            "description_2": "W5 ermöglicht es, die Anzahl der Vorgänge in einer einzigen Transaktion um 60 Mal zu erhöhen und so erheblich Gebühren zu sparen.",
            "subtitle_3": "Ihre Seed-Phrase ändert sich nicht",
            "description_3": "V4- und W5-Wallets verwenden dieselbe Seed-Phrase. Sie können jederzeit die Version wechseln, indem Sie oben auf dem Hauptbildschirm die gewünschte Adresse auswählen.",
            "switch_button": "Zu W5 wechseln"
        },
        "gaslessInfo": "Es ist kein TON erforderlich, um die Gasgebühr beim Senden dieses Tokens zu zahlen. Die Gebühr wird direkt von Ihrem Token-Guthaben abgezogen."
    },
    "browser": {
        "listings": {
            "categories": {
                "other": "Sonstiges",
                "exchange": "Börsen",
                "defi": "DeFi",
                "nft": "NFT",
                "games": "Spiele",
                "social": "Sozial",
                "utils": "Dienstprogramme",
                "services": "Dienste"
            },
            "title": "Für Sie"
        },
        "refresh": "Neu laden",
        "back": "Zurück",
        "forward": "Vorwärts",
        "share": "Teilen",
        "search": {
            "placeholder": "Suchen",
            "invalidUrl": "Ungültige URL",
            "urlNotReachable": "URL ist nicht erreichbar",
            "suggestions": {
                "web": "Suche in {{engine}}",
                "ddg": "DuckDuckGo",
                "google": "Google"
            }
        },
        "alertModal": {
            "message": "Sie sind dabei, eine externe Webanwendung zu öffnen. Wir übernehmen keine Verantwortung für den Inhalt oder die Sicherheit von Drittanbieter-Apps.",
            "action": "Öffnen"
        }
    },
    "swap": {
        "title": "DeDust.io — AMM DEX auf The Open Network",
        "description": "Sie sind dabei, einen Dedust.io-Dienst zu nutzen, der von einer unabhängigen Partei betrieben wird, die nicht mit Tonhub verbunden ist.\nSie müssen den Nutzungsbedingungen und der Datenschutzerklärung zustimmen, um fortzufahren",
        "termsAndPrivacy": "Ich habe Folgendes gelesen und akzeptiert: ",
        "dontShowTitle": "Nicht mehr für DeDust.io anzeigen"
    },
    "mandatoryAuth": {
        "title": "Überprüfen Sie Ihr Backup",
        "description": "Aktivieren Sie die Verifizierung beim Öffnen einer Wallet. Dies hilft, Ihre Bankkartendaten zu schützen.",
        "alert": "Notieren Sie 24 geheime Wörter im Sicherheitsbereich der Wallet-Einstellungen. Dies hilft Ihnen, den Zugriff wiederherzustellen, falls Sie Ihr Telefon verlieren oder Ihren PIN-Code vergessen.",
        "confirmDescription": "Ich habe die 24 geheimen Wörter meiner Wallet notiert und an einem sicheren Ort aufbewahrt",
        "action": "Aktivieren",
        "settingsDescription": "Eine Authentifizierungsanfrage ist erforderlich, da die App Bankprodukte anzeigt. Sensible Daten werden ausgeblendet, bis Sie die Authentifizierung einschalten"
    },
    "update": {
        "callToAction": "Tonhub aktualisieren"
    },
    "savings": {
        "ton": "TON Sparkonto",
        "usdt": "USDT Sparkonto",
        "general": "{{symbol}} Sparkonto"
    },
    "spending": {
        "ton": "TON-Ausgabekonto",
        "usdt": "USDT-Ausgabekonto",
        "general": "{{symbol}}-Ausgabekonto"
    },
    "solana": {
        "instructions": {
            "createAssociatedTokenAccount": "Verknüpftes Token-Konto erstellen",
            "unknown": "Unbekannte Anweisung",
            "systemTransfer": "SOL-Überweisung",
            "createAccount": "Konto erstellen",
            "tokenTransfer": "Token-Überweisung",
            "depositCard": "Kontoeinzahlung",
            "closeCard": "Karte schließen",
            "updateCardLimits": "Kartenlimits aktualisieren"
        },
        "banner": {
            "title": "Solana ist jetzt verfügbar",
            "description": "Empfangen, speichern und senden von SOL und USDC"
        }
    },
    "iban": {
        "banner": {
            "title": "Einzahlungen per IBAN",
            "description": "Erhalten Sie frühen Zugang"
        }
    },
    "walletRequests": {
        "title": "Wollt Ihnen Geld senden, bestätigen Sie, dass dies Ihre Adresse ist",
        "description": "Wenn der Besitzer dieser Adresse Tonhub verwendet, können Sie sie bitten, zu bestätigen, dass dies die richtige Adresse ist und zu ihm gehört",
        "request": "Bestätigung anfragen",
        "confirmed": "Adresse bestätigt!",
        "declined": "Bestätigung abgelehnt",
        "expired": "Bestätigung abgelaufen",
        "pending": "Warten auf Bestätigung...",
    },
    "aiChat": {
        "title": "KI-Assistent",
        "sessionId": "Sitzung",
        "connecting": "Verbinde...",
        "noConnection": "Keine Verbindung",
        "welcomeTitle": "Willkommen im KI-Chat!",
        "welcomeSubtitle": "Fragen Sie nach Ihren Ausgaben oder bitten Sie um Rat",
        "placeholder": "Nachricht eingeben...",
        "characterCount": "{{count}}/1000",
        "recoveringRequest": "Anfrage wird wiederhergestellt...",
        "clearHistory": "Verlauf löschen",
        "reconnect": "Neu verbinden",
        "messageTooLong": "Nachricht zu lang. Maximal 1000 Zeichen erlaubt.",
        "notConnected": "Nicht mit Chat-Server verbunden",
        "loadingProfile": "Profil wird geladen...",
        "profileNotAvailable": "Profil nicht verfügbar. Überprüfen Sie Ihr Holders-Konto.",
        "errors": {
            "certificateError": "Zertifikatvalidierung fehlgeschlagen. Überprüfen Sie die SSL-Konfiguration des Servers.",
            "connectionError": "WebSocket-Verbindungsfehler",
            "sessionNotFound": "Sitzung nicht gefunden",
            "invalidUserId": "Ungültiges Benutzer-ID-Format"
        },
        "initMessage": {
            "holdersTx": "Erzählen Sie mir mehr über diese Transaktion: {{tx}}"
        },
        "banner": {
            "title": "Intelligentes Finanzmanagement",
            "description": "Intelligentere Wege, Ihre Ausgaben zu verstehen"
        },
        "tx": {
            "categories": {
                "any": "Irgendein",
                "culture": "Kultur",
                "entertainment": "Unterhaltung",
                "finance": "Finanzen",
                "groceries": "Lebensmittel",
                "health_and_beauty": "Gesundheit und Schönheit",
                "home_and_utilities": "Zuhause und Versorgungsleistungen",
                "professional_services": "Professionelle Dienstleistungen",
                "public_administrations": "Öffentliche Verwaltungen",
                "restaurants": "Restaurants",
                "shopping": "Einkaufen",
                "software": "Software",
                "transport": "Transport",
                "travel": "Reise",
                "withdrawal": "Abhebung",
                "purchase": "Kauf",
                "general": "Allgemein",
                "purchase_reversal": "Rückerstattungen",
                "deposit": "Aufladung",
                "other": "Andere"
            }
        }
    }
};

export default schema;
