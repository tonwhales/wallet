import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, "" | "_plural"> = {
    "lang": "it",
    "common": {
        "and": "e",
        "accept": "Accetta",
        "start": "Inizia",
        "continue": "Continua",
        "continueAnyway": "Continua comunque",
        "back": "Indietro",
        "logout": "Disconnetti",
        "logoutFrom": "Disconnetti da {{name}}",
        "cancel": "Annulla",
        "balance": "Saldo",
        "totalBalance": "Saldo totale",
        "walletAddress": "Indirizzo del portafoglio",
        "recipientAddress": "Indirizzo del destinatario",
        "recipient": "Destinatario",
        "copy": "Copia",
        "copiedAlert": "Copiato negli appunti",
        "copied": "Copiato",
        "share": "Condividi",
        "send": "Invia",
        "yes": "Sì",
        "no": "No",
        "amount": "Importo",
        "today": "Oggi",
        "yesterday": "Ieri",
        "comment": "Commento",
        "products": "Prodotti",
        "confirm": "Conferma",
        "soon": "presto",
        "in": "in",
        "max": "Max",
        "close": "Chiudi",
        "delete": "Elimina",
        "apply": "Applica",
        "domainOrAddress": "Indirizzo del portafoglio o dominio",
        "domainOrAddressOrContact": "Indirizzo, dominio o nome",
        "domain": "Dominio",
        "search": "Cerca",
        "termsOfService": "Termini\u00A0Di\u00A0Servizio",
        "privacyPolicy": "Politica\u00A0Sulla\u00A0Privacy",
        "apy": "APY",
        "tx": "Transazione",
        "add": "Aggiungi",
        "connect": "Connetti",
        "gotIt": "Capito",
        "error": "Errore",
        "wallet": "Portafoglio",
        "wallets": "Portafogli",
        "later": "Più tardi",
        "select": "Seleziona",
        "show": "Mostra",
        "hide": "Nascondi",
        "showAll": "Mostra tutto",
        "hideAll": "Nascondi tutto",
        "done": "Fatto",
        "mainWallet": "Portafoglio principale",
        "walletName": "Nome del portafoglio",
        "from": "Da",
        "to": "A",
        "transaction": "Transazione",
        "somethingWentWrong": "Qualcosa è andato storto",
        "checkInternetConnection": "Controlla la tua connessione internet",
        "reload": "Ricarica",
        "errorOccurred": "Si è verificato un errore: {{error}}",
        "recent": "Recente",
        "ok": "OK",
        "attention": "Attenzione",
        "save": "Salva",
        "assets": "Risorse",
        "message": "Messaggio",
        "messages": "Messaggi",
        "airdrop": "Airdrop",
        "myWallets": "I miei portafogli",
        "showMore": "Mostra di più",
        "balances": "Saldi",
        "loading": "Caricamento...",
        "notFound": "Non trovato",
        "unverified": "Non verificato",
        "addressBook": "Rubrica",
        "gasless": "Senza gas",
        "address": "Indirizzo",
        "currencyChanged": "Valuta cambiata",
        "required": "richiesto"
    },
    "syncStatus": {
        "connecting": "Connessione in corso",
        "updating": "Aggiornamento in corso",
        "online": "Connesso"
    },
    "home": {
        "home": "Home",
        "history": "Cronologia",
        "browser": "Browser",
        "more": "Altro"
    },
    "settings": {
        "title": "Altro",
        "backupKeys": "Backup chiavi",
        "holdersAccounts": "Conti di spesa",
        "migrateOldWallets": "Migra vecchi portafogli",
        "termsOfService": "Termini di Servizio",
        "privacyPolicy": "Politica sulla privacy",
        "developerTools": "Strumenti per sviluppatori",
        "spamFilter": "Filtro SPAM",
        "primaryCurrency": "Valuta principale",
        "experimental": "Sperimentale",
        "support": {
            "title": "Supporto",
            "telegram": "Telegram",
            "form": "Modulo di supporto",
            "holders": "Carta bancaria & conti",
            "tonhub": "Tonhub"
        },
        "telegram": "Telegram",
        "rateApp": "Valuta app",
        "deleteAccount": "Elimina account",
        "theme": "Tema",
        "searchEngine": "Motore di ricerca",
        "language": "Lingua"
    },
    "theme": {
        "title": "Tema",
        "light": "Chiaro",
        "dark": "Scuro",
        "system": "Sistema"
    },
    "wallet": {
        "sync": "Scaricamento dati del portafoglio",
        "balanceTitle": "Saldo Ton",
        "actions": {
            "receive": "Ricevi",
            "send": "Invia",
            "buy": "Compra",
            "swap": "Scambia",
            "deposit": "Deposita"
        },
        "empty": {
            "message": "Non hai transazioni",
            "receive": "Ricevi TON",
            "description": "Effettua la tua prima transazione"
        },
        "pendingTransactions": "Transazioni in sospeso"
    },
    "transactions": {
        "title": "Transazioni",
        "history": "Cronologia",
        "filter": {
            "holders": "Carte",
            "ton": "Transazioni del portafoglio",
            "any": "Tutti",
            "type": "Tipo",
            "accounts": "Spese"
        }
    },
    "tx": {
        "sending": "Invio in corso",
        "sent": "Inviato",
        "received": "Ricevuto",
        "bounced": "Rimbalzato",
        "tokenTransfer": "Trasferimento token",
        "airdrop": "Airdrop",
        "failed": "Fallito",
        "timeout": "Scaduto",
        "batch": "Batch"
    },
    "txPreview": {
        "sendAgain": "Invia di nuovo",
        "blockchainFee": "Commissione di rete",
        "blockchainFeeDescription": "Questa commissione è anche chiamata GAS. È necessaria affinché una transazione venga elaborata con successo nella blockchain. La dimensione del GAS dipende dalla quantità di lavoro che i validatori devono fare per includere una transazione nel blocco."
    },
    "receive": {
        "title": "Ricevi",
        "subtitle": "Invia solo Toncoin e token nella rete TON a questo indirizzo, altrimenti potresti perdere i tuoi fondi.",
        "share": {
            "title": "Il mio indirizzo Tonhub",
            "error": "Condivisione dell'indirizzo fallita, riprova o contatta il supporto"
        },
        "holdersJettonWarning": "Trasferisci a questo indirizzo solo {{symbol}}, se invii un altro token, lo perderai.",
        "assets": "Token e Conti",
        "fromExchange": "Da uno scambio",
        "otherCoins": "Altri token",
        "deposit": "Deposita su"
    },
    "transfer": {
        "title": "Invia",
        "titleAction": "Azione",
        "confirm": "Sei sicuro di voler procedere?",
        "error": {
            "invalidAddress": "Indirizzo non valido",
            "invalidAddressMessage": "Controlla l'indirizzo del destinatario",
            "invalidAmount": "Importo non valido",
            "invalidDomain": "Dominio non valido",
            "invalidDomainString": "Minimo 4 caratteri, massimo 126 caratteri. Sono consentite lettere latine (a-z), numeri (0-9) e un trattino (-). Un trattino non può essere all'inizio o alla fine.",
            "sendingToYourself": "Non puoi inviare monete a te stesso",
            "zeroCoins": "Purtroppo non puoi inviare zero monete",
            "zeroCoinsAlert": "Stai cercando di inviare zero monete",
            "notEnoughCoins": "Non hai abbastanza fondi sul tuo saldo",
            "addressIsForTestnet": "Questo indirizzo è per il testnet",
            "addressCantReceive": "Questo indirizzo non può ricevere monete",
            "addressIsNotActive": "Questo portafoglio non ha storia",
            "addressIsNotActiveDescription": "Questo significa che non sono state effettuate transazioni da questo indirizzo del portafoglio",
            "invalidTransaction": "Transazione non valida",
            "invalidTransactionMessage": "Controlla i dettagli della transazione",
            "memoRequired": "Aggiungi un memo/tag per evitare di perdere fondi",
            "holdersMemoRequired": "Tag/MEMO",
            "memoChange": "Cambia memo/tag in \"{{memo}}\"",
            "gaslessFailed": "Invio della transazione fallito",
            "gaslessFailedMessage": "Riprova o contatta il supporto",
            "gaslessFailedEstimate": "Stima delle commissioni fallita, riprova più tardi o contatta il supporto",
            "gaslessCooldown": "Puoi pagare la commissione del gas nella valuta del token solo una volta ogni pochi minuti. Attendi o paga la commissione di transazione in TON.",
            "gaslessCooldownTitle": "Attendi qualche minuto prima della prossima transazione",
            "gaslessCooldownWait": "Aspetterò",
            "gaslessCooldownPayTon": "Paga il gas in TON",
            "gaslessNotEnoughFunds": "Fondi insufficienti",
            "gaslessNotEnoughFundsMessage": "L'importo del trasferimento senza gas con la commissione è superiore al tuo saldo, prova a inviare un importo inferiore o contatta il supporto",
            "gaslessTryLater": "Riprova più tardi",
            "gaslessTryLaterMessage": "Puoi riprovare più tardi o contattare il supporto",
            "gaslessNotEnoughCoins": "{{fee}} in commissioni richieste per inviare, mancano {{missing}}",
            "notEnoughJettons": "Non abbastanza {{symbol}}",
            "jettonChange": "Il destinatario supporta solo trasferimenti {{symbol}}, cambia il destinatario o la valuta del trasferimento",
            "notEnoughGasTitle": "TON insufficienti per coprire la commissione del gas",
            "notEnoughGasMessage": "Ricarica il tuo portafoglio con TON (almeno {{diff}} TON in più è necessario) e riprova"
        },
        "changeJetton": "Passa a {{symbol}}",
        "sendAll": "Max",
        "scanQR": "scansiona codice qr",
        "sendTo": "Invia a",
        "fee": "Commissione di rete: {{fee}}",
        "feeEmpty": "Le commissioni saranno calcolate più tardi",
        "feeTitle": "Commissioni di rete",
        "feeTotalTitle": "Commissioni di rete totali",
        "purpose": "Scopo della transazione",
        "comment": "Messaggio (opzionale)",
        "commentDescription": "Il messaggio sarà visibile a tutti sulla blockchain",
        "commentRequired": "Controlla il tuo memo/tag prima di inviare",
        "commentLabel": "Messaggio",
        "checkComment": "Controlla prima di inviare",
        "confirmTitle": "Conferma transazione",
        "confirmManyTitle": "Conferma {{count}} transazioni",
        "unknown": "Operazione sconosciuta",
        "moreDetails": "Più dettagli",
        "gasFee": "Commissione gas",
        "contact": "Il tuo contatto",
        "firstTime": "Invio per la prima volta",
        "requestsToSign": "{{app}} richiede di firmare",
        "smartContract": "Operazione di smart contract",
        "txsSummary": "Totale",
        "txsTotal": "Importo totale",
        "gasDetails": "Dettagli del gas",
        "jettonGas": "Gas per l'invio di token",
        "unusualJettonsGas": "Il gas è più alto del solito",
        "unusualJettonsGasTitle": "La commissione per l'invio di token è {{amount}} TON",
        "unusualJettonsGasMessage": "La commissione di transazione dei token (Gas) è più alta del solito",
        "addressNotActive": "Questo portafoglio non ha avuto transazioni in uscita",
        "wrongJettonTitle": "Token errato",
        "wrongJettonMessage": "Stai cercando di inviare un token che non possiedi",
        "notEnoughJettonsTitle": "Token insufficienti",
        "notEnoughJettonsMessage": "Stai cercando di inviare più token di quelli che possiedi",
        "aboutFees": "Informazioni sulle commissioni",
        "aboutFeesDescription": "Le commissioni per le transazioni sulla blockchain dipendono da diversi fattori, come la congestione della rete, la dimensione della transazione, il prezzo del gas e i parametri di configurazione della blockchain. Maggiore è la domanda di elaborazione delle transazioni sulla blockchain o maggiore è la dimensione della transazione (messaggio/commento), maggiori saranno le commissioni.",
        "gaslessTransferSwitch": "Paga la commissione del gas in {{symbol}}"
    },
    "auth": {
        "phoneVerify": "Verifica telefono",
        "phoneNumber": "Numero di telefono",
        "phoneTitle": "Il tuo numero",
        "phoneSubtitle": "Invieremo un codice di verifica per verificare\nil tuo numero.",
        "codeTitle": "Inserisci il codice",
        "codeSubtitle": "Abbiamo inviato il codice di verifica a ",
        "codeHint": "Codice",
        "title": "Accedi a {{name}}",
        "message": "richiede di connettersi al tuo account portafoglio {{wallet}}",
        "hint": "Nessun fondo sarà trasferito all'app e nessun accesso alle tue monete sarà concesso.",
        "action": "Consenti",
        "expired": "Questa richiesta di autenticazione è già scaduta",
        "failed": "Autenticazione fallita",
        "completed": "Questa richiesta di autenticazione è già completata",
        "authorized": "Richiesta di autorizzazione approvata",
        "authorizedDescription": "Ora puoi tornare all'app.",
        "noExtensions": "Nessuna estensione ancora",
        "noApps": "Nessuna app connessa ancora",
        "name": "App connesse",
        "yourWallet": "Il tuo portafoglio",
        "revoke": {
            "title": "Sei sicuro di voler revocare questa app?",
            "message": "Questo distruggerà il collegamento tra il tuo portafoglio e l'app, ma puoi sempre provare a connetterti di nuovo.",
            "action": "Revoca"
        },
        "apps": {
            "title": "App di fiducia",
            "delete": {
                "title": "Eliminare questa estensione?",
                "message": "Questo distruggerà il collegamento tra il tuo portafoglio e l'estensione, ma puoi sempre provare a connetterti di nuovo."
            },
            "description": "Le applicazioni o le estensioni che hai autorizzato saranno visualizzate qui. Puoi revocare l'accesso da qualsiasi app o estensione in qualsiasi momento.",
            "installExtension": "Installa e apri l'estensione per questa applicazione",
            "moreWallets": "Più portafogli ({{count}})",
            "connectionSecureDescription": "Nessun fondo sarà trasferito all'app e nessun accesso alle tue monete sarà concesso"
        },
        "consent": "Cliccando continua accetti i nostri"
    },
    "install": {
        "title": "Richiesta di connessione",
        "message": "<strong>{{name}}</strong> vuole connettersi al tuo account",
        "action": "Installa"
    },
    "sign": {
        "title": "Richiesta di firma",
        "message": "Richiesta di firmare un messaggio",
        "hint": "Nessun fondo sarà trasferito all'app e nessun accesso alle tue monete sarà concesso.",
        "action": "Firma"
    },
    "migrate": {
        "title": "Migrare vecchi portafogli",
        "subtitle": "Se hai utilizzato portafogli obsoleti, puoi trasferire automaticamente tutti i fondi dai tuoi vecchi indirizzi.",
        "inProgress": "Migrazione dei vecchi portafogli in corso...",
        "transfer": "Trasferimento di monete da {{address}}",
        "check": "Verifica dell'indirizzo {{address}}",
        "keyStoreTitle": "Transizione a un nuovo metodo di sicurezza",
        "keyStoreSubtitle": "Vogliamo che le tue chiavi siano sempre sicure, quindi abbiamo aggiornato il modo in cui le proteggiamo. Abbiamo bisogno del tuo permesso per trasferire le tue chiavi in un nuovo archivio sicuro.",
        "failed": "Migrazione fallita"
    },
    "qr": {
        "title": "Punta la fotocamera sul codice QR",
        "requestingPermission": "Richiesta di autorizzazioni per la fotocamera in corso...",
        "noPermission": "Consenti l'accesso alla fotocamera per scansionare i codici QR",
        "requestPermission": "Apri le impostazioni",
        "failedToReadFromImage": "Impossibile leggere il codice QR dall'immagine"
    },
    "products": {
        "addNew": "Aggiungi nuovo prodotto",
        "tonConnect": {
            "errors": {
                "connection": "Errore di connessione",
                "invalidKey": "Chiave dApp non valida",
                "invalidSession": "Sessione non valida",
                "invalidTestnetFlag": "Rete non valida",
                "alreadyCompleted": "Richiesta già completata",
                "unknown": "Errore sconosciuto, riprova o contatta il supporto"
            },
            "successAuth": "Connesso"
        },
        "savings": "Risparmi",
        "accounts": "Token",
        "services": "Estensioni",
        "oldWallets": {
            "title": "Vecchi portafogli",
            "subtitle": "Premi per migrare i vecchi portafogli"
        },
        "transactionRequest": {
            "title": "Richiesta di transazione",
            "subtitle": "Premi per visualizzare la richiesta",
            "groupTitle": "Richieste di transazione",
            "wrongNetwork": "Rete sbagliata",
            "wrongFrom": "Mittente sbagliato",
            "invalidFrom": "Indirizzo del mittente non valido",
            "noConnection": "App non connessa",
            "expired": "Richiesta scaduta",
            "invalidRequest": "Richiesta non valida",
            "failedToReport": "Transazione inviata ma non è stato possibile riportarla all'app",
            "failedToReportCanceled": "Transazione annullata ma non è stato possibile riportarla all'app"
        },
        "signatureRequest": {
            "title": "Richiesta di firma",
            "subtitle": "Premi per visualizzare la richiesta"
        },
        "staking": {
            "earnings": "Guadagni",
            "title": "TON Staking",
            "balance": "Saldo di staking",
            "subtitle": {
                "join": "Guadagna fino al {{apy}}% sui tuoi TON",
                "joined": "Guadagna fino al {{apy}}%",
                "rewards": "Interesse stimato",
                "apy": "~13.3 APY del contributo",
                "devPromo": "Moltiplica le tue monete di prova"
            },
            "pools": {
                "title": "Pool di staking",
                "active": "Attivo",
                "best": "Migliore",
                "alternatives": "Alternativa",
                "private": "Pool privati",
                "restrictedTitle": "Pool ristretto",
                "restrictedMessage": "Questo pool di staking è disponibile solo per i membri del Whales Club",
                "viewClub": "Visualizza Whales Club",
                "nominators": "Nominatori",
                "nominatorsDescription": "Per tutti",
                "club": "Club",
                "clubDescription": "Per i membri del Whales Club",
                "team": "Team",
                "teamDescription": "Per i membri del team Ton Whales e i TOP 15 membri del Whales Club",
                "joinClub": "Unisciti",
                "joinTeam": "Unisciti",
                "clubBanner": "Unisciti al nostro Club",
                "clubBannerLearnMore": "Scopri di più sul nostro club",
                "clubBannerDescription": "Per i membri del nostro Whales Club",
                "teamBanner": "Unisciti al nostro Team",
                "teamBannerLearnMore": "Scopri di più sul nostro team",
                "teamBannerDescription": "Per il nostro team e i TOP 15 membri del Whales Club",
                "epnPartners": "Partner ePN",
                "epnPartnersDescription": "Unisciti a oltre 200.000 webmaster",
                "moreAboutEPN": "Info",
                "lockups": "Pool di lockups",
                "lockupsDescription": "Permette ai detentori di grandi lockups in TON di guadagnare un reddito aggiuntivo",
                "tonkeeper": "Tonkeeper",
                "tonkeeperDescription": "Portafoglio mobile amichevole su TON",
                "liquid": "Staking Liquido",
                "liquidDescription": "Invia TON allo staking e ottieni token wsTON in cambio",
                "rateTitle": "Tasso di cambio"
            },
            "transfer": {
                "stakingWarning": "Puoi sempre depositare un nuovo stake o aumentare quello esistente con qualsiasi importo. Si prega di notare che l'importo minimo è: {{minAmount}}",
                "depositStakeTitle": "Staking",
                "depositStakeConfirmTitle": "Conferma Staking",
                "withdrawStakeTitle": "Richiesta di prelievo",
                "withdrawStakeConfirmTitle": "Conferma Prelievo",
                "topUpTitle": "Ricarica",
                "topUpConfirmTitle": "Conferma Ricarica",
                "notEnoughStaked": "purtroppo non hai abbastanza monete in staking",
                "confirmWithdraw": "Richiedi Prelievo",
                "confirmWithdrawReady": "Preleva ora",
                "restrictedTitle": "Questo Pool di Staking è ristretto",
                "restrictedMessage": "I tuoi fondi non parteciperanno allo staking se il tuo indirizzo del portafoglio non è nella lista dei permessi, ma saranno nel saldo del pool e in attesa di un prelievo",
                "notEnoughCoinsFee": "Non ci sono abbastanza TON nel saldo del tuo portafoglio per pagare la commissione. Si prega di notare che la commissione di {{amount}} TON deve essere nel saldo principale, non nel saldo di staking",
                "notEnoughCoins": "Non ci sono abbastanza fondi nel saldo del tuo portafoglio per ricaricare il saldo di staking",
                "ledgerSignText": "Staking: {{action}}"
            },
            "nextCycle": "Prossimo ciclo",
            "cycleNote": "Tutte le transazioni hanno effetto una volta terminato il ciclo",
            "cycleNoteWithdraw": "La tua richiesta sarà eseguita dopo la fine del ciclo. Il prelievo dovrà essere confermato di nuovo.",
            "buttonTitle": "stake",
            "balanceTitle": "Saldo di Staking",
            "actions": {
                "deposit": "Deposito",
                "top_up": "Ricarica",
                "withdraw": "Prelievo",
                "calc": "Calcola",
                "swap": "Scambia istantaneamente"
            },
            "join": {
                "title": "Diventa un validatore TON",
                "message": "Lo staking è un bene pubblico per l'ecosistema TON. Puoi aiutare a proteggere la rete e guadagnare ricompense nel processo",
                "buttonTitle": "Inizia a Guadagnare",
                "moreAbout": "Maggiori informazioni sul Ton Whales Staking Pool",
                "earn": "Guadagna fino a",
                "onYourTons": "sui tuoi TON",
                "apy": "13.3%",
                "yearly": "APY",
                "cycle": "Ottieni ricompense per lo staking ogni 36 ore",
                "ownership": "I TON in staking rimangono tuoi",
                "withdraw": "Preleva e Ricarica in qualsiasi momento",
                "successTitle": "{{amount}} TON in staking",
                "successEtimation": "I tuoi guadagni annuali stimati sono {{amount}}\u00A0TON\u00A0(${{price}}).",
                "successNote": "I tuoi TON in staking saranno attivati una volta iniziato il prossimo ciclo."
            },
            "pool": {
                "balance": "Stake Totale",
                "members": "Nominatori",
                "profitability": "Redditività"
            },
            "empty": {
                "message": "Non hai transazioni"
            },
            "pending": "in sospeso",
            "withdrawStatus": {
                "pending": "Prelievo in sospeso",
                "ready": "Prelievo pronto",
                "withdrawNow": "Premi per prelevare ora"
            },
            "depositStatus": {
                "pending": "Deposito in sospeso"
            },
            "withdraw": "Prelievo",
            "sync": "Scaricamento dati di staking",
            "unstake": {
                "title": "Sei sicuro di voler richiedere il prelievo?",
                "message": "Si prega di notare che richiedendo il prelievo tutti i depositi in sospeso saranno restituiti."
            },
            "unstakeLiquid": {
                "title": "Preleva i tuoi wsTON",
                "message": "Puoi prelevare i fondi direttamente dopo la fine del ciclo o scambiare istantaneamente wsTON con TON su "
            },
            "learnMore": "Info",
            "moreInfo": "Maggiori informazioni",
            "calc": {
                "yearly": "Ricompense annuali",
                "monthly": "Ricompense mensili",
                "daily": "Ricompense giornaliere",
                "note": "Calcolato includendo tutte le commissioni",
                "text": "Calcolatore di guadagni",
                "yearlyTopUp": "Dopo la Ricarica",
                "yearlyTotal": "Ricompense totali in un anno",
                "yearlyCurrent": "Attuale",
                "topUpTitle": "Le tue ricompense annuali",
                "goToTopUp": "Vai alla Ricarica"
            },
            "info": {
                "rate": "fino al 13.3%",
                "rateTitle": "APY",
                "frequency": "Ogni 36 ore",
                "frequencyTitle": "Frequenza delle ricompense",
                "minDeposit": "Deposito minimo",
                "poolFee": "3.3%",
                "poolFeeTitle": "Commissione del Pool",
                "depositFee": "Commissione di Deposito",
                "withdrawFee": "Commissione di Prelievo",
                "withdrawRequestFee": "Commissione di richiesta di Prelievo",
                "withdrawCompleteFee": "Commissione di completamento del Prelievo",
                "depositFeeDescription": "Importo TON che sarà detratto dall'importo del deposito per coprire le commissioni dell'azione di deposito, l'importo non utilizzato sarà restituito al saldo del tuo portafoglio",
                "withdrawFeeDescription": "Importo TON necessario per coprire le commissioni dell'azione di prelievo, l'importo non utilizzato sarà restituito al saldo del tuo portafoglio",
                "withdrawCompleteDescription": "Importo TON necessario per coprire le commissioni dell'azione di completamento del prelievo, l'importo non utilizzato sarà restituito al saldo del tuo portafoglio",
                "blockchainFee": "Commissione blockchain",
                "cooldownTitle": "Periodo semplificato",
                "cooldownActive": "Attivo",
                "cooldownInactive": "Inattivo",
                "cooldownDescription": "Tutte le transazioni hanno effetto istantaneamente durante questo periodo",
                "cooldownAlert": "All'inizio di ogni ciclo di staking, il Periodo Semplificato è attivo. Durante questo periodo non devi aspettare la fine del ciclo per prelevare o ricaricare - avviene istantaneamente, e non devi inviare una seconda transazione per prelevare, il che dimezza la commissione di prelievo. Puoi trasferire fondi da un pool all'altro senza perdere i profitti del ciclo se il Periodo Semplificato è attivo in entrambi i pool",
                "lockedAlert": "Mentre il ciclo di staking è in corso, i prelievi e i depositi sono in sospeso. Tutte le transazioni hanno effetto una volta terminato il ciclo"
            },
            "minAmountWarning": "L'importo minimo è {{minAmount}} TON",
            "tryAgainLater": "Per favore, riprova più tardi",
            "banner": {
                "estimatedEarnings": "I tuoi guadagni annuali stimati diminuiranno di {{amount}}\u00A0TON\u00A0({{price}})",
                "estimatedEarningsDev": "I tuoi guadagni annuali stimati diminuiranno",
                "message": "Sei sicuro di voler annullare lo staking?"
            },
            "activePools": "Pool attivi",
            "analytics": {
                "operations": "Operazioni",
                "operationsDescription": "Ricarica e prelievo",
                "analyticsTitle": "Analisi",
                "analyticsSubtitle": "Profitto totale",
                "labels": {
                    "week": "1S",
                    "month": "1M",
                    "year": "1A",
                    "allTime": "Tutto"
                }
            }
        },
        "holders": {
            "title": "Conto bancario",
            "loadingLongerTitle": "Problemi di connessione",
            "loadingLonger": "Controlla la tua connessione internet e ricarica la pagina. Se il problema persiste, contatta il supporto",
            "accounts": {
                "title": "Spese",
                "prepaidTitle": "Carte prepagate",
                "account": "Conto",
                "basicAccount": "Conto di spesa",
                "proAccount": "Conto pro",
                "noCards": "Nessuna carta",
                "prepaidCard": "Tonhub Prepaid *{{lastFourDigits}}",
                "prepaidCardDescription": "Carta ricaricabile per l'uso quotidiano",
                "hiddenCards": "Carte nascoste",
                "hiddenAccounts": "Conti nascosti",
                "primaryName": "Conto principale",
                "paymentName": "Conto di pagamento {{accountIndex}}",
                "topUp": "Ricarica conto",
                "addNew": "Aggiungi account"
            },
            "pageTitles": {
                "general": "Carte Tonhub",
                "card": "Carta Tonhub",
                "cardDetails": "Dettagli della carta",
                "cardCredentials": "Dettagli della carta",
                "cardLimits": "Limiti della carta {{cardNumber}}",
                "cardLimitsDefault": "Limiti della carta",
                "cardDeposit": "Ricarica TON",
                "transfer": "Trasferimento",
                "cardSmartContract": "Smart Contract della carta",
                "setUpCard": "Configura la carta",
                "pin": "Cambia PIN"
            },
            "card": {
                "card": "Carta",
                "cards": "Carte dei titolari",
                "title": "Carta Tonhub {{cardNumber}}",
                "defaultSubtitle": "Paga con USDT o TON ovunque con la carta",
                "defaultTitle": "Carta Tonhub",
                "eurSubtitle": "Tonhub EUR",
                "type": {
                    "physical": "Carta fisica",
                    "virtual": "Virtuale"
                },
                "notifications": {
                    "type": {
                        "card_ready": "Carta attivata",
                        "deposit": "Ricarica della carta",
                        "charge": "Pagamento",
                        "charge_failed": "Pagamento",
                        "limits_change": {
                            "pending": "Cambio dei limiti in corso",
                            "completed": "Limiti cambiati"
                        },
                        "card_withdraw": "Trasferimento al portafoglio",
                        "contract_closed": "Contratto chiuso",
                        "card_block": "Carta bloccata",
                        "card_freeze": "Carta congelata",
                        "card_unfreeze": "Carta scongelata",
                        "card_paid": "Problema con la carta bancaria"
                    },
                    "category": {
                        "deposit": "Ricarica",
                        "card_withdraw": "Trasferimento",
                        "charge": "Acquisti",
                        "charge_failed": "Acquisti",
                        "other": "Altro"
                    },
                    "status": {
                        "charge_failed": {
                            "limit": {
                                "onetime": "Fallito (oltre il limite una tantum)",
                                "daily": "Fallito (oltre il limite giornaliero)",
                                "monthly": "Fallito (oltre il limite mensile)"
                            },
                            "failed": "Fallito"
                        },
                        "completed": "Completato"
                    }
                }
            },
            "confirm": {
                "title": "Sei sicuro di voler chiudere questa schermata?",
                "message": "Questa azione annullerà tutte le tue modifiche"
            },
            "enroll": {
                "poweredBy": "Basato su TON, alimentato da ZenPay",
                "description_1": "Solo tu gestisci lo smart-contract",
                "description_2": "Nessuno tranne te ha accesso ai tuoi fondi",
                "description_3": "Possiedi veramente i tuoi soldi",
                "moreInfo": "Maggiori informazioni sulla ZenPay Card",
                "buttonSub": "KYC e emissione della carta richiedono ~5 min",
                "failed": {
                    "title": "Autorizzazione fallita",
                    "noAppData": "Nessun dato dell'app",
                    "noDomainKey": "Nessuna chiave di dominio",
                    "createDomainKey": "Durante la creazione della chiave di dominio",
                    "fetchToken": "Durante il recupero del token",
                    "createSignature": "Durante la creazione della firma"
                }
            },
            "otpBanner": {
                "title": "Nuova richiesta di pagamento",
                "accept": "Accetta",
                "decline": "Rifiuta",
                "expired": "Scaduto"
            },
            "banner": {
                "fewMore": "Solo pochi altri passaggi",
                "ready": "Verifica completata! La tua carta è pronta!",
                "readyAction": "Ottienila ora",
                "emailAction": "Verifica la tua email",
                "kycAction": "Completa la verifica",
                "failedAction": "Verifica fallita"
            },
            "transaction": {
                "type": {
                    "cardReady": "Carta attivata",
                    "accountReady": "Account attivato",
                    "deposit": "Ricarica account",
                    "prepaidTopUp": "Ricarica prepagata",
                    "payment": "Pagamento",
                    "decline": "Rifiuto",
                    "refund": "Rimborso",
                    "limitsChanging": "Modifica limiti",
                    "limitsChanged": "Limiti modificati",
                    "cardWithdraw": "Trasferimento al portafoglio",
                    "contractClosed": "Contratto chiuso",
                    "cardBlock": "Carta bloccata",
                    "cardFreeze": "Carta congelata",
                    "cardUnfreeze": "Carta scongelata",
                    "cardPaid": "Emissione carta bancaria",
                    "unknown": "Sconosciuto"
                },
                "rejectReason": {
                    "approve": "n/a",
                    "generic": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "fraud_or_ban": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "not_able_to_trace_back_to_original_transaction": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "do_not_honour": "Non possiamo eseguire l'operazione per questo commerciante",
                    "card_not_effective": "La transazione è stata rifiutata perché la tua carta è attualmente bloccata. Per procedere, sblocca la tua carta tramite l'app mobile o contatta il supporto clienti per assistenza",
                    "expired_card": "La tua carta ha raggiunto la data di scadenza. Ordina una nuova carta tramite l'app mobile",
                    "incorrect_pin": "Sembra esserci un problema con il tuo PIN. Controlla i dettagli e riprova. Se il problema persiste, contatta il supporto clienti per assistenza",
                    "cvc2_or_cvv2_incorrect": "Il CVV non è corretto. Controlla il codice a tre cifre sul retro della tua carta e riprova",
                    "incorrect_expiry_date": "La data di scadenza inserita non è corretta. Controlla la data di scadenza sulla tua carta o nell'app mobile e riprova",
                    "invalid_card_number": "Il numero di carta inserito non è corretto. Controlla il numero sulla tua carta o nell'app mobile e riprova",
                    "blocked_merchant_country_code": "La tua carta non può essere utilizzata per transazioni in questo paese",
                    "insufficient_funds": "Non hai abbastanza fondi nel tuo account per completare questa transazione. Ricarica il tuo account e riprova",
                    "exceeds_contactless_payments_daily_limit": "La transazione è stata rifiutata perché supera il limite di spesa giornaliero. Contatta il supporto clienti per assistenza o riprova domani",
                    "exceeds_contactless_payments_monthly_limit": "La transazione è stata rifiutata perché supera il limite di spesa mensile. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_contactless_payments_transaction_limit": "La transazione è stata rifiutata perché supera l'importo massimo della transazione. Contatta il supporto clienti per assistenza",
                    "exceeds_contactless_payments_weekly_limit": "La transazione è stata rifiutata perché supera il limite di spesa settimanale. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_daily_overall_limit": "La transazione è stata rifiutata perché supera il limite di spesa giornaliero sulla carta. Contatta il supporto clienti per assistenza o riprova domani",
                    "exceeds_internet_purchase_payments_daily_limit": "La transazione è stata rifiutata perché supera il limite giornaliero per le transazioni internet. Contatta il supporto clienti per assistenza o riprova domani",
                    "exceeds_internet_purchase_payments_monthly_limit": "La transazione è stata rifiutata perché supera il limite mensile per le transazioni internet. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_internet_purchase_payments_transaction_limit": "La transazione è stata rifiutata perché supera l'importo massimo della transazione. Contatta il supporto clienti per assistenza",
                    "exceeds_internet_purchase_payments_weekly_limit": "La transazione è stata rifiutata perché supera il limite settimanale per le transazioni internet. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_monthly_overall_limit": "La transazione è stata rifiutata perché supera il limite di spesa mensile sulla carta. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_purchases_daily_limit": "La transazione è stata rifiutata perché supera il limite di spesa giornaliero sulla carta. Contatta il supporto clienti per assistenza o riprova domani",
                    "exceeds_purchases_monthly_limit": "La transazione è stata rifiutata perché supera il limite di spesa mensile sulla carta. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_purchases_transaction_limit": "La transazione è stata rifiutata perché supera l'importo massimo della transazione. Contatta il supporto clienti per assistenza",
                    "exceeds_purchases_weekly_limit": "La transazione è stata rifiutata perché supera il limite di spesa settimanale sulla carta. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_settlement_risk_limit": "La transazione è stata rifiutata perché supera l'importo massimo della transazione. Contatta il supporto clienti per assistenza",
                    "exceeds_weekly_overall_limit": "La transazione è stata rifiutata perché supera il limite di spesa settimanale sulla carta. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_withdrawal_amount_limit": "La transazione è stata rifiutata perché supera il limite di prelievo in contanti sulla carta. Contatta il supporto clienti per assistenza",
                    "exceeds_withdrawal_maximum_limit": "La transazione è stata rifiutata perché supera il limite di prelievo in contanti sulla carta. Contatta il supporto clienti per assistenza",
                    "exceeds_withdrawal_minimum_limit": "L'importo della transazione non è corretto",
                    "exceeds_withdrawals_daily_limit": "La transazione è stata rifiutata perché supera il limite giornaliero di prelievo in contanti sulla carta. Contatta il supporto clienti per assistenza o riprova domani",
                    "exceeds_withdrawals_monthly_limit": "La transazione è stata rifiutata perché supera il limite mensile di prelievo in contanti sulla carta. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "exceeds_withdrawals_transaction_limit": "La transazione è stata rifiutata perché supera il limite di prelievo in contanti sulla carta. Contatta il supporto clienti per assistenza o riprova domani",
                    "exceeds_withdrawals_weekly_limit": "La transazione è stata rifiutata perché supera il limite settimanale di prelievo in contanti sulla carta. Contatta il supporto clienti per assistenza o riprova più tardi",
                    "transaction_not_permitted_to_card_holder": "Tipo di transazione non supportato. Contatta il commerciante",
                    "blocked_merchant_category_code": "Non possiamo eseguire l'operazione per questo commerciante",
                    "blocked_merchant_id": "Non possiamo eseguire l'operazione per questo commerciante",
                    "blocked_merchant_name": "Non possiamo eseguire l'operazione per questo commerciante",
                    "blocked_terminal_id": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "no_card_record": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "suspected_fraud": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "token_not_effective": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "client_system_malfunction": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "system_malfunction": "Sembra esserci un problema. Riprova. Se l'errore persiste, contatta il supporto clienti per assistenza",
                    "contactless_payments_switched_off": "La transazione è stata rifiutata perché i pagamenti contactless sono attualmente disattivati sulla tua carta. Contatta il supporto clienti per assistenza",
                    "internet_purchase_payments_switched_off": "La transazione è stata rifiutata perché gli acquisti su internet sono attualmente disattivati sulla tua carta. Contatta il supporto clienti per assistenza",
                    "withdrawals_switched_off": "La transazione è stata rifiutata perché i prelievi in contanti sono attualmente disattivati sulla tua carta. Contatta il supporto clienti per assistenza",
                    "purchases_switched_off": "La transazione è stata rifiutata perché gli acquisti sono attualmente disattivati sulla tua carta. Contatta il supporto clienti per assistenza",
                    "advice_acknowledged_no_financial_liability_accepted": "Non possiamo eseguire l'operazione per questo commerciante",
                    "merchant_without_3ds": "Non possiamo eseguire l'operazione per questo commerciante"
                },
                "to": {
                    "single": "A",
                    "prepaidCard": "A carta prepagata",
                    "wallet": "A portafoglio",
                    "account": "A account"
                },
                "from": {
                    "single": "Da",
                    "prepaidCard": "Da carta prepagata",
                    "wallet": "Da portafoglio",
                    "account": "Da account"
                },
                "category": {
                    "transfers": "Prelievi",
                    "purchase": "Acquisto",
                    "cash": "Prelievi in contanti",
                    "other": "Altro",
                    "deposit": "Ricariche"
                },
                "status": {
                    "failed": "Fallito",
                    "overOnetimeFailed": "Fallito (oltre il limite per transazione)",
                    "overDailyFailed": "Fallito (oltre il limite giornaliero)",
                    "overMonthlyFailed": "Fallito (oltre il limite mensile)",
                    "complete": "Completato"
                },
                "statsBlock": {
                    "title": "Transazioni",
                    "description": "Spese in {{month}}",
                    "spent": "Speso",
                    "in": "in {{month}}"
                },
                "list": {
                    "emptyText": "Nessuna transazione ancora"
                },
                "single": {
                    "report": "Segnala un problema"
                },
                "pendingPopover": {
                    "title": "Transazione in sospeso",
                    "cancelButtonText": "Mostra dettagli della transazione",
                    "text": "La convalida della blockchain è attualmente in corso. Questo potrebbe richiedere alcuni minuti"
                }
            }
        }
    },
    "welcome": {
        "title": "Tonhub",
        "titleDev": "Ton Sandbox Wallet",
        "subtitle": "Portafoglio TON semplice e sicuro",
        "subtitleDev": "Portafoglio per sviluppatori",
        "createWallet": "Ottieni un nuovo portafoglio",
        "importWallet": "Ho già un portafoglio",
        "slogan": "Questo è il nuovo Tonhub",
        "sloganDev": "Questo è Ton Sandbox",
        "slide_1": {
            "title": "Protetto",
            "subtitle": "Contratto intelligente affidabile, Touch/Face ID con Passcode e tutte le transazioni su una blockchain decentralizzata"
        },
        "slide_2": {
            "title": "Con una fantastica carta di criptovaluta",
            "subtitle": "Ordina una carta ora. Trasferimenti interni e acquisti in pochi minuti.\nTutto questo è una carta Tonhub unica"
        },
        "slide_3": {
            "title": "Veloce",
            "subtitle": "Grazie all'architettura unica di TON, le transazioni avvengono in pochi secondi"
        }
    },
    "legal": {
        "title": "Legale",
        "subtitle": "Ho letto e accetto ",
        "create": "Crea un backup",
        "createSubtitle": "Mantieni la tua chiave privata al sicuro e non condividerla con nessuno. È l'unico modo per accedere al tuo portafoglio se il dispositivo viene perso.",
        "privacyPolicy": "Informativa sulla privacy",
        "termsOfService": "Termini di servizio"
    },
    "create": {
        "addNew": "Aggiungi nuovo portafoglio",
        "inProgress": "Creazione in corso...",
        "backupTitle": "La tua chiave di backup",
        "backupSubtitle": "Scrivi queste 24 parole esattamente nell'ordine indicato e conservale in un luogo segreto",
        "okSaved": "OK, l'ho salvato",
        "copy": "Copia negli appunti"
    },
    "import": {
        "title": "Inserisci la chiave di backup",
        "subtitle": "Per favore, ripristina l'accesso al tuo portafoglio inserendo le 24 parole segrete che hai scritto quando hai creato il portafoglio",
        "fullSeedPlaceholder": "Inserisci le 24 parole segrete",
        "fullSeedPaste": "Oppure puoi incollare la frase completa di semi dove ogni parola è separata da uno spazio"
    },
    "secure": {
        "title": "Proteggi il tuo portafoglio",
        "titleUnprotected": "Il tuo dispositivo non è protetto",
        "subtitle": "Utilizziamo la biometria per autenticare le transazioni per assicurarci che nessuno tranne te possa trasferire le tue monete.",
        "subtitleUnprotected": "È altamente consigliato abilitare il passcode sul tuo dispositivo per proteggere i tuoi beni.",
        "subtitleNoBiometrics": "È altamente consigliato abilitare la biometria sul tuo dispositivo per proteggere i tuoi beni. Utilizziamo la biometria per autenticare le transazioni per assicurarci che nessuno tranne te possa trasferire le tue monete.",
        "messageNoBiometrics": "È altamente consigliato abilitare la biometria sul tuo dispositivo per proteggere i tuoi beni.",
        "protectFaceID": "Abilita Face ID",
        "protectTouchID": "Abilita Touch ID",
        "protectBiometrics": "Abilita biometria",
        "protectPasscode": "Abilita passcode del dispositivo",
        "upgradeTitle": "Aggiornamento necessario",
        "upgradeMessage": "Per favore, consenti all'app di accedere alle chiavi del portafoglio per un aggiornamento. Nessun fondo verrà trasferito durante questo aggiornamento. Assicurati di aver eseguito il backup delle tue chiavi.",
        "allowUpgrade": "Consenti aggiornamento",
        "backup": "Backup parole segrete",
        "onLaterTitle": "Configura più tardi",
        "onLaterMessage": "Puoi configurare la protezione più tardi nelle impostazioni",
        "onLaterButton": "Configura più tardi",
        "onBiometricsError": "Errore di autenticazione con biometria",
        "lockAppWithAuth": "Autentica quando accedi all'app",
        "methodPasscode": "passcode",
        "passcodeSetupDescription": "Il codice PIN aiuta a proteggere il tuo portafoglio da accessi non autorizzati"
    },
    "backup": {
        "title": "La tua frase di recupero",
        "subtitle": "Scrivi queste 24 parole nell'ordine indicato di seguito e conservale in un luogo segreto e sicuro."
    },
    "backupIntro": {
        "title": "Esegui il backup del tuo portafoglio",
        "subtitle": "Sei sicuro di aver salvato le tue 24 parole segrete?",
        "saved": "Sì, le ho salvate",
        "goToBackup": "No, vai al backup"
    },
    "errors": {
        "incorrectWords": {
            "title": "Parole errate",
            "message": "Hai inserito parole segrete errate. Per favore, ricontrolla il tuo input e riprova."
        },
        "secureStorageError": {
            "title": "Errore di archiviazione sicura",
            "message": "Sfortunatamente non siamo in grado di salvare i dati."
        },
        "title": "Ooops",
        "invalidNumber": "No, questo non è un numero reale. Per favore, controlla il tuo input e riprova.",
        "codeTooManyAttempts": "Hai provato troppo, per favore riprova tra 15 minuti.",
        "codeInvalid": "No, il codice inserito non è valido. Controlla il codice e riprova.",
        "unknown": "Woof, è un errore sconosciuto. Non ho letteralmente idea di cosa stia succedendo. Puoi provare a spegnerlo e riaccenderlo?"
    },
    "confirm": {
        "logout": {
            "title": "Sei sicuro di voler disconnettere il tuo portafoglio da questa app e cancellare tutti i tuoi dati dall'app?",
            "message": "Questa azione comporterà la cancellazione di tutti gli account da questo dispositivo. Assicurati di aver eseguito il backup delle tue 24 parole segrete prima di procedere."
        },
        "changeCurrency": "Cambia valuta principale in {{currency}}"
    },
    "neocrypto": {
        "buttonTitle": "compra",
        "alert": {
            "title": "Come funziona il checkout",
            "message": "Compila i campi richiesti -> Seleziona la criptovaluta e specifica l'indirizzo del portafoglio e l'importo da acquistare -> Procedi al checkout -> Inserisci correttamente i tuoi dati di fatturazione. Il pagamento con carta di credito viene elaborato in modo sicuro dai nostri partner -> Completa l'acquisto. Nessun account necessario!"
        },
        "title": "Acquista TON con carta di credito per USD, EUR e RUB",
        "description": "Verrai reindirizzato a Neocrypto. I servizi relativi ai pagamenti sono forniti da Neocrypto, che è una piattaforma separata di proprietà di terzi\n\nPer favore, leggi e accetta i Termini di servizio di Neocrypto prima di utilizzare il loro servizio",
        "doNotShow": "Non mostrarlo di nuovo per Neocrypto",
        "termsAndPrivacy": "Ho letto e accetto i ",
        "confirm": {
            "title": "Sei sicuro di voler chiudere questo modulo?",
            "message": "Questa azione annullerà tutte le tue modifiche"
        }
    },
    "known": {
        "deposit": "Deposito",
        "depositOk": "Deposito accettato",
        "withdraw": "Richiesta di prelievo di {{coins}} TON",
        "withdrawAll": "Richiedi il prelievo di tutte le monete",
        "withdrawLiquid": "Preleva",
        "withdrawCompleted": "Prelievo completato",
        "withdrawRequested": "Prelievo richiesto",
        "upgrade": "Aggiorna codice a {{hash}}",
        "upgradeOk": "Aggiornamento completato",
        "cashback": "Cashback",
        "tokenSent": "Token inviato",
        "tokenReceived": "Token ricevuto",
        "holders": {
            "topUpTitle": "Importo di ricarica",
            "accountTopUp": "Ricarica di {{amount}} TON",
            "accountJettonTopUp": "Ricarica account",
            "limitsChange": "Cambio limiti",
            "limitsTitle": "Limiti",
            "limitsOneTime": "Per transazione",
            "limitsDaily": "Giornaliero",
            "limitsMonthly": "Mensile",
            "accountLimitsChange": "Cambio limiti account"
        }
    },
    "jetton": {
        "token": "token",
        "productButtonTitle": "Token",
        "productButtonSubtitle": "{{jettonName}} e {{count}} altri",
        "hidden": "Token nascosti",
        "liquidPoolDescriptionDedust": "Liquidità per {{name0}}/{{name1}} su DeDust DEX",
        "liquidPoolDescriptionStonFi": "Liquidità per {{name0}}/{{name1}} su STON.fi DEX",
        "emptyBalance": "Saldo vuoto",
        "jettonsNotFound": "Nessun token trovato"
    },
    "connections": {
        "extensions": "Estensioni",
        "connections": "Connessioni"
    },
    "accounts": {
        "active": "Attivo",
        "noActive": "Nessun account attivo",
        "disabled": "Nascosto",
        "alertActive": "Segna {{symbol}} attivo",
        "alertDisabled": "Segna {{symbol}} nascosto",
        "description": "Per cambiare lo stato di un account, premi a lungo il pulsante dell'account nella schermata principale o premi in questo menu. L'account verrà aggiunto alla schermata principale o nascosto.",
        "noAccounts": "Non hai ancora account"
    },
    "spamFilter": {
        "minAmount": "Importo minimo TON",
        "dontShowComments": "Non mostrare commenti sulle transazioni SPAM",
        "minAmountDescription": "Le transazioni con importo TON inferiore a {{amount}} saranno automaticamente contrassegnate come SPAM",
        "applyConfig": "Applica le impostazioni del filtro SPAM selezionate",
        "denyList": "Filtro spam manuale",
        "denyListEmpty": "Nessun indirizzo bloccato",
        "unblockConfirm": "Sblocca indirizzo",
        "blockConfirm": "Segna indirizzo come spam",
        "description": "Puoi facilmente aggiungere l'indirizzo alla lista degli indirizzi bloccati manualmente se clicchi su qualsiasi transazione o indirizzo e selezioni l'opzione \"Segna indirizzo come spam\" nel menu a comparsa"
    },
    "security": {
        "title": "Sicurezza",
        "passcodeSettings": {
            "setupTitle": "Configura codice PIN",
            "confirmTitle": "Conferma codice PIN",
            "changeTitle": "Cambia codice PIN",
            "resetTitle": "Reimposta codice PIN",
            "resetDescription": "Se hai dimenticato il tuo codice PIN, puoi reimpostarlo inserendo le 24 parole segrete che hai scritto quando hai creato il portafoglio.",
            "resetAction": "Reimposta",
            "error": "Codice PIN errato",
            "tryAgain": "Riprova",
            "success": "Codice PIN impostato con successo",
            "enterNew": "Crea codice PIN",
            "confirmNew": "Conferma nuovo codice PIN",
            "enterCurrent": "Inserisci il tuo codice PIN",
            "enterPrevious": "Inserisci il codice PIN attuale",
            "enterNewDescription": "Impostare una password fornisce un ulteriore livello di sicurezza quando si utilizza l'applicazione",
            "changeLength": "Usa codice PIN a {{length}} cifre",
            "forgotPasscode": "Hai dimenticato il codice PIN?",
            "logoutAndReset": "Esci e reimposta il codice PIN"
        },
        "auth": {
            "biometricsPermissionCheck": {
                "title": "Permesso richiesto",
                "message": "Per favore, consenti all'app di accedere alla biometria per l'autenticazione",
                "openSettings": "Apri impostazioni",
                "authenticate": "Autentica con Passcode"
            },
            "biometricsSetupAgain": {
                "title": "Nuova biometria rilevata",
                "message": "Per favore, configura di nuovo la biometria nelle impostazioni di sicurezza",
                "setup": "Configura",
                "authenticate": "Continua con Passcode"
            },
            "biometricsCooldown": {
                "title": "Raffreddamento biometrico",
                "message": "Per favore, riprova più tardi, o blocca il tuo dispositivo e sbloccalo di nuovo con il passcode del dispositivo per abilitare la biometria"
            },
            "biometricsCorrupted": {
                "title": "Biometria corrotta e nessun codice PIN impostato",
                "message": "Sfortunatamente, il tuo portafoglio non è più disponibile, per ripristinare il tuo portafoglio, tocca \"Ripristina\" (verrai disconnesso dal tuo portafoglio attuale) e inserisci le tue 24 parole segrete",
                "messageLogout": "Sfortunatamente, il tuo portafoglio non è più disponibile, per ripristinare il tuo portafoglio, tocca \"Esci\" (verrai disconnesso dal tuo portafoglio attuale) e aggiungi di nuovo il tuo portafoglio",
                "logout": "Esci",
                "restore": "Ripristina"
            },
            "canceled": {
                "title": "Annullato",
                "message": "L'autenticazione è stata annullata, per favore riprova"
            }
        }
    },
    "report": {
        "title": "Segnala",
        "scam": "truffa",
        "bug": "bug",
        "spam": "spam",
        "offense": "contenuto offensivo",
        "posted": "Il tuo rapporto è stato inviato",
        "error": "Errore nell'invio del rapporto",
        "message": "Messaggio (obbligatorio)",
        "reason": "Motivo del rapporto"
    },
    "review": {
        "title": "Recensione estensione",
        "rating": "valutazione",
        "review": "Recensione (opzionale)",
        "heading": "Titolo",
        "error": "Errore nella pubblicazione della recensione",
        "posted": "Grazie per il tuo feedback!",
        "postedDescription": "La tua recensione sarà pubblicata dopo la moderazione"
    },
    "deleteAccount": {
        "title": "Sei sicuro di voler eliminare l'account?",
        "action": "Elimina account e tutti i dati",
        "logOutAndDelete": "Esci e elimina tutti i dati",
        "description": "Questa azione eliminerà tutti i dati e il portafoglio attualmente selezionato da questo dispositivo e il tuo account blockchain\nDevi trasferire tutte le tue monete TON a un altro portafoglio. Prima di procedere, assicurati di avere più di {{amount}} TON sul tuo account per completare la transazione",
        "complete": "Eliminazione dell'account completata",
        "error": {
            "hasNfts": "Hai NFT nel tuo portafoglio, per eliminare l'account, per favore inviali a un altro portafoglio.",
            "fetchingNfts": "Non è stato possibile determinare se ci sono NFT nel portafoglio. Per eliminare l'account, assicurati che non ci siano NFT su di esso.",
            "hasUSDTBalanceTitle": "Hai un saldo USDT nel tuo portafoglio",
            "hasUSDTBalanceMessage": "Per eliminare l'account, per favore inviali a un altro portafoglio."
        },
        "confirm": {
            "title": "Sei sicuro di voler eliminare il tuo account e tutti i dati da questa applicazione?",
            "message": "Questa azione eliminerà il tuo account e tutti i dati da questa applicazione e trasferirà tutte le tue monete TON all'indirizzo del portafoglio che hai specificato.\nPer favore, controlla attentamente l'indirizzo del destinatario prima di procedere. Viene addebitata una commissione standard per questa transazione."
        },
        "checkRecipient": "Controlla destinatario",
        "checkRecipientDescription": "Per rendere il tuo account inattivo devi trasferire tutti i fondi a un altro portafoglio (indirizzo del destinatario). Per favore, controlla attentamente l'indirizzo prima di procedere"
    },
    "logout": {
        "title": "Sei sicuro di voler uscire da {{name}}?",
        "logoutDescription": "L'accesso al portafoglio sarà disabilitato. Hai salvato la tua chiave privata?"
    },
    "contacts": {
        "title": "Contatti",
        "contact": "Contatto",
        "unknown": "Sconosciuto",
        "contacts": "I miei contatti",
        "name": "Nome",
        "lastName": "Cognome",
        "company": "Azienda",
        "add": "Aggiungi Contatto",
        "edit": "Modifica",
        "save": "Salva",
        "notes": "Note",
        "alert": {
            "name": "Nome non corretto",
            "nameDescription": "Il nome del contatto non può essere vuoto o più lungo di 126 caratteri",
            "notes": "Campo non corretto",
            "notesDescription": "I campi del contatto non possono essere più lunghi di 280 caratteri"
        },
        "delete": "Elimina contatto",
        "empty": "Nessun contatto ancora",
        "description": "Puoi aggiungere un indirizzo ai tuoi contatti tenendo premuto su qualsiasi transazione o indirizzo o utilizzando il pulsante \"Aggiungi\" o dall'elenco dei contatti recenti qui sotto",
        "contactAddress": "Indirizzo dei contatti",
        "search": "Nome o indirizzo del portafoglio",
        "new": "Nuovo contatto"
    },
    "currency": {
        "USD": "Dollaro statunitense",
        "EUR": "Euro",
        "RUB": "Rublo russo",
        "GBP": "Sterlina britannica",
        "CHF": "Franco svizzero",
        "CNY": "Yuan cinese",
        "KRW": "Won sudcoreano",
        "IDR": "Rupia indonesiana",
        "INR": "Rupia indiana",
        "JPY": "Yen giapponese"
    },
    "txActions": {
        "addressShare": "Condividi indirizzo",
        "addressContact": "Aggiungi indirizzo ai contatti",
        "addressContactEdit": "Modifica contatto indirizzo",
        "addressMarkSpam": "Segna indirizzo come spam",
        "txShare": "Condividi transazione",
        "txRepeat": "Ripeti transazione",
        "view": "Visualizza in explorer",
        "share": {
            "address": "Indirizzo TON",
            "transaction": "Transazione TON"
        }
    },
    "hardwareWallet": {
        "ledger": "Ledger",
        "title": "Connetti Ledger",
        "description": "Il tuo portafoglio hardware Ledger",
        "installationIOS": "Sblocca Ledger, connettilo al tuo smartphone tramite Bluetooth e consenti l'accesso a Tonhub.",
        "installationAndroid": "Sblocca Ledger, connettilo al tuo smartphone tramite Bluetooth o cavo USB e consenti l'accesso a Tonhub.",
        "installationGuide": "Guida alla connessione di TON ledger",
        "connectionDescriptionAndroid": "Connetti il tuo Ledger tramite USB o Bluetooth",
        "connectionDescriptionIOS": "Connetti il tuo Ledger tramite Bluetooth",
        "connectionHIDDescription_1": "1. Accendi il tuo ledger e sbloccalo",
        "connectionHIDDescription_2": "2. Premi \"Continua\"",
        "openTheAppDescription": "Apri l'app TON sul tuo Ledger",
        "unlockLedgerDescription": "Sblocca il tuo Ledger",
        "chooseAccountDescription": "Seleziona l'account che vuoi utilizzare",
        "bluetoothScanDescription_1": "1. Accendi il tuo ledger e sbloccalo",
        "bluetoothScanDescription_2": "2. Assicurati di avere il Bluetooth abilitato",
        "bluetoothScanDescription_3": "3. Premi \"Scansiona\" per cercare dispositivi disponibili e seleziona il Ledger Nano X adatto",
        "bluetoothScanDescription_3_and": "3. Premi \"Scansiona\" per cercare dispositivi disponibili (avremo bisogno dell'accesso ai dati di posizione del dispositivo e del permesso di cercare dispositivi nelle vicinanze)",
        "bluetoothScanDescription_4_and": "4. Quindi seleziona il Ledger Nano X adatto",
        "openAppVerifyAddress": "Controlla l'indirizzo dell'account che hai selezionato e verifica l'indirizzo con l'app Ledger Ton quando richiesto",
        "devices": "I tuoi dispositivi",
        "connection": "Connessione",
        "actions": {
            "connect": "Connetti Ledger",
            "selectAccount": "Seleziona account",
            "account": "Account #{{account}}",
            "loadAddress": "Verifica indirizzo",
            "connectHid": "Connetti Ledger via USB",
            "connectBluetooth": "Connetti Ledger via Bluetooth",
            "scanBluetooth": "Scansiona di nuovo",
            "confirmOnLedger": "Verifica su Ledger",
            "sending": "In attesa della transazione",
            "sent": "Transazione inviata",
            "mainAddress": "Indirizzo principale",
            "givePermissions": "Dai permessi"
        },
        "confirm": {
            "add": "Sei sicuro di voler aggiungere questa app?",
            "remove": "Sei sicuro di voler rimuovere questa app?"
        },
        "errors": {
            "bleTitle": "Errore Bluetooth",
            "noDevice": "Nessun dispositivo trovato",
            "appNotOpen": "L'app Ton non è aperta su Ledger",
            "turnOnBluetooth": "Per favore, accendi il Bluetooth e riprova",
            "lostConnection": "Connessione persa con Ledger",
            "transactionNotFound": "Transazione non trovata",
            "transactionRejected": "Transazione rifiutata",
            "transferFailed": "Trasferimento fallito",
            "permissions": "Per favore, consenti l'accesso a Bluetooth e posizione",
            "unknown": "Errore sconosciuto",
            "reboot": "Per favore, riavvia il tuo dispositivo e riprova",
            "turnOnLocation": "Per favore, accendi i servizi di localizzazione e riprova, questo è necessario per scansionare i dispositivi nelle vicinanze",
            "locationServicesUnauthorized": "Servizi di localizzazione non autorizzati",
            "bluetoothScanFailed": "Scansione Bluetooth fallita"
        },
        "moreAbout": "Maggiori informazioni su Ledger"
    },
    "devTools": {
        "switchNetwork": "Rete",
        "switchNetworkAlertTitle": "Passaggio alla rete {{network}}",
        "switchNetworkAlertMessage": "Sei sicuro di voler cambiare rete?",
        "switchNetworkAlertAction": "Cambia",
        "copySeed": "Copia la frase seed di 24 parole",
        "copySeedAlertTitle": "Copia della frase seed di 24 parole negli appunti",
        "copySeedAlertMessage": "ATTENZIONE! Copiare la frase seed di 24 parole negli appunti non è sicuro. Procedi a tuo rischio.",
        "copySeedAlertAction": "Copia",
        "holdersOfflineApp": "App Offline Holders"
    },
    "wallets": {
        "choose_versions": "Scegli i portafogli da aggiungere",
        "switchToAlertTitle": "Passaggio a {{wallet}}",
        "switchToAlertMessage": "Sei sicuro di voler cambiare portafogli?",
        "switchToAlertAction": "Cambia",
        "addNewTitle": "Aggiungi portafoglio",
        "addNewAlertTitle": "Aggiunta di un nuovo portafoglio",
        "addNewAlertMessage": "Sei sicuro di voler aggiungere un nuovo portafoglio?",
        "addNewAlertAction": "Aggiungi",
        "alreadyExistsAlertTitle": "Il portafoglio esiste già",
        "alreadyExistsAlertMessage": "Un portafoglio con questo indirizzo esiste già",
        "settings": {
            "changeAvatar": "Cambia avatar",
            "selectAvatarTitle": "Immagine",
            "selectColorTitle": "Colore di sfondo"
        }
    },
    "webView": {
        "checkInternetAndReload": "Per favore, controlla la connessione internet e prova a ricaricare la pagina",
        "contactSupportOrTryToReload": "Contatta il supporto o prova a ricaricare la pagina",
        "contactSupport": "Contatta il supporto"
    },
    "appAuth": {
        "description": "Per continuare ad accedere all'app"
    },
    "screenCapture": {
        "title": "Wow, bello screenshot, ma non è sicuro",
        "description": "Le copie digitali non crittografate della tua frase segreta NON sono raccomandate. Esempi includono il salvataggio di copie sul computer, su account online o facendo screenshot",
        "action": "OK, mi assumo il rischio"
    },
    "onboarding": {
        "avatar": "Qui puoi cambiare l'avatar e il nome dei tuoi portafogli",
        "wallet": "Qui puoi aggiungere nuovi portafogli o passare da un portafoglio all'altro",
        "price": "Qui puoi cambiare la tua valuta principale"
    },
    "newAddressFormat": {
        "title": "Formato indirizzo",
        "fragmentTitle": "Nuovo tipo di indirizzi",
        "learnMore": "Maggiori informazioni sui nuovi indirizzi",
        "shortDescription": "L'aggiornamento dell'indirizzo renderà la blockchain TON ancora più sicura e stabile. Tutti gli asset inviati al tuo vecchio indirizzo continueranno a fluire nel tuo portafoglio.",
        "description_0_0": "Recentemente, TON ",
        "description_0_link": "ha annunciato questo aggiornamento",
        "description_0_1": " agli indirizzi e ha chiesto a tutti i portafogli di supportarlo.",
        "title_1": "Perché?",
        "description_1": "L'aggiornamento consente agli sviluppatori di distinguere tra indirizzi di portafogli e contratti ed evitare errori durante l'invio di transazioni.",
        "title_2": "Cosa devi fare?",
        "description_2": "Clicca sul pulsante nella schermata precedente e autorizzaci a visualizzare tutti gli indirizzi nell'app nel nuovo formato. Potrai tornare al vecchio formato nelle impostazioni.",
        "title_3": "Cosa succede al vecchio indirizzo?",
        "description_3": "Tutti i TON, token, NFT e altri asset inviati al tuo vecchio indirizzo continueranno a fluire nel tuo portafoglio.",
        "description_4": "I dettagli tecnici dell'aggiornamento possono essere trovati su",
        "action": "Usa {{format}}",
        "oldAddress": "Vecchio indirizzo",
        "newAddress": "Nuovo indirizzo",
        "bannerTitle": "Aggiorna il tuo indirizzo",
        "bannerDescription": "Da EQ a UQ"
    },
    "changelly": {
        "bannerTitle": "Depositi USDT e USDC",
        "bannerDescription": "Disponibili Tron, Solana, Ethereum, Polygon!"
    },
    "w5": {
        "banner": {
            "title": "Aggiungi portafoglio W5",
            "description": "Trasferisci USDT senza gas"
        },
        "update": {
            "title": "Aggiorna portafoglio a W5",
            "subtitle_1": "Trasferimenti USDT senza gas",
            "description_1": "Non hai più bisogno di TON per inviare USDT. Le commissioni di transazione possono essere coperte con il saldo dei tuoi token.",
            "subtitle_2": "Risparmia sulle commissioni",
            "description_2": "W5 consente di aumentare il numero di operazioni in una singola transazione di 60 volte e risparmiare significativamente sulle commissioni.",
            "subtitle_3": "La tua frase seed è invariata",
            "description_3": "I portafogli V4 e W5 hanno la stessa frase seed. Puoi sempre cambiare versione selezionando l'indirizzo desiderato nella parte superiore della schermata principale.",
            "switch_button": "Passa a W5"
        },
        "gaslessInfo": "TON non è richiesto per pagare la commissione del gas quando si invia questo token. La commissione verrà detratta direttamente dal saldo dei tuoi token."
    },
    "browser": {
        "listings": {
            "categories": {
                "other": "Altro",
                "exchange": "Scambi",
                "defi": "DeFi",
                "nft": "NFT",
                "games": "Giochi",
                "social": "Social",
                "utils": "Utilità",
                "services": "Servizi"
            },
            "title": "Per te"
        },
        "refresh": "Ricarica",
        "back": "Indietro",
        "forward": "Avanti",
        "share": "Condividi",
        "search": {
            "placeholder": "Cerca",
            "invalidUrl": "URL non valido",
            "urlNotReachable": "URL non raggiungibile",
            "suggestions": {
                "web": "Cerca in {{engine}}",
                "ddg": "DuckDuckGo",
                "google": "Google"
            }
        },
        "alertModal": {
            "message": "Stai per aprire un'applicazione web di terze parti. Non siamo responsabili per il contenuto o la sicurezza delle app di terze parti.",
            "action": "Apri"
        }
    },
    "swap": {
        "title": "DeDust.io — AMM DEX su The Open Network",
        "description": "Stai per utilizzare un servizio Dedust.io gestito da una parte indipendente non affiliata con Tonhub\nDevi accettare i Termini di utilizzo e l'Informativa sulla privacy per continuare",
        "termsAndPrivacy": "Ho letto e accetto i ",
        "dontShowTitle": "Non mostrarlo di nuovo per DeDust.io"
    },
    "mandatoryAuth": {
        "title": "Controlla il tuo backup",
        "description": "Abilita la verifica all'apertura di un portafoglio. Questo aiuterà a mantenere al sicuro i dettagli della tua carta bancaria.",
        "alert": "Scrivi le 24 parole segrete nella sezione Sicurezza delle impostazioni del tuo portafoglio. Questo ti aiuterà a recuperare l'accesso se perdi il telefono o dimentichi il codice PIN.",
        "confirmDescription": "Ho scritto le 24 parole segrete del mio portafoglio e le ho salvate in un luogo sicuro",
        "action": "Abilita",
        "settingsDescription": "La richiesta di autenticazione è necessaria poiché l'app visualizza prodotti bancari. I dati sensibili saranno nascosti fino a quando non attiverai l'autenticazione"
    },
    "update": {
        "callToAction": "Aggiorna Tonhub"
    },
    "savings": {
        "ton": "Conto di risparmio TON",
        "usdt": "Conto di risparmio USDT"
    },
    "spending": {
        "ton": "Conto di spesa TON",
        "usdt": "Conto di spesa USDT"
    }
};

export default schema;
