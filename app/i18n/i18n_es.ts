import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, "" | "_plural"> = {
    "lang": "es",
    "common": {
        "and": "y",
        "accept": "Aceptar",
        "start": "Comenzar",
        "continue": "Continuar",
        "continueAnyway": "Continuar de todos modos",
        "back": "Atrás",
        "logout": "Cerrar sesión",
        "logoutFrom": "Cerrar sesión de {{name}}",
        "cancel": "Cancelar",
        "balance": "Saldo",
        "totalBalance": "Saldo total",
        "walletAddress": "Dirección de la billetera",
        "recipientAddress": "Dirección del destinatario",
        "recipient": "Destinatario",
        "copy": "Copiar",
        "copiedAlert": "Copiado al portapapeles",
        "copied": "Copiado",
        "share": "Compartir",
        "send": "Enviar",
        "yes": "Sí",
        "no": "No",
        "amount": "Cantidad",
        "today": "Hoy",
        "yesterday": "Ayer",
        "comment": "Comentario",
        "products": "Productos",
        "confirm": "Confirmar",
        "soon": "pronto",
        "in": "en",
        "max": "Máximo",
        "close": "Cerrar",
        "delete": "Eliminar",
        "apply": "Aplicar",
        "domainOrAddress": "Dirección de billetera o dominio",
        "domainOrAddressOrContact": "Dirección, dominio o nombre",
        "domain": "Dominio",
        "search": "Buscar",
        "termsOfService": "Términos\u00A0De\u00A0Servicio",
        "privacyPolicy": "Política\u00A0De\u00A0Privacidad",
        "apy": "APY",
        "tx": "Transacción",
        "add": "Agregar",
        "connect": "Conectar",
        "gotIt": "Entendido",
        "error": "Error",
        "wallet": "Billetera",
        "wallets": "Billeteras",
        "later": "Más tarde",
        "select": "Seleccionar",
        "show": "Mostrar",
        "hide": "Ocultar",
        "showAll": "Mostrar todo",
        "hideAll": "Ocultar todo",
        "done": "Hecho",
        "mainWallet": "Billetera principal",
        "walletName": "Nombre de la billetera",
        "from": "De",
        "to": "A",
        "transaction": "Transacción",
        "somethingWentWrong": "Algo salió mal",
        "checkInternetConnection": "Verifique su conexión a internet",
        "reload": "Recargar",
        "errorOccurred": "Ocurrió un error: {{error}}",
        "recent": "Reciente",
        "ok": "OK",
        "attention": "Atención",
        "save": "Guardar",
        "assets": "Activos",
        "message": "Mensaje",
        "messages": "Mensajes",
        "airdrop": "Airdrop",
        "myWallets": "Mis billeteras",
        "showMore": "Mostrar más",
        "balances": "Saldos",
        "loading": "Cargando...",
        "notFound": "No encontrado",
        "unverified": "No verificado",
        "addressBook": "Libreta de direcciones",
        "gasless": "Sin gas",
        "address": "Dirección",
        "currencyChanged": "Moneda cambiada",
        "required": "requerido"
    },
    "syncStatus": {
        "connecting": "Conectando",
        "updating": "Actualizando",
        "online": "Conectado"
    },
    "home": {
        "home": "Inicio",
        "history": "Historial",
        "browser": "Navegador",
        "more": "Más"
    },
    "settings": {
        "title": "Más",
        "backupKeys": "Respaldar claves",
        "holdersAccounts": "Cuentas de gastos",
        "migrateOldWallets": "Migrar billeteras antiguas",
        "termsOfService": "Términos de Servicio",
        "privacyPolicy": "Política de privacidad",
        "developerTools": "Herramientas de desarrollador",
        "spamFilter": "Filtro de SPAM",
        "primaryCurrency": "Moneda principal",
        "experimental": "Experimental",
        "support": {
            "title": "Soporte",
            "telegram": "Telegram",
            "form": "Formulario de soporte",
            "holders": "Tarjeta bancaria y cuentas",
            "tonhub": "Tonhub"
        },
        "telegram": "Telegram",
        "rateApp": "Calificar aplicación",
        "deleteAccount": "Eliminar cuenta",
        "theme": "Tema",
        "searchEngine": "Motor de búsqueda",
        "language": "Idioma"
    },
    "theme": {
        "title": "Tema",
        "light": "Claro",
        "dark": "Oscuro",
        "system": "Sistema"
    },
    "wallet": {
        "sync": "Descargando datos de la billetera",
        "balanceTitle": "Saldo de Ton",
        "actions": {
            "receive": "Recibir",
            "send": "Enviar",
            "buy": "Comprar",
            "swap": "Intercambiar",
            "deposit": "Depositar"
        },
        "empty": {
            "message": "No tienes transacciones",
            "receive": "Recibir TON",
            "description": "Haz tu primera transacción"
        },
        "pendingTransactions": "Transacciones pendientes"
    },
    "transactions": {
        "title": "Transacciones",
        "history": "Historial",
        "filter": {
            "holders": "Tarjetas",
            "ton": "Transacciones de la billetera",
            "any": "Todo",
            "type": "Tipo",
            "accounts": "Gastos"
        }
    },
    "tx": {
        "sending": "Enviando",
        "sent": "Enviado",
        "received": "Recibido",
        "bounced": "Rebotado",
        "tokenTransfer": "Transferencia de token",
        "airdrop": "Airdrop",
        "failed": "Fallido",
        "timeout": "Tiempo agotado",
        "batch": "Lote"
    },
    "txPreview": {
        "sendAgain": "Enviar de nuevo",
        "blockchainFee": "Tarifa de red",
        "blockchainFeeDescription": "Esta tarifa también se conoce como GAS. Es necesaria para que una transacción se procese con éxito en la blockchain. El tamaño del GAS depende de la cantidad de trabajo que los validadores necesitan hacer para incluir una transacción en el bloque."
    },
    "receive": {
        "title": "Recibir",
        "subtitle": "Envía solo Toncoin y tokens en la red TON a esta dirección, o podrías perder tus fondos.",
        "share": {
            "title": "Mi dirección de Tonhub",
            "error": "No se pudo compartir la dirección, por favor intente de nuevo o contacte al soporte"
        },
        "holdersJettonWarning": "Transfiera a esta dirección solo {{symbol}}, si envía otro token, lo perderá.",
        "assets": "Tokens y Cuentas",
        "fromExchange": "Desde un intercambio",
        "otherCoins": "Otros tokens",
        "deposit": "Depositar en"
    },
    "transfer": {
        "title": "Enviar",
        "titleAction": "Acción",
        "confirm": "¿Estás seguro de que quieres continuar?",
        "error": {
            "invalidAddress": "Dirección inválida",
            "invalidAddressMessage": "Por favor verifique la dirección del destinatario",
            "invalidAmount": "Cantidad inválida",
            "invalidDomain": "Dominio inválido",
            "invalidDomainString": "Mínimo 4 caracteres, máximo 126 caracteres. Se permiten letras latinas (a-z), números (0-9) y un guion (-). Un guion no puede estar al principio o al final.",
            "sendingToYourself": "No puedes enviarte monedas a ti mismo",
            "zeroCoins": "Desafortunadamente no puedes enviar cero monedas",
            "zeroCoinsAlert": "Estás intentando enviar cero monedas",
            "notEnoughCoins": "No tienes suficientes fondos en tu saldo",
            "addressIsForTestnet": "Esta dirección es para testnet",
            "addressCantReceive": "Esta dirección no puede recibir monedas",
            "addressIsNotActive": "Esta billetera no tiene historial",
            "addressIsNotActiveDescription": "Esto significa que no se han realizado transacciones desde esta dirección de billetera",
            "invalidTransaction": "Transacción inválida",
            "invalidTransactionMessage": "Por favor verifique los detalles de la transacción",
            "memoRequired": "Agregue un memo/etiqueta para evitar perder fondos",
            "holdersMemoRequired": "Etiqueta/MEMO",
            "memoChange": "Cambiar memo/etiqueta a \"{{memo}}\"",
            "gaslessFailed": "No se pudo enviar la transacción",
            "gaslessFailedMessage": "Por favor intente de nuevo o contacte al soporte",
            "gaslessFailedEstimate": "No se pudo estimar las tarifas, por favor intente de nuevo más tarde o contacte al soporte",
            "gaslessCooldown": "Solo puedes pagar la tarifa de gas en la moneda del token una vez cada pocos minutos. Por favor espera o paga la tarifa de transacción en TON.",
            "gaslessCooldownTitle": "Espera unos minutos antes de la próxima transacción",
            "gaslessCooldownWait": "Esperaré",
            "gaslessCooldownPayTon": "Pagar gas en TON",
            "gaslessNotEnoughFunds": "Fondos insuficientes",
            "gaslessNotEnoughFundsMessage": "La cantidad de transferencia sin gas con tarifa es mayor que tu saldo, intenta enviar una cantidad menor o contacta al soporte",
            "gaslessTryLater": "Intenta de nuevo más tarde",
            "gaslessTryLaterMessage": "Puedes intentar de nuevo más tarde o contactar al soporte",
            "gaslessNotEnoughCoins": "{{fee}} en tarifas requeridas para enviar, faltan {{missing}}",
            "notEnoughJettons": "No hay suficientes {{symbol}}",
            "jettonChange": "El destinatario solo admite transferencias de {{symbol}}, por favor cambia el destinatario o la moneda de transferencia",
            "notEnoughGasTitle": "No tienes suficientes TON para cubrir la tarifa de gas",
            "notEnoughGasMessage": "Por favor recarga tu billetera con TON (se necesita al menos {{diff}} TON más) e intenta de nuevo"
        },
        "changeJetton": "Cambiar a {{symbol}}",
        "sendAll": "Máximo",
        "scanQR": "escanear código qr",
        "sendTo": "Enviar a",
        "fee": "Tarifa de red: {{fee}}",
        "feeEmpty": "Las tarifas se calcularán más tarde",
        "feeTitle": "Tarifas de red",
        "feeTotalTitle": "Tarifas totales de red",
        "purpose": "Propósito de la transacción",
        "comment": "Mensaje (opcional)",
        "commentDescription": "El mensaje será visible para todos en la blockchain",
        "commentRequired": "Verifica tu memo/etiqueta antes de enviar",
        "commentLabel": "Mensaje",
        "checkComment": "Verificar antes de enviar",
        "confirmTitle": "Confirmar transacción",
        "confirmManyTitle": "Confirmar {{count}} transacciones",
        "unknown": "Operación desconocida",
        "moreDetails": "Más detalles",
        "gasFee": "Tarifa de gas",
        "contact": "Tu contacto",
        "firstTime": "Enviando por primera vez",
        "requestsToSign": "{{app}} solicita firmar",
        "smartContract": "Operación de contrato inteligente",
        "txsSummary": "Total",
        "txsTotal": "Cantidad total",
        "gasDetails": "Detalles del gas",
        "jettonGas": "Gas para enviar tokens",
        "unusualJettonsGas": "El gas es más alto de lo habitual",
        "unusualJettonsGasTitle": "La tarifa por enviar tokens es de {{amount}} TON",
        "unusualJettonsGasMessage": "La tarifa de transacción de tokens (Gas) es más alta de lo habitual",
        "addressNotActive": "Esta billetera no tuvo transacciones salientes",
        "wrongJettonTitle": "Token incorrecto",
        "wrongJettonMessage": "Estás intentando enviar un token que no tienes",
        "notEnoughJettonsTitle": "No hay suficientes tokens",
        "notEnoughJettonsMessage": "Estás intentando enviar más tokens de los que tienes",
        "aboutFees": "Sobre las tarifas",
        "aboutFeesDescription": "Las tarifas para transacciones en la blockchain dependen de varios factores, como la congestión de la red, el tamaño de la transacción, el precio del gas y los parámetros de configuración de la blockchain. Cuanto mayor sea la demanda de procesamiento de transacciones en la blockchain o mayor sea el tamaño de la transacción (mensaje/comentario), mayores serán las tarifas.",
        "gaslessTransferSwitch": "Pagar tarifa de gas en {{symbol}}"
    },
    "auth": {
        "phoneVerify": "Verificar teléfono",
        "phoneNumber": "Número de teléfono",
        "phoneTitle": "Tu número",
        "phoneSubtitle": "Enviaremos un código de verificación para verificar\ntu número.",
        "codeTitle": "Ingresar código",
        "codeSubtitle": "Enviamos un código de verificación a ",
        "codeHint": "Código",
        "title": "Iniciar sesión en {{name}}",
        "message": "solicita conectarse a tu cuenta de billetera {{wallet}}",
        "hint": "No se transferirán fondos a la aplicación y no se otorgará acceso a tus monedas.",
        "action": "Permitir",
        "expired": "Esta solicitud de autenticación ya expiró",
        "failed": "Autenticación fallida",
        "completed": "Esta solicitud de autenticación ya se completó",
        "authorized": "Solicitud de autorización aprobada",
        "authorizedDescription": "Ahora puedes volver a la aplicación.",
        "noExtensions": "Aún no hay extensiones",
        "noApps": "Aún no hay aplicaciones conectadas",
        "name": "Aplicaciones conectadas",
        "yourWallet": "Tu billetera",
        "revoke": {
            "title": "¿Estás seguro de que quieres revocar esta aplicación?",
            "message": "Esto destruirá el enlace entre tu billetera y la aplicación, pero siempre puedes intentar conectarte de nuevo.",
            "action": "Revocar"
        },
        "apps": {
            "title": "Aplicaciones de confianza",
            "delete": {
                "title": "¿Eliminar esta extensión?",
                "message": "Esto destruirá el enlace entre tu billetera y la extensión, pero siempre puedes intentar conectarte de nuevo."
            },
            "description": "Las aplicaciones o extensiones que has autorizado se mostrarán aquí. Puedes revocar el acceso de cualquier aplicación o extensión en cualquier momento.",
            "installExtension": "Instalar y abrir extensión para esta aplicación",
            "moreWallets": "Más billeteras ({{count}})",
            "connectionSecureDescription": "No se transferirán fondos a la aplicación y no se otorgará acceso a tus monedas"
        },
        "consent": "Al hacer clic en continuar aceptas nuestros"
    },
    "install": {
        "title": "Solicitud de conexión",
        "message": "<strong>{{name}}</strong> quiere conectarse a tu cuenta",
        "action": "Instalar"
    },
    "sign": {
        "title": "Solicitud de firma",
        "message": "Solicitado para firmar un mensaje",
        "hint": "No se transferirán fondos a la aplicación y no se otorgará acceso a tus monedas.",
        "action": "Firmar"
    },
    "migrate": {
        "title": "Migrar billeteras antiguas",
        "subtitle": "Si has estado usando billeteras obsoletas, puedes mover automáticamente todos los fondos de tus direcciones antiguas.",
        "inProgress": "Migrando billeteras antiguas...",
        "transfer": "Transfiriendo monedas desde {{address}}",
        "check": "Verificando dirección {{address}}",
        "keyStoreTitle": "Transición a un nuevo método de seguridad",
        "keyStoreSubtitle": "Queremos que tus claves siempre estén seguras, por lo que hemos actualizado la forma en que las protegemos. Necesitamos tu permiso para transferir tus claves a un nuevo almacenamiento seguro.",
        "failed": "Migración fallida"
    },
    "qr": {
        "title": "Apunta la cámara al código QR",
        "requestingPermission": "Solicitando permisos de cámara...",
        "noPermission": "Permitir acceso a la cámara para escanear códigos QR",
        "requestPermission": "Abrir configuración",
        "failedToReadFromImage": "No se pudo leer el código QR de la imagen"
    },
    "products": {
        "addNew": "Agregar nuevo producto",
        "tonConnect": {
            "errors": {
                "connection": "Error de conexión",
                "invalidKey": "Clave de dApp inválida",
                "invalidSession": "Sesión inválida",
                "invalidTestnetFlag": "Red inválida",
                "alreadyCompleted": "Solicitud ya completada",
                "unknown": "Error desconocido, por favor intente de nuevo o contacte al soporte"
            },
            "successAuth": "Conectado"
        },
        "savings": "Ahorros",
        "accounts": "Tokens",
        "services": "Extensiones",
        "oldWallets": {
            "title": "Billeteras antiguas",
            "subtitle": "Presiona para migrar billeteras antiguas"
        },
        "transactionRequest": {
            "title": "Solicitud de transacción",
            "subtitle": "Presiona para ver la solicitud",
            "groupTitle": "Solicitudes de transacción",
            "wrongNetwork": "Red incorrecta",
            "wrongFrom": "Remitente incorrecto",
            "invalidFrom": "Dirección del remitente inválida",
            "noConnection": "La aplicación no está conectada",
            "expired": "Solicitud expirada",
            "invalidRequest": "Solicitud inválida",
            "failedToReport": "La transacción se envió pero no se pudo informar a la aplicación",
            "failedToReportCanceled": "La transacción se canceló pero no se pudo informar a la aplicación"
        },
        "signatureRequest": {
            "title": "Solicitud de firma",
            "subtitle": "Presiona para ver la solicitud"
        },
        "staking": {
            "earnings": "Ganancias",
            "title": "TON Staking",
            "balance": "Saldo de staking",
            "subtitle": {
                "join": "Gana hasta {{apy}}% en tus TONs",
                "joined": "Gana hasta {{apy}}%",
                "rewards": "Interés estimado",
                "apy": "~13.3 APY de la contribución",
                "devPromo": "Multiplica tus monedas de prueba"
            },
            "pools": {
                "title": "Pools de staking",
                "active": "Activo",
                "best": "Mejor",
                "alternatives": "Alternativa",
                "private": "Pools privados",
                "restrictedTitle": "El pool está restringido",
                "restrictedMessage": "Este pool de staking está disponible solo para los miembros del Whales Club",
                "viewClub": "Ver Whales Club",
                "nominators": "Nominadores",
                "nominatorsDescription": "Para todos",
                "club": "Club",
                "clubDescription": "Para los miembros del Whales Club",
                "team": "Equipo",
                "teamDescription": "Para los compañeros de Ton Whales y los 15 mejores miembros del Whales Club",
                "joinClub": "Unirse",
                "joinTeam": "Unirse",
                "clubBanner": "Únete a nuestro Club",
                "clubBannerLearnMore": "Aprende sobre nuestro club",
                "clubBannerDescription": "Para nuestros miembros del Whales Club",
                "teamBanner": "Únete a nuestro Equipo",
                "teamBannerLearnMore": "Aprende sobre nuestro equipo",
                "teamBannerDescription": "Para nuestro equipo y los 15 mejores miembros del Whales Club",
                "epnPartners": "Socios de ePN",
                "epnPartnersDescription": "Únete a más de 200,000 webmasters",
                "moreAboutEPN": "Info",
                "lockups": "Pool de lockups",
                "lockupsDescription": "Permite a los titulares de grandes lockups en TON ganar ingresos adicionales",
                "tonkeeper": "Tonkeeper",
                "tonkeeperDescription": "Billetera móvil amigable en TON",
                "liquid": "Staking líquido",
                "liquidDescription": "Envía TON a staking y obtén tokens wsTON en su lugar",
                "rateTitle": "Tasa de cambio"
            },
            "transfer": {
                "stakingWarning": "Siempre puedes depositar una nueva participación o aumentar una existente con cualquier cantidad. Ten en cuenta que la cantidad mínima es: {{minAmount}}",
                "depositStakeTitle": "Staking",
                "depositStakeConfirmTitle": "Confirmar Staking",
                "withdrawStakeTitle": "Solicitud de retiro",
                "withdrawStakeConfirmTitle": "Confirmar retiro",
                "topUpTitle": "Recargar",
                "topUpConfirmTitle": "Confirmar recarga",
                "notEnoughStaked": "Desafortunadamente no tienes suficientes monedas en staking",
                "confirmWithdraw": "Solicitar retiro",
                "confirmWithdrawReady": "Retirar ahora",
                "restrictedTitle": "Este pool de staking está restringido",
                "restrictedMessage": "Tus fondos no participarán en el staking si la dirección de tu billetera no está en la lista de permisos, pero estarán en el saldo del pool y esperando un retiro",
                "notEnoughCoinsFee": "No hay suficientes TON en el saldo de tu billetera para pagar la tarifa. Ten en cuenta que la tarifa de {{amount}} TON debe estar en el saldo principal, no en el saldo de staking",
                "notEnoughCoins": "No hay suficientes fondos en el saldo de tu billetera para recargar el saldo de staking",
                "ledgerSignText": "Staking: {{action}}"
            },
            "nextCycle": "Próximo ciclo",
            "cycleNote": "Todas las transacciones entran en vigor una vez que finaliza el ciclo",
            "cycleNoteWithdraw": "Tu solicitud se ejecutará después de que finalice el ciclo. El retiro deberá confirmarse nuevamente.",
            "buttonTitle": "stake",
            "balanceTitle": "Saldo de Staking",
            "actions": {
                "deposit": "Depositar",
                "top_up": "Recargar",
                "withdraw": "Retirar",
                "calc": "Calcular",
                "swap": "Intercambiar instantáneamente"
            },
            "join": {
                "title": "Conviértete en un validador de TON",
                "message": "El staking es un bien público para el ecosistema TON. Puedes ayudar a asegurar la red y ganar recompensas en el proceso",
                "buttonTitle": "Comenzar a ganar",
                "moreAbout": "Más sobre el Ton Whales Staking Pool",
                "earn": "Gana hasta",
                "onYourTons": "en tus TONs",
                "apy": "13.3%",
                "yearly": "APY",
                "cycle": "Obtén recompensas por staking cada 36h",
                "ownership": "Los TONs en staking siguen siendo tuyos",
                "withdraw": "Retirar y recargar en cualquier momento",
                "successTitle": "{{amount}} TON en staking",
                "successEtimation": "Tus ganancias anuales estimadas son {{amount}}\u00A0TON\u00A0(${{price}}).",
                "successNote": "Tus TON en staking se activarán una vez que comience el próximo ciclo."
            },
            "pool": {
                "balance": "Stake total",
                "members": "Nominadores",
                "profitability": "Rentabilidad"
            },
            "empty": {
                "message": "No tienes transacciones"
            },
            "pending": "pendiente",
            "withdrawStatus": {
                "pending": "Retiro pendiente",
                "ready": "Retiro listo",
                "withdrawNow": "Presiona para retirar ahora"
            },
            "depositStatus": {
                "pending": "Depósito pendiente"
            },
            "withdraw": "Retirar",
            "sync": "Descargando datos de staking",
            "unstake": {
                "title": "¿Estás seguro de que quieres solicitar el retiro?",
                "message": "Ten en cuenta que al solicitar el retiro, todos los depósitos pendientes también serán devueltos."
            },
            "unstakeLiquid": {
                "title": "Retira tus wsTON",
                "message": "Puedes retirar fondos directamente después de que finalice el ciclo o intercambiar instantáneamente wsTON por TON en "
            },
            "learnMore": "Info",
            "moreInfo": "Más info",
            "calc": {
                "yearly": "Recompensas anuales",
                "monthly": "Recompensas mensuales",
                "daily": "Recompensas diarias",
                "note": "Calculado incluyendo todas las tarifas",
                "text": "Calculadora de ganancias",
                "yearlyTopUp": "Después de recargar",
                "yearlyTotal": "Recompensas totales en un año",
                "yearlyCurrent": "Actual",
                "topUpTitle": "Tus recompensas anuales",
                "goToTopUp": "Ir a recargar"
            },
            "info": {
                "rate": "hasta 13.3%",
                "rateTitle": "APY",
                "frequency": "Cada 36 horas",
                "frequencyTitle": "Frecuencia de recompensas",
                "minDeposit": "Depósito mínimo",
                "poolFee": "3.3%",
                "poolFeeTitle": "Tarifa del pool",
                "depositFee": "Tarifa de depósito",
                "withdrawFee": "Tarifa de retiro",
                "withdrawRequestFee": "Tarifa de solicitud de retiro",
                "withdrawCompleteFee": "Tarifa de finalización de retiro",
                "depositFeeDescription": "Cantidad de TON que se deducirá del monto del depósito para cubrir las tarifas de la acción de depósito, la cantidad no utilizada se devolverá al saldo de tu billetera",
                "withdrawFeeDescription": "Cantidad de transferencia de TON necesaria para cubrir las tarifas de la acción de retiro, la cantidad no utilizada se devolverá al saldo de tu billetera",
                "withdrawCompleteDescription": "Cantidad de transferencia de TON necesaria para cubrir las tarifas de la acción de finalización de retiro, la cantidad no utilizada se devolverá al saldo de tu billetera",
                "blockchainFee": "Tarifa de blockchain",
                "cooldownTitle": "Período simplificado",
                "cooldownActive": "Activo",
                "cooldownInactive": "Inactivo",
                "cooldownDescription": "Todas las transacciones entran en vigor instantáneamente durante este período",
                "cooldownAlert": "Al comienzo de cada ciclo de staking, el Período Simplificado está activo. Durante este período no tienes que esperar a que finalice el ciclo para retirar o recargar, sucede instantáneamente y no tienes que enviar una segunda transacción para retirar, lo que reduce a la mitad la tarifa de retiro. Puedes transferir fondos de un pool a otro sin perder las ganancias del ciclo si el Período Simplificado está activo en ambos pools",
                "lockedAlert": "Mientras el ciclo de staking está en progreso, los retiros y depósitos están pendientes. Todas las transacciones entran en vigor una vez que finaliza el ciclo"
            },
            "minAmountWarning": "La cantidad mínima es {{minAmount}} TON",
            "tryAgainLater": "Por favor, intenta de nuevo más tarde",
            "banner": {
                "estimatedEarnings": "Tus ganancias anuales estimadas disminuirán en {{amount}}\u00A0TON\u00A0({{price}})",
                "estimatedEarningsDev": "Tus ganancias anuales estimadas disminuirán",
                "message": "¿Estás seguro sobre el des-staking?"
            },
            "activePools": "Pools activos",
            "analytics": {
                "operations": "Operaciones",
                "operationsDescription": "Recargar y retirar",
                "analyticsTitle": "Analítica",
                "analyticsSubtitle": "Ganancia total",
                "labels": {
                    "week": "1S",
                    "month": "1M",
                    "year": "1A",
                    "allTime": "Todo"
                }
            }
        },
        "holders": {
            "title": "Cuenta bancaria",
            "loadingLongerTitle": "Problemas de conexión",
            "loadingLonger": "Verifica tu conexión a internet y recarga la página. Si el problema persiste, por favor contacta al soporte",
            "accounts": {
                "title": "Gastos",
                "prepaidTitle": "Tarjetas prepago",
                "account": "Cuenta",
                "basicAccount": "Cuenta de gastos",
                "proAccount": "Cuenta pro",
                "noCards": "No hay tarjetas",
                "prepaidCard": "Tonhub Prepaid *{{lastFourDigits}}",
                "prepaidCardDescription": "Tarjeta recargable para uso diario",
                "hiddenCards": "Tarjetas ocultas",
                "hiddenAccounts": "Cuentas ocultas",
                "primaryName": "Cuenta principal",
                "paymentName": "Cuenta de pago {{accountIndex}}",
                "topUp": "Recargar cuenta",
                "addNew": "Agregar cuenta"
            },
            "pageTitles": {
                "general": "Tarjetas Tonhub",
                "card": "Tarjeta Tonhub",
                "cardDetails": "Detalles de la tarjeta",
                "cardCredentials": "Detalles de la tarjeta",
                "cardLimits": "Límites de la tarjeta {{cardNumber}}",
                "cardLimitsDefault": "Límites de la tarjeta",
                "cardDeposit": "Recargar TON",
                "transfer": "Transferir",
                "cardSmartContract": "Contrato inteligente de la tarjeta",
                "setUpCard": "Configurar la tarjeta",
                "pin": "Cambiar PIN"
            },
            "card": {
                "card": "Tarjeta",
                "cards": "Tarjetas de holders",
                "title": "Tarjeta Tonhub {{cardNumber}}",
                "defaultSubtitle": "Paga con USDT o TON en todas partes con tarjeta",
                "defaultTitle": "Tarjeta Tonhub",
                "eurSubtitle": "Tonhub EUR",
                "type": {
                    "physical": "Tarjeta física",
                    "virtual": "Virtual"
                },
                "notifications": {
                    "type": {
                        "card_ready": "Tarjeta activada",
                        "deposit": "Recarga de tarjeta",
                        "charge": "Pago",
                        "charge_failed": "Pago",
                        "limits_change": {
                            "pending": "Cambiando límites",
                            "completed": "Límites cambiados"
                        },
                        "card_withdraw": "Transferencia a billetera",
                        "contract_closed": "Contrato cerrado",
                        "card_block": "Tarjeta bloqueada",
                        "card_freeze": "Tarjeta congelada",
                        "card_unfreeze": "Tarjeta descongelada",
                        "card_paid": "Emisión de tarjeta bancaria"
                    },
                    "category": {
                        "deposit": "Recargar",
                        "card_withdraw": "Transferir",
                        "charge": "Compras",
                        "charge_failed": "Compras",
                        "other": "Otro"
                    },
                    "status": {
                        "charge_failed": {
                            "limit": {
                                "onetime": "Fallido (sobre el límite de una vez)",
                                "daily": "Fallido (sobre el límite diario)",
                                "monthly": "Fallido (sobre el límite mensual)"
                            },
                            "failed": "Fallido"
                        },
                        "completed": "Completado"
                    }
                }
            },
            "confirm": {
                "title": "¿Estás seguro de que quieres cerrar esta pantalla?",
                "message": "Esta acción descartará todos tus cambios"
            },
            "enroll": {
                "poweredBy": "Basado en TON, impulsado por ZenPay",
                "description_1": "Solo tú gestionas el contrato inteligente",
                "description_2": "Nadie excepto tú tiene acceso a tus fondos",
                "description_3": "Tú realmente posees tu dinero",
                "moreInfo": "Más sobre la tarjeta ZenPay",
                "buttonSub": "KYC y emisión de tarjeta toma ~5 min",
                "failed": {
                    "title": "No se pudo autorizar",
                    "noAppData": "No hay datos de la aplicación",
                    "noDomainKey": "No hay clave de dominio",
                    "createDomainKey": "Durante la creación de la clave de dominio",
                    "fetchToken": "Durante la obtención del token",
                    "createSignature": "Durante la creación de la firma"
                }
            },
            "otpBanner": {
                "title": "Nueva solicitud de pago",
                "accept": "Aceptar",
                "decline": "Rechazar",
                "expired": "Caducado"
            },
            "banner": {
                "fewMore": "Solo unos pocos pasos más",
                "ready": "¡Verificación completada! ¡Tu tarjeta está lista!",
                "readyAction": "Consíguela ahora",
                "emailAction": "Verifica tu correo electrónico",
                "kycAction": "Completa la verificación",
                "failedAction": "La verificación falló"
            },
            "transaction": {
                "type": {
                    "cardReady": "Card activated",
                    "accountReady": "Account activated",
                    "deposit": "Account Top Up",
                    "prepaidTopUp": "Prepaid Top Up",
                    "payment": "Payment",
                    "decline": "Decline",
                    "refund": "Refund",
                    "limitsChanging": "Limits changing",
                    "limitsChanged": "Limits changed",
                    "cardWithdraw": "Transfer to wallet",
                    "contractClosed": "Contract closed",
                    "cardBlock": "Card blocked",
                    "cardFreeze": "Card frozen",
                    "cardUnfreeze": "Card unfrozen",
                    "cardPaid": "Bank card issue",
                    "unknown": "Unknown"
                },
                "rejectReason": {
                    "approve": "n/a",
                    "generic": "There seems to be a problem. Please try again. If the error is still there, please contact customer support for help",
                    "fraud_or_ban": "There seems to be a problem. Please try again. If the error is still there, please contact customer support for help",
                    "not_able_to_trace_back_to_original_transaction": "There seems to be a problem. Please try again. If the error is still there, please contact customer support for help",
                    "do_not_honour": "We cannot perform the operation for this merchant",
                    "card_not_effective": "The transaction was declined because your card is currently blocked. To proceed, please unblock your card through the mobile app or contact customer support for help",
                    "expired_card": "Your card has reached its expiration date. Please order a new one through the mobile app",
                    "incorrect_pin": "Looks like there’s an issue with your PIN. Please check the details and try again. If the problem persists, please contact customer support for help",
                    "cvc2_or_cvv2_incorrect": "The CVV is not correct. Please check the three-digit code on the back of your card and try again",
                    "incorrect_expiry_date": "The expiry date you entered is not correct. Please check the expiry date on your card or in the mobile app and try again",
                    "invalid_card_number": "The card number you entered is not correct. Please check the number on your card or in the mobile app and try again",
                    "blocked_merchant_country_code": "Your card cannot be used for transactions in this country",
                    "insufficient_funds": "You don't have enough funds in your account to complete this transaction. Please top up your account and try again",
                    "exceeds_contactless_payments_daily_limit": "The transaction was declined because it exceeds your daily spending limit. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_contactless_payments_monthly_limit": "The transaction was declined because it exceeds your monthly spending limit. Please contact customer support for assistance or try again later",
                    "exceeds_contactless_payments_transaction_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_contactless_payments_weekly_limit": "The transaction was declined because it exceeds your weekly spending limit. Please contact customer support for assistance or try again later",
                    "exceeds_daily_overall_limit": "The transaction was declined because it exceeds your daily spending limit on the card. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_internet_purchase_payments_daily_limit": "The transaction was declined because it exceeds your daily limit for internet transactions. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_internet_purchase_payments_monthly_limit": "The transaction was declined because it exceeds your monthly limit for internet transactions. Please contact customer support for assistance or try again later",
                    "exceeds_internet_purchase_payments_transaction_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_internet_purchase_payments_weekly_limit": "The transaction was declined because it exceeds your weekly limit for internet transactions. Please contact customer support for assistance or try again later",
                    "exceeds_monthly_overall_limit": "The transaction was declined because it exceeds your monthly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_purchases_daily_limit": "The transaction was declined because it exceeds your daily spending limit on the card. Please contact customer support for assistance or try again tomorrow",
                    "exceeds_purchases_monthly_limit": "The transaction was declined because it exceeds your monthly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_purchases_transaction_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_purchases_weekly_limit": "The transaction was declined because it exceeds your weekly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_settlement_risk_limit": "The transaction was declined because it exceeds maximum transaction amount. Please contact customer support for help",
                    "exceeds_weekly_overall_limit": "The transaction was declined because it exceeds your weekly spending limit on the card. Please contact customer support for assistance or try again later",
                    "exceeds_withdrawal_amount_limit": "The transaction was declined because it exceeds cash withdrawal limit on the card. Please contact customer support for help",
                    "exceeds_withdrawal_maximum_limit": "The transaction was declined because it exceeds cash withdrawal limit on the card. Please contact customer support for help",
                    "exceeds_withdrawal_minimum_limit": "The transaction amount is incorrect",
                    "exceeds_withdrawals_daily_limit": "The transaction was declined because it exceeds daily cash withdrawal limit on the card. Please contact customer support for assistance or try tomorrow",
                    "exceeds_withdrawals_monthly_limit": "The transaction was declined because it exceeds monthly cash withdrawal limit on the card. Please contact customer support for assistance or try later",
                    "exceeds_withdrawals_transaction_limit": "The transaction was declined because it exceeds cash withdrawal limit on the card. Please contact customer support for assistance or try tomorrow",
                    "exceeds_withdrawals_weekly_limit": "The transaction was declined because it exceeds weekly cash withdrawal limit on the card. Please contact customer support for assistance or try later",
                    "transaction_not_permitted_to_card_holder": "Transaction type isn't supported. Please contact the merchant",
                    "blocked_merchant_category_code": "We cannot perform the operation for this merchant",
                    "blocked_merchant_id": "We cannot perform the operation for this merchant",
                    "blocked_merchant_name": "We cannot perform the operation for this merchant",
                    "blocked_terminal_id": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "no_card_record": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "suspected_fraud": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "token_not_effective": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "client_system_malfunction": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "system_malfunction": "There seems to be a problem. Please try again. If the error is still there, contact customer support for help",
                    "contactless_payments_switched_off": "The transaction was declined because contactless payments are currently switched off on your card. Please contact customer support for help",
                    "internet_purchase_payments_switched_off": "The transaction was declined because internet purchases are currently switched off on your card. Please contact customer support for help",
                    "withdrawals_switched_off": "The transaction was declined because cash withdrawals are currently switched off on your card . Please contact customer support for help",
                    "purchases_switched_off": "The transaction was declined because purchases are currently switched off on your card. Please contact customer support for help",
                    "advice_acknowledged_no_financial_liability_accepted": "We cannot perform the operation for this merchant",
                    "merchant_without_3ds": "We cannot perform the operation for this merchant"
                },
                "to": {
                    "single": "To",
                    "prepaidCard": "To prepaid card",
                    "wallet": "To wallet",
                    "account": "To account"
                },
                "from": {
                    "single": "From",
                    "prepaidCard": "From prepaid card",
                    "wallet": "From wallet",
                    "account": "From account"
                },
                "category": {
                    "transfers": "Withdrawals",
                    "purchase": "Purchase",
                    "cash": "Cash withdrawals",
                    "other": "Other",
                    "deposit": "Top ups"
                },
                "status": {
                    "failed": "Failed",
                    "overOnetimeFailed": "Failed (over onetime limit)",
                    "overDailyFailed": "Failed (over daily limit)",
                    "overMonthlyFailed": "Failed (over monthly limit)",
                    "complete": "Complete"
                },
                "statsBlock": {
                    "title": "Transactions",
                    "description": "Spending in {{month}}",
                    "spent": "Spent",
                    "in": "in {{month}}"
                },
                "list": {
                    "emptyText": "No transactions yet"
                },
                "single": {
                    "report": "Report an issue"
                },
                "pendingPopover": {
                    "title": "Pending transaction",
                    "cancelButtonText": "Show transaction details",
                    "text": "Blockchain validation is currently underway. This may take a few minutes"
                }
            }
        }
    },
    "welcome": {
        "title": "Tonhub",
        "titleDev": "Ton Sandbox Wallet",
        "subtitle": "Billetera TON simple y segura",
        "subtitleDev": "Billetera para desarrolladores",
        "createWallet": "Obtener una nueva billetera",
        "importWallet": "Ya tengo una",
        "slogan": "Este es el nuevo Tonhub",
        "sloganDev": "Este es Ton Sandbox",
        "slide_1": {
            "title": "Protegido",
            "subtitle": "Contrato inteligente confiable, Touch/Face ID con código de acceso y todas las transacciones en una blockchain descentralizada"
        },
        "slide_2": {
            "title": "Con una tarjeta criptográfica genial",
            "subtitle": "Ordena una tarjeta ahora. Transferencias internas y compras en minutos.\nTodo esto es una tarjeta única de Tonhub"
        },
        "slide_3": {
            "title": "Rápido",
            "subtitle": "Gracias a la arquitectura única de TON, las transacciones se realizan en segundos"
        }
    },
    "legal": {
        "title": "Legal",
        "subtitle": "He leído y acepto ",
        "create": "Crear una copia de seguridad",
        "createSubtitle": "Mantén tu clave privada segura y no la compartas con nadie. Es la única forma de acceder a tu billetera si el dispositivo se pierde.",
        "privacyPolicy": "Política de Privacidad",
        "termsOfService": "Términos de Servicio"
    },
    "create": {
        "addNew": "Agregar nueva billetera",
        "inProgress": "Creando...",
        "backupTitle": "Tu clave de respaldo",
        "backupSubtitle": "Escribe estas 24 palabras en el mismo orden y guárdalas en un lugar secreto",
        "okSaved": "OK, las guardé",
        "copy": "Copiar al portapapeles"
    },
    "import": {
        "title": "Ingresar clave de respaldo",
        "subtitle": "Por favor, restaura el acceso a tu billetera ingresando las 24 palabras secretas que anotaste al crear la billetera",
        "fullSeedPlaceholder": "Ingresa las 24 palabras secretas",
        "fullSeedPaste": "O puedes pegar la frase completa donde cada palabra está separada por un espacio"
    },
    "secure": {
        "title": "Protege tu billetera",
        "titleUnprotected": "Tu dispositivo no está protegido",
        "subtitle": "Usamos biometría para autenticar transacciones y asegurarnos de que nadie excepto tú pueda transferir tus monedas.",
        "subtitleUnprotected": "Se recomienda encarecidamente habilitar el código de acceso en tu dispositivo para proteger tus activos.",
        "subtitleNoBiometrics": "Se recomienda encarecidamente habilitar la biometría en tu dispositivo para proteger tus activos. Usamos biometría para autenticar transacciones y asegurarnos de que nadie excepto tú pueda transferir tus monedas.",
        "messageNoBiometrics": "Se recomienda encarecidamente habilitar la biometría en tu dispositivo para proteger tus activos.",
        "protectFaceID": "Habilitar Face ID",
        "protectTouchID": "Habilitar Touch ID",
        "protectBiometrics": "Habilitar biometría",
        "protectPasscode": "Habilitar código de acceso del dispositivo",
        "upgradeTitle": "Actualización necesaria",
        "upgradeMessage": "Por favor, permite que la aplicación acceda a las claves de la billetera para una actualización. No se transferirán fondos durante esta actualización. Asegúrate de haber respaldado tus claves.",
        "allowUpgrade": "Permitir actualización",
        "backup": "Respaldo de palabras secretas",
        "onLaterTitle": "Configurar más tarde",
        "onLaterMessage": "Puedes configurar la protección más tarde en la configuración",
        "onLaterButton": "Configurar más tarde",
        "onBiometricsError": "Error al autenticar con biometría",
        "lockAppWithAuth": "Autenticar al iniciar sesión en la aplicación",
        "methodPasscode": "código de acceso",
        "passcodeSetupDescription": "El código PIN ayuda a proteger tu billetera de accesos no autorizados"
    },
    "backup": {
        "title": "Tu frase de recuperación",
        "subtitle": "Escribe estas 24 palabras en el orden dado a continuación y guárdalas en un lugar secreto y seguro."
    },
    "backupIntro": {
        "title": "Respalda tu billetera",
        "subtitle": "¿Estás seguro de que has guardado tus 24 palabras secretas?",
        "saved": "Sí, las guardé",
        "goToBackup": "No, ir al respaldo"
    },
    "errors": {
        "incorrectWords": {
            "title": "Palabras incorrectas",
            "message": "Has ingresado palabras secretas incorrectas. Por favor, verifica tu entrada y vuelve a intentarlo."
        },
        "secureStorageError": {
            "title": "Error de almacenamiento seguro",
            "message": "Desafortunadamente, no podemos guardar los datos."
        },
        "title": "Ooops",
        "invalidNumber": "No, este no es un número real. Por favor, verifica tu entrada y vuelve a intentarlo.",
        "codeTooManyAttempts": "Has intentado demasiado, por favor intenta de nuevo en 15 minutos.",
        "codeInvalid": "No, el código ingresado es inválido. Verifica el código y vuelve a intentarlo.",
        "unknown": "Vaya, es un error desconocido. Literalmente no tengo idea de lo que está pasando. ¿Puedes intentar apagarlo y encenderlo de nuevo?"
    },
    "confirm": {
        "logout": {
            "title": "¿Estás seguro de que quieres desconectar tu billetera de esta aplicación y eliminar todos tus datos de la aplicación?",
            "message": "Esta acción resultará en la eliminación de todas las cuentas de este dispositivo. Asegúrate de haber respaldado tus 24 palabras secretas antes de continuar."
        },
        "changeCurrency": "Cambiar moneda principal a {{currency}}"
    },
    "neocrypto": {
        "buttonTitle": "comprar",
        "alert": {
            "title": "Cómo funciona el pago",
            "message": "Completa los campos requeridos -> Selecciona criptomoneda y especifica la dirección de la billetera y la cantidad a comprar -> Procede al pago -> Ingresa tus datos de facturación correctamente. El pago con tarjeta de crédito es procesado de manera segura por nuestros socios -> Completa la compra. ¡No se necesita cuenta!"
        },
        "title": "Compra TON con tarjeta de crédito por USD, EUR y RUB",
        "description": "Serás llevado a Neocrypto. Los servicios relacionados con los pagos son proporcionados por Neocrypto, que es una plataforma separada propiedad de un tercero\n\nPor favor, lee y acepta los Términos de Servicio de Neocrypto antes de usar su servicio",
        "doNotShow": "No mostrar de nuevo para Neocrypto",
        "termsAndPrivacy": "He leído y acepto los ",
        "confirm": {
            "title": "¿Estás seguro de que quieres cerrar este formulario?",
            "message": "Esta acción descartará todos tus cambios"
        }
    },
    "known": {
        "deposit": "Depósito",
        "depositOk": "Depósito aceptado",
        "withdraw": "Solicitud de retiro de {{coins}} TON",
        "withdrawAll": "Solicitar retiro de todas las monedas",
        "withdrawLiquid": "Retirar",
        "withdrawCompleted": "Retiro completado",
        "withdrawRequested": "Retiro solicitado",
        "upgrade": "Actualizar código a {{hash}}",
        "upgradeOk": "Actualización completada",
        "cashback": "Reembolso",
        "tokenSent": "Token enviado",
        "tokenReceived": "Token recibido",
        "holders": {
            "topUpTitle": "Monto de recarga",
            "accountTopUp": "Recarga de cuenta de {{amount}} TON",
            "accountJettonTopUp": "Recarga de cuenta",
            "limitsChange": "Cambio de límites",
            "limitsTitle": "Límites",
            "limitsOneTime": "Por transacción",
            "limitsDaily": "Diario",
            "limitsMonthly": "Mensual",
            "accountLimitsChange": "Cambio de límites de cuenta"
        }
    },
    "jetton": {
        "token": "token",
        "productButtonTitle": "Tokens",
        "productButtonSubtitle": "{{jettonName}} y {{count}} otros",
        "hidden": "Tokens ocultos",
        "liquidPoolDescriptionDedust": "Liquidez para {{name0}}/{{name1}} en DeDust DEX",
        "liquidPoolDescriptionStonFi": "Liquidez para {{name0}}/{{name1}} en STON.fi DEX",
        "emptyBalance": "Saldo vacío",
        "jettonsNotFound": "No se encontraron tokens"
    },
    "connections": {
        "extensions": "Extensiones",
        "connections": "Conexiones"
    },
    "accounts": {
        "active": "Activo",
        "noActive": "No hay cuentas activas",
        "disabled": "Oculto",
        "alertActive": "Marcar {{symbol}} como activo",
        "alertDisabled": "Marcar {{symbol}} como oculto",
        "description": "Para cambiar el estado de una cuenta, mantén presionado el botón de la cuenta en la pantalla de inicio o presiona en este menú. La cuenta se agregará a la pantalla de inicio o se ocultará.",
        "noAccounts": "Aún no tienes cuentas"
    },
    "spamFilter": {
        "minAmount": "Cantidad mínima de TON",
        "dontShowComments": "No mostrar comentarios en transacciones SPAM",
        "minAmountDescription": "Las transacciones con una cantidad de TON menor a {{amount}} se marcarán automáticamente como SPAM",
        "applyConfig": "Aplicar configuración de filtro de SPAM seleccionada",
        "denyList": "Filtro de spam manual",
        "denyListEmpty": "No hay direcciones bloqueadas",
        "unblockConfirm": "Desbloquear dirección",
        "blockConfirm": "Marcar dirección como spam",
        "description": "Puedes agregar fácilmente la dirección a la lista de direcciones bloqueadas manualmente si haces clic en cualquier transacción o dirección y seleccionas la opción \"Marcar dirección como spam\" en el menú emergente"
    },
    "security": {
        "title": "Seguridad",
        "passcodeSettings": {
            "setupTitle": "Configurar código PIN",
            "confirmTitle": "Confirmar código PIN",
            "changeTitle": "Cambiar código PIN",
            "resetTitle": "Restablecer código PIN",
            "resetDescription": "Si olvidaste tu código PIN, puedes restablecerlo ingresando las 24 palabras secretas que anotaste al crear la billetera.",
            "resetAction": "Restablecer",
            "error": "Código PIN incorrecto",
            "tryAgain": "Inténtalo de nuevo",
            "success": "Código PIN configurado con éxito",
            "enterNew": "Crear código PIN",
            "confirmNew": "Confirmar nuevo código PIN",
            "enterCurrent": "Ingresa tu código PIN",
            "enterPrevious": "Ingresa el código PIN actual",
            "enterNewDescription": "Configurar una contraseña proporciona una capa adicional de seguridad al usar la aplicación",
            "changeLength": "Usar código PIN de {{length}} dígitos",
            "forgotPasscode": "¿Olvidaste el código PIN?",
            "logoutAndReset": "Cerrar sesión y restablecer código PIN"
        },
        "auth": {
            "biometricsPermissionCheck": {
                "title": "Permiso requerido",
                "message": "Por favor, permite que la aplicación acceda a la biometría para la autenticación",
                "openSettings": "Abrir configuración",
                "authenticate": "Autenticar con código de acceso"
            },
            "biometricsSetupAgain": {
                "title": "Nueva biometría detectada",
                "message": "Por favor, configura la biometría nuevamente en la configuración de seguridad",
                "setup": "Configurar",
                "authenticate": "Continuar con código de acceso"
            },
            "biometricsCooldown": {
                "title": "Enfriamiento de biometría",
                "message": "Por favor, intenta de nuevo más tarde, o bloquea tu dispositivo y desbloquéalo nuevamente con el código de acceso del dispositivo para habilitar la biometría"
            },
            "biometricsCorrupted": {
                "title": "Biometría corrupta y no se ha configurado el código PIN",
                "message": "Desafortunadamente, tu billetera ya no está disponible, para restaurar tu billetera, toca \"Restaurar\" (se cerrará la sesión de tu billetera actual) e ingresa tus 24 palabras secretas",
                "messageLogout": "Desafortunadamente, tu billetera ya no está disponible, para restaurar tu billetera, toca \"Cerrar sesión\" (se cerrará la sesión de tu billetera actual) y agrega tu billetera nuevamente",
                "logout": "Cerrar sesión",
                "restore": "Restaurar"
            },
            "canceled": {
                "title": "Cancelado",
                "message": "La autenticación fue cancelada, por favor intenta de nuevo"
            }
        }
    },
    "report": {
        "title": "Reportar",
        "scam": "estafa",
        "bug": "error",
        "spam": "spam",
        "offense": "contenido ofensivo",
        "posted": "Tu reporte ha sido enviado",
        "error": "Error al enviar el reporte",
        "message": "Mensaje (requerido)",
        "reason": "Razón del reporte"
    },
    "review": {
        "title": "Revisar extensión",
        "rating": "calificación",
        "review": "Revisión (opcional)",
        "heading": "Título",
        "error": "Error al publicar la revisión",
        "posted": "¡Gracias por tus comentarios!",
        "postedDescription": "Tu revisión será publicada después de la moderación"
    },
    "deleteAccount": {
        "title": "¿Estás seguro de que quieres eliminar la cuenta?",
        "action": "Eliminar cuenta y todos los datos",
        "logOutAndDelete": "Cerrar sesión y eliminar todos los datos",
        "description": "Esta acción eliminará todos los datos y la billetera actualmente seleccionada de este dispositivo y tu cuenta en la blockchain\nNecesitas transferir todas tus monedas TON a otra billetera. Antes de continuar, asegúrate de tener más de {{amount}} TON en tu cuenta para completar la transacción",
        "complete": "Eliminación de cuenta completada",
        "error": {
            "hasNfts": "Tienes NFTs en tu billetera, para eliminar la cuenta, por favor envíalos a otra billetera.",
            "fetchingNfts": "No se pudo determinar si hay NFTs en la billetera. Para eliminar la cuenta, asegúrate de que no haya NFTs en ella.",
            "hasUSDTBalanceTitle": "Tienes saldo de USDT en tu billetera",
            "hasUSDTBalanceMessage": "Para eliminar la cuenta, por favor envíalos a otra billetera."
        },
        "confirm": {
            "title": "¿Estás seguro de que quieres eliminar tu cuenta y todos los datos de esta aplicación?",
            "message": "Esta acción eliminará tu cuenta y todos los datos de esta aplicación y transferirá todas tus monedas TON a la dirección de la billetera que especificaste.\nPor favor, verifica cuidadosamente la dirección del destinatario antes de continuar. Se cobrará una tarifa estándar de blockchain por esta transacción."
        },
        "checkRecipient": "Verificar destinatario",
        "checkRecipientDescription": "Para hacer que tu cuenta sea inactiva, debes transferir todos los fondos a otra billetera (dirección del destinatario). Por favor, verifica cuidadosamente la dirección antes de continuar"
    },
    "browser": {
        "listings": {
            "categories": {
                "other": "Otro",
                "exchange": "Intercambios",
                "defi": "DeFi",
                "nft": "NFT",
                "games": "Juegos",
                "social": "Social",
                "utils": "Utilidades",
                "services": "Servicios"
            },
            "title": "Para ti"
        },
        "refresh": "Recargar",
        "back": "Atrás",
        "forward": "Adelante",
        "share": "Compartir",
        "search": {
            "placeholder": "Buscar",
            "invalidUrl": "URL inválida",
            "urlNotReachable": "URL no accesible",
            "suggestions": {
                "web": "Buscar en {{engine}}",
                "ddg": "DuckDuckGo",
                "google": "Google"
            }
        },
        "alertModal": {
            "message": "Estás a punto de abrir una aplicación web de terceros. No somos responsables del contenido o la seguridad de las aplicaciones de terceros.",
            "action": "Abrir"
        }
    },
    "swap": {
        "title": "DeDust.io — AMM DEX en The Open Network",
        "description": "Estás a punto de usar un servicio de Dedust.io operado por una parte independiente no afiliada a Tonhub\nDebes aceptar los Términos de Uso y la Política de Privacidad para continuar",
        "termsAndPrivacy": "He leído y acepto los ",
        "dontShowTitle": "No mostrar de nuevo para DeDust.io"
    },
    "mandatoryAuth": {
        "title": "Verifica tu respaldo",
        "description": "Habilita la verificación al abrir una billetera. Esto ayudará a mantener seguros los detalles de tu tarjeta bancaria.",
        "alert": "Escribe las 24 palabras secretas en la sección de Seguridad de la configuración de tu billetera. Esto te ayudará a recuperar el acceso si pierdes tu teléfono o olvidas tu código PIN.",
        "confirmDescription": "Escribí las 24 palabras secretas de mi billetera y las guardé en un lugar seguro",
        "action": "Habilitar",
        "settingsDescription": "Se requiere solicitud de autenticación ya que la aplicación muestra productos bancarios. Los datos sensibles estarán ocultos hasta que actives la autenticación"
    },
    "update": {
        "callToAction": "Actualizar Tonhub"
    },
    "logout": {
        "title": "¿Estás seguro de que quieres cerrar sesión de {{name}}?",
        "logoutDescription": "El acceso a la billetera será deshabilitado. ¿Has guardado tu clave privada?"
    },
    "contacts": {
        "title": "Contactos",
        "contact": "Contacto",
        "unknown": "Desconocido",
        "contacts": "Mis contactos",
        "name": "Nombre",
        "lastName": "Apellido",
        "company": "Empresa",
        "add": "Agregar contacto",
        "edit": "Editar",
        "save": "Guardar",
        "notes": "Notas",
        "alert": {
            "name": "Nombre incorrecto",
            "nameDescription": "El nombre del contacto no puede estar vacío o tener más de 126 caracteres",
            "notes": "Campo incorrecto",
            "notesDescription": "Los campos del contacto no pueden tener más de 280 caracteres"
        },
        "delete": "Eliminar contacto",
        "empty": "No hay contactos aún",
        "description": "Puedes agregar una dirección a tus contactos manteniendo presionada cualquier transacción o dirección o usando el botón \"Agregar\" o desde la lista de contactos recientes a continuación",
        "contactAddress": "Dirección de contactos",
        "search": "Nombre o dirección de billetera",
        "new": "Nuevo contacto"
    },
    "currency": {
        "USD": "Dólar estadounidense",
        "EUR": "Euro",
        "RUB": "Rublo ruso",
        "GBP": "Libras británicas",
        "CHF": "Franco suizo",
        "CNY": "Yuan chino",
        "KRW": "Won surcoreano",
        "IDR": "Rupia indonesia",
        "INR": "Rupia india",
        "JPY": "Yen japonés"
    },
    "txActions": {
        "addressShare": "Compartir dirección",
        "addressContact": "Agregar dirección a contactos",
        "addressContactEdit": "Editar contacto de dirección",
        "addressMarkSpam": "Marcar dirección como spam",
        "txShare": "Compartir transacción",
        "txRepeat": "Repetir transacción",
        "view": "Ver en el explorador",
        "share": {
            "address": "Dirección TON",
            "transaction": "Transacción TON"
        }
    },
    "hardwareWallet": {
        "ledger": "Ledger",
        "title": "Conectar Ledger",
        "description": "Tu billetera de hardware Ledger",
        "installationIOS": "Desbloquea Ledger, conéctalo a tu smartphone vía Bluetooth y permite el acceso a Tonhub.",
        "installationAndroid": "Desbloquea Ledger, conéctalo a tu smartphone vía Bluetooth o cable USB y permite el acceso a Tonhub.",
        "installationGuide": "Guía de conexión de Ledger TON",
        "connectionDescriptionAndroid": "Conecta tu Ledger vía USB o Bluetooth",
        "connectionDescriptionIOS": "Conecta tu Ledger vía Bluetooth",
        "connectionHIDDescription_1": "1. Enciende tu ledger y desbloquéalo",
        "connectionHIDDescription_2": "2. Presiona \"Continuar\"",
        "openTheAppDescription": "Abre la aplicación TON en tu Ledger",
        "unlockLedgerDescription": "Desbloquea tu Ledger",
        "chooseAccountDescription": "Selecciona la cuenta que deseas usar",
        "bluetoothScanDescription_1": "1. Enciende tu ledger y desbloquéalo",
        "bluetoothScanDescription_2": "2. Asegúrate de tener el Bluetooth habilitado",
        "bluetoothScanDescription_3": "3. Presiona \"Escanear\" para buscar dispositivos disponibles y selecciona el Ledger Nano X adecuado",
        "bluetoothScanDescription_3_and": "3. Presiona \"Escanear\" para buscar dispositivos disponibles (necesitaremos acceso a los datos de ubicación del dispositivo y permiso para buscar dispositivos cercanos)",
        "bluetoothScanDescription_4_and": "4. Luego selecciona el Ledger Nano X adecuado",
        "openAppVerifyAddress": "Verifica la dirección de la cuenta que has seleccionado y luego verifica la dirección con la aplicación Ledger Ton cuando se te solicite",
        "devices": "Tus dispositivos",
        "connection": "Conexión",
        "actions": {
            "connect": "Conectar Ledger",
            "selectAccount": "Seleccionar cuenta",
            "account": "Cuenta #{{account}}",
            "loadAddress": "Verificar dirección",
            "connectHid": "Conectar Ledger vía USB",
            "connectBluetooth": "Conectar Ledger vía Bluetooth",
            "scanBluetooth": "Escanear de nuevo",
            "confirmOnLedger": "Verificar en Ledger",
            "sending": "Esperando transacción",
            "sent": "Transacción enviada",
            "mainAddress": "Dirección principal",
            "givePermissions": "Dar permisos"
        },
        "confirm": {
            "add": "¿Estás seguro de que quieres agregar esta aplicación?",
            "remove": "¿Estás seguro de que quieres eliminar esta aplicación?"
        },
        "errors": {
            "bleTitle": "Error de Bluetooth",
            "noDevice": "No se encontró ningún dispositivo",
            "appNotOpen": "La aplicación Ton no está abierta en Ledger",
            "turnOnBluetooth": "Por favor, enciende el Bluetooth y vuelve a intentarlo",
            "lostConnection": "Conexión perdida con Ledger",
            "transactionNotFound": "Transacción no encontrada",
            "transactionRejected": "Transacción rechazada",
            "transferFailed": "Transferencia fallida",
            "permissions": "Por favor, permite el acceso a Bluetooth y ubicación",
            "unknown": "Error desconocido",
            "reboot": "Por favor, reinicia tu dispositivo y vuelve a intentarlo",
            "turnOnLocation": "Por favor, enciende los servicios de ubicación y vuelve a intentarlo, esto es necesario para escanear dispositivos cercanos",
            "locationServicesUnauthorized": "Servicios de ubicación no autorizados",
            "bluetoothScanFailed": "Escaneo de Bluetooth fallido"
        },
        "moreAbout": "Más sobre Ledger"
    },
    "devTools": {
        "switchNetwork": "Red",
        "switchNetworkAlertTitle": "Cambiando a la red {{network}}",
        "switchNetworkAlertMessage": "¿Estás seguro de que quieres cambiar de red?",
        "switchNetworkAlertAction": "Cambiar",
        "copySeed": "Copiar frase semilla de 24 palabras",
        "copySeedAlertTitle": "Copiando frase semilla de 24 palabras al portapapeles",
        "copySeedAlertMessage": "¡ADVERTENCIA! Copiar la frase semilla de 24 palabras al portapapeles no es seguro. Procede bajo tu propio riesgo.",
        "copySeedAlertAction": "Copiar",
        "holdersOfflineApp": "Aplicación Offline de Holders"
    },
    "wallets": {
        "choose_versions": "Elige billeteras para agregar",
        "switchToAlertTitle": "Cambiando a {{wallet}}",
        "switchToAlertMessage": "¿Estás seguro de que quieres cambiar de billetera?",
        "switchToAlertAction": "Cambiar",
        "addNewTitle": "Agregar billetera",
        "addNewAlertTitle": "Agregando nueva billetera",
        "addNewAlertMessage": "¿Estás seguro de que quieres agregar una nueva billetera?",
        "addNewAlertAction": "Agregar",
        "alreadyExistsAlertTitle": "La billetera ya existe",
        "alreadyExistsAlertMessage": "La billetera con esta dirección ya existe",
        "settings": {
            "changeAvatar": "Cambiar avatar",
            "selectAvatarTitle": "Imagen",
            "selectColorTitle": "Color de fondo"
        }
    },
    "webView": {
        "checkInternetAndReload": "Por favor, verifica la conexión a internet y vuelve a cargar la página",
        "contactSupportOrTryToReload": "Contacta al soporte o intenta recargar la página",
        "contactSupport": "Contactar soporte"
    },
    "appAuth": {
        "description": "Para continuar iniciando sesión en la aplicación"
    },
    "screenCapture": {
        "title": "Wow, captura de pantalla genial, pero no es seguro",
        "description": "No se recomiendan copias digitales no cifradas de tu frase secreta. Ejemplos incluyen guardar copias en la computadora, en cuentas en línea o tomar capturas de pantalla",
        "action": "OK, estoy asumiendo el riesgo"
    },
    "onboarding": {
        "avatar": "Aquí es donde puedes cambiar el avatar y el nombre de tus billeteras",
        "wallet": "Aquí es donde puedes agregar nuevas o cambiar entre tus billeteras",
        "price": "Aquí es donde puedes cambiar tu moneda principal"
    },
    "newAddressFormat": {
        "title": "Formato de dirección",
        "fragmentTitle": "Nuevo tipo de direcciones",
        "learnMore": "Más sobre las nuevas direcciones",
        "shortDescription": "La actualización de la dirección hará que la blockchain TON sea aún más segura y estable. Todos los activos enviados a tu antigua dirección seguirán llegando a tu billetera.",
        "description_0_0": "Recientemente, TON ",
        "description_0_link": "anunció esta actualización",
        "description_0_1": " a las direcciones y pidió a todas las billeteras que la soporten.",
        "title_1": "¿Por qué?",
        "description_1": "La actualización permite a los desarrolladores distinguir entre direcciones de billetera y de contrato y evitar errores al enviar transacciones.",
        "title_2": "¿Qué necesitas hacer?",
        "description_2": "Haz clic en el botón en la pantalla anterior y autorízanos a mostrar todas las direcciones en la aplicación en el nuevo formato. Podrás volver al formato antiguo en tu configuración.",
        "title_3": "¿Qué pasa con la antigua dirección?",
        "description_3": "Todos los TONs, tokens, NFTs y otros activos enviados a tu antigua dirección seguirán llegando a tu billetera.",
        "description_4": "Los detalles técnicos de la actualización se pueden encontrar en",
        "action": "Usar {{format}}",
        "oldAddress": "Dirección antigua",
        "newAddress": "Nueva dirección",
        "bannerTitle": "Actualiza tu dirección",
        "bannerDescription": "De EQ a UQ"
    },
    "changelly": {
        "bannerTitle": "Depósitos de USDT y USDC",
        "bannerDescription": "¡Disponibles Tron, Solana, Ethereum, Polygon!"
    },
    "w5": {
        "banner": {
            "title": "Agregar billetera W5",
            "description": "Transferir USDT sin gas"
        },
        "update": {
            "title": "Actualizar billetera a W5",
            "subtitle_1": "Transferencias de USDT sin gas",
            "description_1": "Ya no necesitas TON para enviar USDT. Las tarifas de transacción pueden cubrirse con tu saldo de tokens.",
            "subtitle_2": "Ahorra en tarifas",
            "description_2": "W5 permite aumentar el número de operaciones en una sola transacción en un 60% y ahorrar significativamente en tarifas.",
            "subtitle_3": "Tu frase semilla no cambia",
            "description_3": "Las billeteras V4 y W5 tienen la misma frase semilla. Siempre puedes cambiar de versión seleccionando la dirección deseada en la parte superior de la pantalla principal.",
            "switch_button": "Cambiar a W5"
        },
        "gaslessInfo": "No se requiere TON para pagar la tarifa de gas al enviar este token. La tarifa se deducirá directamente de tu saldo de tokens."
    },
    "savings": {
        "ton": "Cuenta de ahorro TON",
        "usdt": "Cuenta de ahorro USDT"
    },
    "spending": {
        "ton": "Cuenta de gastos TON",
        "usdt": "Cuenta de gastos USDT"
    }
};

export default schema;
