import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, "" | "_plural"> = {
    "lang": "pt",
    "common": {
        "and": "e",
        "accept": "Aceitar",
        "start": "Iniciar",
        "continue": "Continuar",
        "continueAnyway": "Continuar mesmo assim",
        "back": "Voltar",
        "logout": "Sair",
        "logoutFrom": "Sair de {{name}}",
        "cancel": "Cancelar",
        "balance": "Saldo",
        "totalBalance": "Saldo total",
        "walletAddress": "Endereço da carteira",
        "recipientAddress": "Endereço do destinatário",
        "recipient": "Destinatário",
        "copy": "Copiar",
        "copiedAlert": "Copiado para área de transferência",
        "copied": "Copiado",
        "share": "Compartilhar",
        "send": "Enviar",
        "yes": "Sim",
        "no": "Não",
        "amount": "Quantia",
        "today": "Hoje",
        "yesterday": "Ontem",
        "comment": "Comentário",
        "products": "Produtos",
        "confirm": "Confirmar",
        "soon": "em breve",
        "in": "em",
        "max": "Máximo",
        "close": "Fechar",
        "delete": "Excluir",
        "apply": "Aplicar",
        "domainOrAddress": "Endereço da carteira ou domínio",
        "domainOrAddressOrContact": "Endereço, domínio ou nome",
        "domain": "Domínio",
        "search": "Buscar",
        "termsOfService": "Termos\u00A0de\u00A0Serviço",
        "privacyPolicy": "Política\u00A0de\u00A0Privacidade",
        "apy": "APY",
        "tx": "Transação",
        "add": "Adicionar",
        "connect": "Conectar",
        "gotIt": "Entendi",
        "error": "Erro",
        "wallet": "Carteira",
        "wallets": "Carteiras",
        "cards": "Cartões",
        "later": "Depois",
        "select": "Selecionar",
        "show": "Mostrar",
        "hide": "Ocultar",
        "showAll": "Mostrar tudo",
        "hideAll": "Ocultar tudo",
        "done": "Concluído",
        "mainWallet": "Carteira principal",
        "walletName": "Nome da carteira",
        "from": "De",
        "to": "Para",
        "transaction": "Transação",
        "somethingWentWrong": "Algo deu errado",
        "checkInternetConnection": "Verifique sua conexão com a internet",
        "reload": "Recarregar",
        "errorOccurred": "Ocorreu um erro: {{error}}",
        "recent": "Recente",
        "ok": "OK",
        "attention": "Atenção",
        "save": "Salvar",
        "assets": "Ativos",
        "message": "Mensagem",
        "messages": "Mensagens",
        "airdrop": "Airdrop",
        "myWallets": "Minhas carteiras",
        "showMore": "Mostrar mais",
        "balances": "Saldos",
        "loading": "Carregando...",
        "notFound": "Não encontrado",
        "unverified": "Não verificado",
        "addressBook": "Catálogo de endereços",
        "gasless": "Sem gas",
        "address": "Endereço",
        "currencyChanged": "Moeda alterada",
        "required": "obrigatório",
        "operation": "Operação",
        "description": "Descrição",
        "openSettings": "Abrir configurações"
    },
    "syncStatus": {
        "connecting": "Conectando",
        "updating": "Atualizando",
        "online": "Conectado"
    },
    "home": {
        "home": "Início",
        "history": "Histórico",
        "browser": "Navegador",
        "settings": "Configurações"
    },
    "settings": {
        "title": "Mais",
        "backupKeys": "Backup das chaves",
        "holdersAccounts": "Contas de despesas",
        "migrateOldWallets": "Migrar carteiras antigas",
        "termsOfService": "Termos de Serviço",
        "privacyPolicy": "Política de Privacidade",
        "developerTools": "Ferramentas de Desenvolvedor",
        "spamFilter": "Filtro de SPAM",
        "primaryCurrency": "Moeda principal",
        "experimental": "Experimental",
        "support": {
            "title": "Suporte",
            "telegram": "Telegram",
            "form": "Formulário de suporte",
            "holders": "Cartão bancário e contas",
            "tonhub": "Tonhub"
        },
        "telegram": "Telegram",
        "rateApp": "Avaliar app",
        "deleteAccount": "Excluir conta",
        "theme": "Tema",
        "searchEngine": "Motor de busca",
        "language": "Idioma"
    },
    "walletImportSelector": {
        "description": "Digite sua frase de recuperação ou conecte o Ledger com segurança",
        "title": "Importar carteira",
        "seed": "Digite as palavras de recuperação"
    },
    "ledgerOnboarding": {
        "title": "Configuração de segurança",
        "description": "Antes de conectar o Ledger, criaremos uma carteira adicional para completar a configuração de segurança",
        "button": "Criar carteira"
    },
    "theme": {
        "title": "Tema",
        "light": "Claro",
        "dark": "Escuro",
        "system": "Sistema"
    },
    "wallet": {
        "sync": "Baixando dados da carteira",
        "balanceTitle": "Saldo em Ton",
        "owner": "Proprietário",
        "actions": {
            "receive": "Receber",
            "send": "Enviar",
            "buy": "Comprar",
            "swap": "Trocar",
            "deposit": "Depositar",
            "payments": "Pagamentos",
            "scan": "Escanear"
        },
        "empty": {
            "message": "Você não tem transações",
            "receive": "Receber TON",
            "description": "Faça sua primeira transação"
        },
        "pendingTransactions": "Transações pendentes"
    },
    "transactions": {
        "title": "Transações",
        "history": "Histórico",
        "filter": {
            "holders": "Cartões",
            "ton": "Transações da carteira",
            "any": "Todos",
            "type": "Tipo",
            "accounts": "Despesas"
        }
    },
    "tx": {
        "sending": "Enviando",
        "sent": "Enviado",
        "received": "Recebido",
        "bounced": "Devolvido",
        "tokenTransfer": "Transferência de token",
        "airdrop": "Airdrop",
        "failed": "Falhou",
        "timeout": "Tempo esgotado",
        "batch": "Lote"
    },
    "txPreview": {
        "sendAgain": "Enviar novamente",
        "blockchainFee": "Taxa de rede",
        "blockchainFeeDescription": "Esta taxa também é conhecida como GAS. É necessária para que uma transação seja processada com sucesso na blockchain. O tamanho do GAS depende da quantidade de trabalho que os validadores precisam fazer para incluir uma transação no bloco."
    },
    "receive": {
        "title": "Receber",
        "subtitleTon": "Envie apenas Toncoin e tokens na rede TON para este endereço, ou você pode perder seus fundos.",
        "subtitleSolana": "Envie apenas SOL e SPL tokens na rede Solana para este endereço, ou você pode perder seus fundos.",
        "share": {
            "title": "Meu Endereço Tonhub",
            "error": "Falha ao compartilhar endereço, tente novamente ou contate o suporte"
        },
        "holdersJettonWarning": "Transfira para este endereço apenas {{symbol}}, se você enviar outro token, você o perderá.",
        "assets": "Tokens e Contas",
        "fromExchange": "De uma exchange",
        "otherCoins": "Outros tokens",
        "deposit": "Depositar em"
    },
    "transfer": {
        "title": "Enviar",
        "titleAction": "Ação",
        "confirm": "Tem certeza que deseja prosseguir?",
        "error": {
            "invalidAddress": "Endereço inválido",
            "invalidAddressMessage": "Por favor, verifique o endereço do destinatário",
            "invalidAmount": "Quantidade inválida",
            "invalidDomain": "Domínio inválido",
            "invalidDomainString": "Mínimo 4 caracteres, máximo 126 caracteres. São permitidas letras latinas (a-z), números (0-9) e hífen (-). O hífen não pode estar no início ou no fim.",
            "sendingToYourself": "Você não pode enviar moedas para si mesmo",
            "zeroCoins": "Infelizmente você não pode enviar zero moedas",
            "zeroCoinsAlert": "Você está tentando enviar zero moedas",
            "notEnoughCoins": "Você não tem fundos suficientes em seu saldo",
            "addressIsForTestnet": "Este endereço é para testnet",
            "addressCantReceive": "Este endereço não pode receber moedas",
            "addressIsNotActive": "Esta carteira não tem histórico",
            "addressIsNotActiveDescription": "Isso significa que nenhuma transação foi feita a partir deste endereço de carteira",
            "invalidTransaction": "Transação inválida",
            "invalidTransactionMessage": "Por favor, verifique os detalhes da transação",
            "memoRequired": "Adicione um memo/tag para evitar perder fundos",
            "holdersMemoRequired": "Tag/MEMO",
            "memoChange": "Alterar memo/tag para \"{{memo}}\"",
            "gaslessFailed": "Falha ao enviar transação",
            "gaslessFailedMessage": "Por favor, tente novamente ou contate o suporte",
            "gaslessFailedEstimate": "Falha ao estimar taxas, tente novamente mais tarde ou contate o suporte",
            "gaslessCooldown": "Você só pode pagar a taxa de gás na moeda do token a cada poucos minutos. Por favor, aguarde ou pague a taxa de transação em TON.",
            "gaslessCooldownTitle": "Aguarde alguns minutos antes da próxima transação",
            "gaslessCooldownWait": "Vou esperar",
            "gaslessCooldownPayTon": "Pagar gás em TON",
            "gaslessNotEnoughFunds": "Saldo insuficiente",
            "gaslessNotEnoughFundsMessage": "O valor da transferência sem gás com taxa é maior que seu saldo, tente enviar um valor menor ou contate o suporte",
            "gaslessTryLater": "Tente novamente mais tarde",
            "gaslessTryLaterMessage": "Você pode tentar novamente mais tarde ou contatar o suporte",
            "gaslessNotEnoughCoins": "{{fee}} em taxas necessárias para enviar, faltando {{missing}}",
            "notEnoughJettons": "{{symbol}} insuficiente",
            "jettonChange": "O destinatário suporta apenas transferências de {{symbol}}, por favor altere o destinatário ou a moeda da transferência",
            "ledgerErrorConnectionTitle": "Ledger não está conectado",
            "ledgerErrorConnectionMessage": "Por favor, conecte o Ledger e tente novamente",
            "notEnoughGasTitle": "TON insuficiente para cobrir a taxa de gás",
            "notEnoughGasMessage": "Por favor, deposite TON em sua carteira (pelo menos {{diff}} TON a mais é necessário) e tente novamente"
        },
        "changeJetton": "Mudar para {{symbol}}",
        "sendAll": "Máximo",
        "scanQR": "escanear código qr",
        "sendTo": "Enviar para",
        "fee": "Taxa da blockchain: {{fee}}",
        "feeEmpty": "As taxas serão calculadas depois",
        "feeTitle": "Taxas da blockchain",
        "feeTotalTitle": "Total de taxas da blockchain",
        "purpose": "Propósito da transação",
        "comment": "Mensagem (opcional)",
        "commentDescription": "A mensagem será visível para todos na blockchain",
        "commentRequired": "Verifique seu memo/tag antes de enviar",
        "commentLabel": "Mensagem",
        "checkComment": "Verifique antes de enviar",
        "confirmTitle": "Confirmar transação",
        "confirmManyTitle": "Confirmar {{count}} transações",
        "unknown": "Operação desconhecida",
        "moreDetails": "Mais detalhes",
        "gasFee": "Taxa de gás",
        "contact": "Seu contato",
        "firstTime": "Enviando pela primeira vez",
        "requestsToSign": "{{app}} solicita assinatura",
        "smartContract": "Operação de contrato inteligente",
        "txsSummary": "Total",
        "txsTotal": "Valor total",
        "gasDetails": "Detalhes do gás",
        "jettonGas": "Gás para enviar tokens",
        "unusualJettonsGas": "O gás está mais alto que o normal",
        "unusualJettonsGasTitle": "A taxa para enviar tokens é de {{amount}} TON",
        "unusualJettonsGasMessage": "A taxa de transação de tokens (Gás) é mais alta que o normal",
        "addressNotActive": "Esta carteira não teve transações de saída",
        "wrongJettonTitle": "Token errado",
        "wrongJettonMessage": "Você está tentando enviar um token que você não possui",
        "notEnoughJettonsTitle": "Tokens insuficientes",
        "notEnoughJettonsMessage": "Você está tentando enviar mais tokens do que possui",
        "aboutFees": "Sobre as taxas",
        "aboutFeesDescription": "As taxas para transações na blockchain dependem de vários fatores, como congestionamento da rede, tamanho da transação, preço do gás e parâmetros de configuração da blockchain. Quanto maior a demanda pelo processamento de transações na blockchain ou maior o tamanho da transação (mensagem/comentário), maiores serão as taxas.",
        "gaslessTransferSwitch": "Pagar taxa de gás em {{symbol}}",
        "solana": {
            "error": {
                "title": "Erro na transação Solana",
                "networkRequestFailed": "Erro de rede, por favor tente novamente mais tarde ou contacte o suporte",
                "connectionTimeout": "Tempo limite de conexão esgotado, por favor tente novamente mais tarde ou contacte o suporte",
                "connectionRefused": "Conexão recusada, por favor tente novamente mais tarde ou contacte o suporte",
                "connectionReset": "Conexão redefinida, por favor tente novamente mais tarde ou contacte o suporte",
                "insufficientLamports": "Fundos SOL insuficientes",
                "insufficientLamportsWithAmount": "Fundos SOL insuficientes, são necessários mais {{amount}}",
                "insufficientTokenFunds": "Fundos de token insuficientes",
                "rateLimited": "Estamos a experienciar uma elevada procura, por favor tente novamente mais tarde ou contacte o suporte",
                "signingFailed": "Erro ao assinar a transação",
                "insufficientFundsForRentTitle": "Montante da transação inferior ao mínimo",
                "insufficientFundsForRent": "Fundos SOL insuficientes para enviar para: {{address}}, são necessários mais {{amount}}"
            }
        }
    },
    "auth": {
        "phoneVerify": "Verificar telefone",
        "phoneNumber": "Número de telefone",
        "phoneTitle": "Seu número",
        "phoneSubtitle": "Enviaremos um código de verificação para\nverificar seu número.",
        "codeTitle": "Digite o código",
        "codeSubtitle": "Enviamos o código de verificação para ",
        "codeHint": "Código",
        "title": "Entrar em {{name}}",
        "message": "solicita conexão com sua carteira {{wallet}}",
        "hint": "Nenhum fundo será transferido para o aplicativo e nenhum acesso às suas moedas será concedido.",
        "action": "Permitir",
        "expired": "Esta solicitação de autenticação já expirou",
        "failed": "Falha na autenticação",
        "completed": "Esta solicitação de autenticação já foi concluída",
        "authorized": "Solicitação de autorização aprovada",
        "authorizedDescription": "Agora você pode voltar ao aplicativo.",
        "noExtensions": "Ainda não há extensões",
        "noApps": "Ainda não há aplicativos conectados",
        "name": "Aplicativos conectados",
        "yourWallet": "Sua carteira",
        "revoke": {
            "title": "Tem certeza que deseja revogar este aplicativo?",
            "message": "Isso destruirá a conexão entre sua carteira e o aplicativo, mas você sempre pode tentar conectar novamente.",
            "action": "Revogar"
        },
        "apps": {
            "title": "Aplicativos Confiáveis",
            "delete": {
                "title": "Excluir esta extensão?",
                "message": "Isso destruirá a conexão entre sua carteira e a extensão, mas você sempre pode tentar conectar novamente."
            },
            "description": "Aplicativos ou extensões que você autorizou serão exibidos aqui. Você pode revogar o acesso de qualquer aplicativo ou extensão a qualquer momento.",
            "installExtension": "Instale e abra a extensão para este aplicativo",
            "moreWallets": "Mais carteiras ({{count}})",
            "connectionSecureDescription": "Nenhum fundo será transferido para o aplicativo e nenhum acesso às suas moedas será concedido",
            "invalidManifest": "Erro do manifesto da aplicação",
            "invalidManifestDescription": "Esta aplicação falhou em conectar-se à sua carteira. Por favor, entre em contato com o suporte deles."
        },
        "consent": "Ao clicar em continuar, você aceita nossos"
    },
    "install": {
        "title": "Solicitação de conexão",
        "message": "<strong>{{name}}</strong> deseja conectar-se à sua conta",
        "action": "Instalar"
    },
    "sign": {
        "title": "Solicitação de assinatura",
        "message": "Solicitação para assinar uma mensagem",
        "hint": "Nenhum fundo será transferido para o aplicativo e nenhum acesso às suas moedas será concedido.",
        "action": "Assinar"
    },
    "migrate": {
        "title": "Migrar carteiras antigas",
        "subtitle": "Se você estiver usando carteiras obsoletas, pode mover automaticamente todos os fundos de seus endereços antigos.",
        "inProgress": "Migrando carteiras antigas...",
        "transfer": "Transferindo moedas de {{address}}",
        "check": "Verificando endereço {{address}}",
        "keyStoreTitle": "Transição para um novo método de segurança",
        "keyStoreSubtitle": "Queremos que suas chaves estejam sempre seguras, então atualizamos a forma como as protegemos. Precisamos de sua permissão para transferir suas chaves para um novo armazenamento seguro.",
        "failed": "Falha na migração"
    },
    "qr": {
        "title": "Aponte a câmera para o código QR",
        "requestingPermission": "Solicitando permissões de câmera...",
        "noPermission": "Permita o acesso à câmera para escanear códigos QR",
        "requestPermission": "Abrir configurações",
        "failedToReadFromImage": "Falha ao ler código QR da imagem",
        "galleryPermissionTitle": "Permissão Necessária",
        "galleryPermissionMessage": "Para escanear códigos QR das suas fotos, o aplicativo precisa de acesso à sua galeria"
    },
    "products": {
        "addNew": "Adicionar um produto",
        "tonConnect": {
            "errors": {
                "connection": "Erro de conexão",
                "invalidKey": "Chave dApp inválida",
                "invalidSession": "Sessão inválida",
                "invalidTestnetFlag": "Rede inválida",
                "alreadyCompleted": "Solicitação já concluída",
                "unknown": "Erro desconhecido, tente novamente ou entre em contato com o suporte"
            },
            "successAuth": "Conectado"
        },
        "savings": "Poupança",
        "accounts": "Tokens",
        "services": "Extensões",
        "oldWallets": {
            "title": "Carteiras antigas",
            "subtitle": "Pressione para migrar carteiras antigas"
        },
        "transactionRequest": {
            "title": "Transação solicitada",
            "subtitle": "Pressione para ver a solicitação",
            "groupTitle": "Solicitações de transação",
            "wrongNetwork": "Rede incorreta",
            "wrongFrom": "Remetente incorreto",
            "invalidFrom": "Endereço do remetente inválido",
            "noConnection": "Aplicativo não está conectado",
            "expired": "Solicitação expirada",
            "invalidRequest": "Solicitação inválida",
            "failedToReport": "Transação enviada mas falhou ao reportar ao aplicativo",
            "failedToReportCanceled": "Transação cancelada mas falhou ao reportar ao aplicativo"
        },
        "signatureRequest": {
            "title": "Assinatura solicitada",
            "subtitle": "Pressione para ver a solicitação"
        },
        "staking": {
            "earnings": "Ganhos",
            "title": "TON Staking",
            "balance": "Saldo de Staking",
            "subtitle": {
                "join": "Ganhe até {{apy}}% com TONs ou USDe",
                "joined": "Ganhe até {{apy}}%",
                "rewards": "Juros Estimados",
                "apy": "~13.3 APY da contribuição",
                "devPromo": "Multiplique suas moedas de teste"
            },
            "pools": {
                "title": "Pools de Staking",
                "active": "Ativo",
                "best": "Melhor",
                "alternatives": "Alternativo",
                "private": "Pools privadas",
                "restrictedTitle": "Pool restrita",
                "restrictedMessage": "Esta pool de staking está disponível apenas para membros do Clube Whales",
                "viewClub": "Ver Clube Whales",
                "nominators": "Nominadores",
                "nominatorsDescription": "Para todos",
                "club": "Clube",
                "clubDescription": "Para membros do Clube Whales",
                "team": "Equipe",
                "teamDescription": "Para membros da equipe Ton Whales e TOP 15 membros do Clube Whales",
                "joinClub": "Participar",
                "joinTeam": "Participar",
                "clubBanner": "Junte-se ao nosso Clube",
                "clubBannerLearnMore": "Saiba mais sobre nosso clube",
                "clubBannerDescription": "Para nossos membros do Clube Whales",
                "teamBanner": "Junte-se à nossa Equipe",
                "teamBannerLearnMore": "Saiba mais sobre nossa equipe",
                "teamBannerDescription": "Para nossa equipe e TOP 15 membros do Clube Whales",
                "epnPartners": "Parceiros ePN",
                "epnPartnersDescription": "Junte-se a mais de 200.000 webmasters",
                "moreAboutEPN": "Informações",
                "lockups": "Pool de Lockups",
                "lockupsDescription": "Permite que detentores de grandes lockups em TON ganhem renda adicional",
                "tonkeeper": "Tonkeeper",
                "tonkeeperDescription": "Carteira móvel amigável no TON",
                "liquid": "Staking Líquido",
                "liquidDescription": "Envie TON para staking e receba tokens wsTON em troca",
                "rateTitle": "Taxa de câmbio",
                "liquidUsde": "Staking USDe Líquido",
                "liquidUsdeDescription": "Envie USDe para staking e receba tokens tsUSDe em troca",
                "ethenaPoints": "Obtenha mais recompensas",
                "ethenaPointsDescription": "Complete a verificação para aumentar suas recompensas de staking",
            },
            "transfer": {
                "stakingWarning": "Você pode sempre depositar novo stake ou aumentar o existente com qualquer quantia. Note que o valor mínimo é: {{minAmount}}",
                "depositStakeTitle": "Staking",
                "depositStakeConfirmTitle": "Confirmar Staking",
                "withdrawStakeTitle": "Solicitação de Saque",
                "withdrawStakeConfirmTitle": "Confirmar Saque",
                "topUpTitle": "Depositar",
                "topUpConfirmTitle": "Confirmar Depósito",
                "notEnoughStaked": "infelizmente você não tem moedas suficientes em stake",
                "confirmWithdraw": "Solicitar Saque",
                "confirmWithdrawReady": "Sacar agora",
                "restrictedTitle": "Esta Pool de Staking é restrita",
                "restrictedMessage": "Seus fundos não participarão do staking se seu endereço de carteira não estiver na lista de permissões, mas estarão no saldo da pool e aguardando saque",
                "notEnoughCoinsFee": "Não há TON suficiente no saldo da sua carteira para pagar a taxa. Note que a taxa de {{amount}} TON deve estar no saldo principal, não no saldo de staking",
                "notEnoughCoins": "Não há fundos suficientes no saldo da sua carteira para aumentar o saldo de staking",
                "ledgerSignText": "Staking: {{action}}"
            },
            "nextCycle": "Próximo ciclo",
            "cycleNote": "Todas as transações entram em vigor quando o ciclo termina",
            "cycleNoteWithdraw": "Sua solicitação será executada após o término do ciclo. O saque precisará ser confirmado novamente.",
            "buttonTitle": "fazer stake",
            "balanceTitle": "Saldo de Staking",
            "actions": {
                "deposit": "Depositar",
                "top_up": "Depositar",
                "withdraw": "Sacar",
                "calc": "Calcular",
                "swap": "Trocar instantaneamente"
            },
            "join": {
                "title": "Torne-se um validador TON",
                "message": "Staking é um bem público para o ecossistema TON. Você pode ajudar a proteger a rede e ganhar recompensas no processo",
                "buttonTitle": "Começar a Ganhar",
                "moreAbout": "Mais sobre a Pool de Staking Ton Whales",
                "earn": "Ganhe até",
                "onYourTons": "em seus TONs",
                "apy": "13.3%",
                "yearly": "APY",
                "cycle": "Receba recompensas por staking a cada 36h",
                "ownership": "TONs em stake continuam seus",
                "withdraw": "Saque e Deposite a qualquer momento",
                "successTitle": "{{amount}} TON em stake",
                "successEtimation": "Seus ganhos anuais estimados são {{amount}}\u00A0TON\u00A0(${{price}}).",
                "successNote": "Seu TON em stake será ativado quando o próximo ciclo começar."
            },
            "pool": {
                "balance": "Stake Total",
                "members": "Nominadores",
                "profitability": "Rentabilidade"
            },
            "empty": {
                "message": "Você não tem transações"
            },
            "pending": "pendente",
            "withdrawStatus": {
                "pending": "Saque pendente",
                "ready": "Saque pronto",
                "withdrawNow": "Pressione para sacar agora"
            },
            "depositStatus": {
                "pending": "Depósito pendente"
            },
            "withdraw": "Sacar",
            "sync": "Baixando dados de staking",
            "unstake": {
                "title": "Tem certeza que deseja solicitar o saque?",
                "message": "Por favor, note que ao solicitar o saque todos os depósitos pendentes serão devolvidos também."
            },
            "unstakeLiquid": {
                "title": "Saque seu wsTON",
                "message": "Você pode sacar fundos diretamente após o fim do ciclo ou trocar instantaneamente wsTON por TON em "
            },
            "unstakeLiquidUsde": {
                "title": "Saque seu tsUSDe",
                "message": "Você pode sacar fundos diretamente após o fim do período de lockup (7 dias após a primeira solicitação de saque) ou trocar instantaneamente tsUSDe por USDe em "
            },
            "learnMore": "Informações",
            "moreInfo": "Mais informações",
            "calc": {
                "yearly": "Recompensas anuais",
                "monthly": "Recompensas mensais",
                "daily": "Recompensas diárias",
                "note": "Calculado incluindo todas as taxas",
                "text": "Calculadora de ganhos",
                "yearlyTopUp": "Lucro após recarga",
                "yearlyTotal": "Recompensas totais em um ano",
                "yearlyCurrent": "Lucro atual (em um ano)",
                "topUpTitle": "Suas recompensas anuais",
                "goToTopUp": "Ir para Recarga"
            },
            "info": {
                "rate": "até 13.3%",
                "rateTitle": "APY",
                "frequency": "A cada 36 horas",
                "frequencyTitle": "Frequência de Recompensa",
                "minDeposit": "Depósito mínimo",
                "poolFee": "3.3%",
                "poolFeeTitle": "Taxa da Pool",
                "depositFee": "Taxa de Depósito",
                "withdrawFee": "Taxa de Saque",
                "withdrawRequestFee": "Taxa de solicitação de saque",
                "withdrawCompleteFee": "Taxa de conclusão do saque",
                "depositFeeDescription": "Quantidade de TON que será deduzida do valor do depósito para cobrir as taxas da ação de depósito, o valor não utilizado será devolvido ao saldo da sua carteira",
                "withdrawFeeDescription": "Quantidade de transferência TON necessária para cobrir as taxas da ação de saque, o valor não utilizado será devolvido ao saldo da sua carteira",
                "withdrawCompleteDescription": "Quantidade de transferência TON necessária para cobrir as taxas da ação de conclusão do saque, o valor não utilizado será devolvido ao saldo da sua carteira",
                "blockchainFee": "Taxa da blockchain",
                "cooldownTitle": "Período simplificado",
                "cooldownActive": "Ativo",
                "cooldownInactive": "Inativo",
                "cooldownDescription": "Todas as transações têm efeito instantâneo durante este período",
                "cooldownAlert": "No início de cada ciclo de staking, o Período Simplificado está ativo. Durante este período você não precisa esperar o ciclo terminar para sacar ou recarregar - acontece instantaneamente, e você não precisa enviar uma segunda transação para sacar, o que reduz pela metade a taxa de saque. Você pode transferir fundos de uma pool para outra sem perder os lucros do ciclo se o Período Simplificado estiver ativo em ambas as pools",
                "lockedAlert": "Enquanto o ciclo de staking está em andamento, saques e depósitos ficam pendentes. Todas as transações têm efeito quando o ciclo termina"
            },
            "minAmountWarning": "Valor mínimo é {{minAmount}} TON",
            "tryAgainLater": "Por favor, tente novamente mais tarde",
            "banner": {
                "estimatedEarnings": "Seus ganhos anuais estimados diminuirão em {{amount}}\u00A0TON\u00A0({{price}})",
                "estimatedEarningsDev": "Seus ganhos anuais estimados diminuirão",
                "message": "Tem certeza sobre o unstaking?"
            },
            "activePools": "Pools ativas",
            "analytics": {
                "operations": "Operações",
                "operationsDescription": "Recarga e saque",
                "analyticsTitle": "Análises",
                "analyticsSubtitle": "Lucro total",
                "labels": {
                    "week": "1S",
                    "month": "1M",
                    "year": "1A",
                    "allTime": "Todos"
                }
            }
        },
        "holders": {
            "title": "Conta bancária",
            "loadingLongerTitle": "Problemas de conexão",
            "loadingLonger": "Verifique sua conexão com a internet e recarregue a página. Se o problema persistir, entre em contato com o suporte",
            "accounts": {
                "title": "Gastos",
                "prepaidTitle": "Cartões",
                "account": "Conta",
                "basicAccount": "Conta de despesas",
                "proAccount": "Conta pro",
                "noCards": "Sem cartões",
                "prepaidCard": "Cartão pré-pago Tonhub *{{lastFourDigits}}",
                "prepaidCardDescription": "Cartão recarregável para uso diário",
                "hiddenCards": "Cartões ocultos",
                "hiddenAccounts": "Contas ocultas",
                "primaryName": "Conta principal",
                "paymentName": "Conta de pagamento {{accountIndex}}",
                "topUp": "Recarregar conta",
                "addNew": "Adicionar conta",
                "network": "Rede {{networkName}}",
            },
            "pageTitles": {
                "general": "Cartões Tonhub",
                "card": "Cartão Tonhub",
                "cardDetails": "Detalhes do Cartão",
                "cardCredentials": "Detalhes do Cartão",
                "cardLimits": "Limites do Cartão {{cardNumber}}",
                "cardLimitsDefault": "Limites do Cartão",
                "cardDeposit": "Recarregar TON",
                "transfer": "Transferência",
                "cardSmartContract": "Contrato Inteligente do Cartão",
                "setUpCard": "Configurar o cartão",
                "pin": "Alterar PIN"
            },
            "card": {
                "card": "Cartão",
                "cards": "Cartões dos titulares",
                "title": "Cartão Tonhub {{cardNumber}}",
                "defaultSubtitle": "Pague com USDT ou TON em qualquer lugar com cartão",
                "defaultTitle": "Cartão Tonhub",
                "eurSubtitle": "Tonhub EUR",
                "type": {
                    "physical": "Cartão Físico",
                    "virtual": "Virtual"
                },
                "notifications": {
                    "type": {
                        "card_ready": "Cartão ativado",
                        "deposit": "Recarga do Cartão",
                        "charge": "Pagamento",
                        "charge_failed": "Pagamento",
                        "limits_change": {
                            "pending": "Alterando limites",
                            "completed": "Limites alterados"
                        },
                        "card_withdraw": "Transferência para carteira",
                        "contract_closed": "Contrato encerrado",
                        "card_block": "Cartão bloqueado",
                        "card_freeze": "Cartão congelado",
                        "card_unfreeze": "Cartão descongelado",
                        "card_paid": "Emissão do cartão bancário"
                    },
                    "category": {
                        "deposit": "Recarga",
                        "card_withdraw": "Transferência",
                        "charge": "Compras",
                        "charge_failed": "Compras",
                        "other": "Outros"
                    },
                    "status": {
                        "charge_failed": {
                            "limit": {
                                "onetime": "Falhou (acima do limite único)",
                                "daily": "Falhou (acima do limite diário)",
                                "monthly": "Falhou (acima do limite mensal)"
                            },
                            "failed": "Falhou"
                        },
                        "completed": "Concluído"
                    }
                }
            },
            "confirm": {
                "title": "Tem certeza que deseja fechar esta tela?",
                "message": "Esta ação descartará todas as suas alterações"
            },
            "enroll": {
                "poweredBy": "Baseado em TON, desenvolvido por ZenPay",
                "description_1": "Somente você gerencia o contrato inteligente",
                "description_2": "Ninguém além de você tem acesso aos seus fundos",
                "description_3": "Você é o verdadeiro dono do seu dinheiro",
                "moreInfo": "Mais sobre o Cartão ZenPay",
                "buttonSub": "KYC e emissão do cartão leva ~5 min",
                "failed": {
                    "title": "Falha na autorização",
                    "noAppData": "Sem dados do aplicativo",
                    "noDomainKey": "Sem chave de domínio",
                    "createDomainKey": "Durante a criação da chave de domínio",
                    "fetchToken": "Durante a busca do token",
                    "createSignature": "Durante a criação da assinatura"
                },
                "ledger": {
                    "confirmTitle": "Continuar com Ledger",
                    "confirmMessage": "Assine a autorização e confirme o endereço da carteira"
                }
            },
            "otpBanner": {
                "title": "Nova solicitação de pagamento",
                "accept": "Aceitar",
                "decline": "Recusar",
                "expired": "Expirado"
            },
            "banner": {
                "fewMore": "Apenas mais alguns passos",
                "ready": "Verificação concluída! Seu cartão está pronto!",
                "readyAction": "Obtenha agora",
                "emailAction": "Verifique seu e-mail",
                "kycAction": "Complete a verificação",
                "failedAction": "Verificação falhou"
            },
            "transaction": {
                "type": {
                    "cardReady": "Cartão ativado",
                    "accountReady": "Conta ativada",
                    "deposit": "Recarga de Conta",
                    "prepaidTopUp": "Recarga Pré-paga",
                    "payment": "Pagamento",
                    "decline": "Recusar",
                    "refund": "Reembolso",
                    "limitsChanging": "Alteração de limites",
                    "limitsChanged": "Limites alterados",
                    "cardWithdraw": "Transferir para carteira",
                    "contractClosed": "Contrato fechado",
                    "cardBlock": "Cartão bloqueado",
                    "cardFreeze": "Cartão congelado",
                    "cardUnfreeze": "Cartão descongelado",
                    "cardPaid": "Emissão de cartão bancário",
                    "unknown": "Desconhecido"
                },
                "rejectReason": {
                    "approve": "n/a",
                    "generic": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "fraud_or_ban": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "not_able_to_trace_back_to_original_transaction": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "do_not_honour": "Não podemos realizar a operação para este comerciante",
                    "card_not_effective": "A transação foi recusada porque seu cartão está atualmente bloqueado. Para prosseguir, desbloqueie seu cartão através do aplicativo móvel ou entre em contato com o suporte ao cliente para obter ajuda",
                    "expired_card": "Seu cartão atingiu a data de validade. Por favor, solicite um novo através do aplicativo móvel",
                    "incorrect_pin": "Parece haver um problema com seu PIN. Por favor, verifique os detalhes e tente novamente. Se o problema persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "cvc2_or_cvv2_incorrect": "O CVV não está correto. Por favor, verifique o código de três dígitos na parte de trás do seu cartão e tente novamente",
                    "incorrect_expiry_date": "A data de validade que você inseriu não está correta. Por favor, verifique a data de validade no seu cartão ou no aplicativo móvel e tente novamente",
                    "invalid_card_number": "O número do cartão que você inseriu não está correto. Por favor, verifique o número no seu cartão ou no aplicativo móvel e tente novamente",
                    "blocked_merchant_country_code": "Seu cartão não pode ser usado para transações neste país",
                    "insufficient_funds": "Você não tem fundos suficientes em sua conta para concluir esta transação. Por favor, recarregue sua conta e tente novamente",
                    "exceeds_contactless_payments_daily_limit": "A transação foi recusada porque excede seu limite diário de gastos. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente amanhã",
                    "exceeds_contactless_payments_monthly_limit": "A transação foi recusada porque excede seu limite mensal de gastos. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_contactless_payments_transaction_limit": "A transação foi recusada porque excede o valor máximo da transação. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "exceeds_contactless_payments_weekly_limit": "A transação foi recusada porque excede seu limite semanal de gastos. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_daily_overall_limit": "A transação foi recusada porque excede seu limite diário de gastos no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente amanhã",
                    "exceeds_internet_purchase_payments_daily_limit": "A transação foi recusada porque excede seu limite diário para transações na internet. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente amanhã",
                    "exceeds_internet_purchase_payments_monthly_limit": "A transação foi recusada porque excede seu limite mensal para transações na internet. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_internet_purchase_payments_transaction_limit": "A transação foi recusada porque excede o valor máximo da transação. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "exceeds_internet_purchase_payments_weekly_limit": "A transação foi recusada porque excede seu limite semanal para transações na internet. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_monthly_overall_limit": "A transação foi recusada porque excede seu limite mensal de gastos no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_purchases_daily_limit": "A transação foi recusada porque excede seu limite diário de gastos no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente amanhã",
                    "exceeds_purchases_monthly_limit": "A transação foi recusada porque excede seu limite mensal de gastos no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_purchases_transaction_limit": "A transação foi recusada porque excede o valor máximo da transação. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "exceeds_purchases_weekly_limit": "A transação foi recusada porque excede seu limite semanal de gastos no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_settlement_risk_limit": "A transação foi recusada porque excede o valor máximo da transação. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "exceeds_weekly_overall_limit": "A transação foi recusada porque excede seu limite semanal de gastos no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente novamente mais tarde",
                    "exceeds_withdrawal_amount_limit": "A transação foi recusada porque excede o limite de saque em dinheiro no cartão. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "exceeds_withdrawal_maximum_limit": "A transação foi recusada porque excede o limite de saque em dinheiro no cartão. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "exceeds_withdrawal_minimum_limit": "O valor da transação está incorreto",
                    "exceeds_withdrawals_daily_limit": "A transação foi recusada porque excede o limite diário de saque em dinheiro no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente amanhã",
                    "exceeds_withdrawals_monthly_limit": "A transação foi recusada porque excede o limite mensal de saque em dinheiro no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente mais tarde",
                    "exceeds_withdrawals_transaction_limit": "A transação foi recusada porque excede o limite de saque em dinheiro no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente amanhã",
                    "exceeds_withdrawals_weekly_limit": "A transação foi recusada porque excede o limite semanal de saque em dinheiro no cartão. Por favor, entre em contato com o suporte ao cliente para obter assistência ou tente mais tarde",
                    "transaction_not_permitted_to_card_holder": "Tipo de transação não suportado. Por favor, entre em contato com o comerciante",
                    "blocked_merchant_category_code": "Não podemos realizar a operação para este comerciante",
                    "blocked_merchant_id": "Não podemos realizar a operação para este comerciante",
                    "blocked_merchant_name": "Não podemos realizar a operação para este comerciante",
                    "blocked_terminal_id": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "no_card_record": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "suspected_fraud": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "token_not_effective": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "client_system_malfunction": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "system_malfunction": "Parece haver um problema. Por favor, tente novamente. Se o erro persistir, entre em contato com o suporte ao cliente para obter ajuda",
                    "contactless_payments_switched_off": "A transação foi recusada porque os pagamentos por aproximação estão atualmente desativados no seu cartão. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "internet_purchase_payments_switched_off": "A transação foi recusada porque as compras na internet estão atualmente desativadas no seu cartão. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "withdrawals_switched_off": "A transação foi recusada porque os saques em dinheiro estão atualmente desativados no seu cartão. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "purchases_switched_off": "A transação foi recusada porque as compras estão atualmente desativadas no seu cartão. Por favor, entre em contato com o suporte ao cliente para obter ajuda",
                    "advice_acknowledged_no_financial_liability_accepted": "Não podemos realizar a operação para este comerciante",
                    "merchant_without_3ds": "Não podemos realizar a operação para este comerciante"
                },
                "to": {
                    "single": "Para",
                    "prepaidCard": "Para cartão pré-pago",
                    "wallet": "Para carteira",
                    "account": "Para conta"
                },
                "from": {
                    "single": "De",
                    "prepaidCard": "De cartão pré-pago",
                    "wallet": "De carteira",
                    "account": "De conta"
                },
                "category": {
                    "transfers": "Saques",
                    "purchase": "Compra",
                    "cash": "Saques em dinheiro",
                    "other": "Outro",
                    "deposit": "Recargas"
                },
                "status": {
                    "failed": "Falhou",
                    "overOnetimeFailed": "Falhou (acima do limite por transação)",
                    "overDailyFailed": "Falhou (acima do limite diário)",
                    "overMonthlyFailed": "Falhou (acima do limite mensal)",
                    "complete": "Concluído"
                },
                "statsBlock": {
                    "title": "Transações",
                    "description": "Gastos em {{month}}",
                    "spent": "Gasto",
                    "in": "em {{month}}"
                },
                "list": {
                    "emptyText": "Ainda não há transações"
                },
                "single": {
                    "report": "Relatar um problema"
                },
                "pendingPopover": {
                    "title": "Transação pendente",
                    "cancelButtonText": "Mostrar detalhes da transação",
                    "text": "A validação da blockchain está em andamento. Isso pode levar alguns minutos"
                }
            }
        }
    },
    "welcome": {
        "title": "Tonhub",
        "titleDev": "Carteira Ton Sandbox",
        "subtitle": "Carteira TON simples e segura",
        "subtitleDev": "Carteira para desenvolvedores",
        "createWallet": "Obter uma nova carteira",
        "importWallet": "Já tenho uma",
        "slogan": "Este é o novo Tonhub",
        "sloganDev": "Este é o Ton Sandbox",
        "slide_1": {
            "title": "Protegida",
            "subtitle": "Contrato inteligente confiável, Touch/Face ID com senha e todas as transações em blockchain descentralizada"
        },
        "slide_2": {
            "title": "Com um cartão crypto incrível",
            "subtitle": "Peça seu cartão agora. Transferências internas e compras em minutos.\nTudo isso é um cartão Tonhub exclusivo"
        },
        "slide_3": {
            "title": "Rápida",
            "subtitle": "Graças à arquitetura única do TON, as transações acontecem em segundos"
        }
    },
    "legal": {
        "title": "Legal",
        "subtitle": "Li e aceito ",
        "create": "Criar backup",
        "createSubtitle": "Mantenha sua chave privada segura e não compartilhe com ninguém. É a única forma de acessar sua carteira se o dispositivo for perdido.",
        "privacyPolicy": "Política de Privacidade",
        "termsOfService": "Termos de Serviço"
    },
    "create": {
        "addNew": "Adicionar nova carteira",
        "inProgress": "Criando...",
        "backupTitle": "Sua Chave de Backup",
        "backupSubtitle": "Anote essas 24 palavras exatamente na mesma ordem e salve-as em um lugar seguro",
        "okSaved": "OK, salvei",
        "copy": "Copiar para área de transferência"
    },
    "import": {
        "title": "Digite a chave de backup",
        "subtitle": "Por favor, restaure o acesso à sua carteira digitando as 24 palavras secretas que você anotou ao criar a carteira",
        "fullSeedPlaceholder": "Digite as 24 palavras secretas",
        "fullSeedPaste": "Ou você pode colar a frase semente completa onde cada palavra é separada por um espaço"
    },
    "secure": {
        "title": "Proteja sua carteira",
        "titleUnprotected": "Seu dispositivo não está protegido",
        "subtitle": "Usamos biometria para autenticar transações para garantir que apenas você possa transferir suas moedas.",
        "subtitleUnprotected": "É altamente recomendável ativar a senha no seu dispositivo para proteger seus ativos.",
        "subtitleNoBiometrics": "É altamente recomendável ativar a biometria no seu dispositivo para proteger seus ativos. Usamos biometria para autenticar transações para garantir que apenas você possa transferir suas moedas.",
        "messageNoBiometrics": "É altamente recomendável ativar a biometria no seu dispositivo para proteger seus ativos.",
        "protectFaceID": "Ativar Face ID",
        "protectTouchID": "Ativar Touch ID",
        "protectBiometrics": "Ativar biometria",
        "protectPasscode": "Ativar senha do dispositivo",
        "upgradeTitle": "Atualização necessária",
        "upgradeMessage": "Por favor, permita que o aplicativo acesse as chaves da carteira para uma atualização. Nenhum fundo será transferido durante esta atualização. Certifique-se de ter feito backup de suas chaves.",
        "allowUpgrade": "Permitir atualização",
        "backup": "Fazer backup das palavras secretas",
        "onLaterTitle": "Configurar depois",
        "onLaterMessage": "Você pode configurar a proteção mais tarde nas configurações",
        "onLaterButton": "Configurar depois",
        "onBiometricsError": "Erro ao autenticar com biometria",
        "lockAppWithAuth": "Autenticar ao entrar no aplicativo",
        "methodPasscode": "senha",
        "passcodeSetupDescription": "O código PIN ajuda a proteger sua carteira contra acesso não autorizado"
    },
    "backup": {
        "title": "Sua frase de recuperação",
        "subtitle": "Anote essas 24 palavras na ordem fornecida abaixo e guarde-as em um lugar secreto e seguro."
    },
    "backupIntro": {
        "title": "Faça backup da sua carteira",
        "subtitle": "Tem certeza de que salvou suas 24 palavras secretas?",
        "saved": "Sim, eu salvei",
        "goToBackup": "Não, ir para backup"
    },
    "errors": {
        "incorrectWords": {
            "title": "Palavras incorretas",
            "message": "Você digitou palavras secretas incorretas. Por favor, verifique sua entrada e tente novamente."
        },
        "secureStorageError": {
            "title": "Erro de armazenamento seguro",
            "message": "Infelizmente não conseguimos salvar os dados."
        },
        "title": "Ooops",
        "invalidNumber": "Não, este não é um número real. Por favor, verifique sua entrada e tente novamente.",
        "codeTooManyAttempts": "Você tentou demais, tente novamente em 15 minutos.",
        "codeInvalid": "Não, o código inserido é inválido. Verifique o código e tente novamente.",
        "unknown": "Ops, é um erro desconhecido. Sinceramente não faço ideia do que está acontecendo. Você pode tentar desligar e ligar?"
    },
    "confirm": {
        "logout": {
            "title": "Tem certeza que deseja desconectar sua carteira deste aplicativo e excluir todos os seus dados do aplicativo?",
            "message": "Esta ação resultará na exclusão de todas as contas deste dispositivo. Certifique-se de ter feito backup de suas 24 palavras secretas antes de prosseguir."
        },
        "changeCurrency": "Alterar moeda principal para {{currency}}"
    },
    "neocrypto": {
        "buttonTitle": "comprar",
        "alert": {
            "title": "Como funciona o checkout",
            "message": "Preencha os campos obrigatórios -> Selecione a criptomoeda e especifique o endereço da carteira e o valor a comprar -> Prossiga para o checkout -> Digite seus dados de cobrança corretamente. Seu pagamento com cartão de crédito é processado com segurança pelos nossos Parceiros -> Conclua a compra. Não é necessária conta!"
        },
        "title": "Compre TON com cartão de crédito em USD, EUR e RUB",
        "description": "Você será direcionado para o Neocrypto. Os serviços relacionados a pagamentos são fornecidos pela Neocrypto, que é uma plataforma separada de propriedade de terceiros\n\nPor favor, leia e concorde com os Termos de Serviço da Neocrypto antes de usar o serviço",
        "doNotShow": "Não mostrar novamente para Neocrypto",
        "termsAndPrivacy": "Li e concordo com os ",
        "confirm": {
            "title": "Tem certeza que deseja fechar este formulário?",
            "message": "Esta ação descartará todas as suas alterações"
        }
    },
    "known": {
        "deposit": "Depositar",
        "depositOk": "Depósito aceito",
        "withdraw": "Solicitação de saque de {{coins}} TON",
        "withdrawAll": "Solicitar saque de todas as moedas",
        "withdrawLiquid": "Sacar",
        "withdrawCompleted": "Saque concluído",
        "withdrawRequested": "Saque solicitado",
        "upgrade": "Atualizar código para {{hash}}",
        "upgradeOk": "Atualização concluída",
        "cashback": "Cashback",
        "tokenSent": "Token enviado",
        "tokenReceived": "Token recebido",
        "holders": {
            "topUpTitle": "Valor de recarga",
            "accountTopUp": "Recarga de {{amount}} TON",
            "accountJettonTopUp": "Recarga de conta",
            "limitsChange": "Alteração de limites",
            "limitsTitle": "Limites",
            "limitsOneTime": "Por transação",
            "limitsDaily": "Diário",
            "limitsMonthly": "Mensal",
            "accountLimitsChange": "Alteração de limites da conta"
        }
    },
    "jetton": {
        "token": "token",
        "productButtonTitle": "Tokens",
        "productButtonSubtitle": "{{jettonName}} e {{count}} outros",
        "hidden": "Tokens ocultos",
        "liquidPoolDescriptionDedust": "Liquidez para {{name0}}/{{name1}} na DeDust DEX",
        "liquidPoolDescriptionStonFi": "Liquidez para {{name0}}/{{name1}} na STON.fi DEX",
        "emptyBalance": "Saldo vazio",
        "jettonsNotFound": "Nenhum token encontrado"
    },
    "connections": {
        "extensions": "Extensões",
        "connections": "Conexões"
    },
    "accounts": {
        "active": "Ativo",
        "noActive": "Sem contas ativas",
        "disabled": "Oculto",
        "alertActive": "Marcar {{symbol}} como ativo",
        "alertDisabled": "Marcar {{symbol}} como oculto",
        "description": "Para alterar o status de uma conta, pressione longamente o botão da conta na tela inicial ou pressione neste menu. A conta será adicionada à tela inicial ou ocultada.",
        "noAccounts": "Você ainda não tem contas"
    },
    "spamFilter": {
        "minAmount": "Valor mínimo de TON",
        "dontShowComments": "Não mostrar comentários em transações SPAM",
        "minAmountDescription": "Transações com valor de TON menor que {{amount}} serão automaticamente marcadas como SPAM",
        "applyConfig": "Aplicar configurações selecionadas do filtro de SPAM",
        "denyList": "Filtro manual de spam",
        "denyListEmpty": "Sem endereços bloqueados",
        "unblockConfirm": "Desbloquear endereço",
        "blockConfirm": "Marcar endereço como spam",
        "description": "Você pode facilmente adicionar o endereço à lista de endereços bloqueados manualmente clicando em qualquer transação ou endereço e selecionando a opção \"Marcar endereço como spam\" no menu pop-up"
    },
    "security": {
        "title": "Segurança",
        "passcodeSettings": {
            "setupTitle": "Configurar código PIN",
            "confirmTitle": "Confirmar código PIN",
            "changeTitle": "Alterar código PIN",
            "resetTitle": "Redefinir código PIN",
            "resetDescription": "Se você esqueceu seu código PIN, pode redefini-lo inserindo as 24 palavras secretas que você anotou ao criar a carteira.",
            "resetAction": "Redefinir",
            "error": "Código PIN incorreto",
            "tryAgain": "Tentar novamente",
            "success": "Código PIN configurado com sucesso",
            "enterNew": "Criar código PIN",
            "confirmNew": "Confirmar novo código PIN",
            "enterCurrent": "Digite seu código PIN",
            "enterPrevious": "Digite o código PIN atual",
            "enterNewDescription": "Definir uma senha fornece uma camada adicional de segurança ao usar o aplicativo",
            "changeLength": "Use código PIN de {{length}} dígitos",
            "forgotPasscode": "Esqueceu o código PIN?",
            "logoutAndReset": "Sair e redefinir código PIN"
        },
        "auth": {
            "biometricsPermissionCheck": {
                "title": "Permissão necessária",
                "message": "Por favor, permita que o aplicativo acesse a biometria para autenticação",
                "openSettings": "Abrir configurações",
                "authenticate": "Autenticar com código PIN"
            },
            "biometricsSetupAgain": {
                "title": "Nova biometria detectada",
                "message": "Por favor, configure a biometria novamente nas configurações de segurança",
                "setup": "Configurar",
                "authenticate": "Continuar com código PIN"
            },
            "biometricsCooldown": {
                "title": "Tempo de espera biométrico",
                "message": "Por favor, tente novamente mais tarde, ou bloqueie seu dispositivo e desbloqueie novamente com o código do dispositivo para ativar a biometria"
            },
            "biometricsCorrupted": {
                "title": "Biometria corrompida e nenhum código PIN definido",
                "message": "Infelizmente, sua carteira não está mais disponível. Para restaurar sua carteira, toque em \"Restaurar\" (você será desconectado da carteira atual) e digite suas 24 palavras secretas",
                "messageLogout": "Infelizmente, sua carteira não está mais disponível. Para restaurar sua carteira, toque em \"Sair\" (você será desconectado da carteira atual) e adicione sua carteira novamente",
                "logout": "Sair",
                "restore": "Restaurar"
            },
            "canceled": {
                "title": "Cancelado",
                "message": "A autenticação foi cancelada, tente novamente"
            }
        }
    },
    "report": {
        "title": "Denunciar",
        "scam": "golpe",
        "bug": "erro",
        "spam": "spam",
        "offense": "conteúdo ofensivo",
        "posted": "Sua denúncia foi enviada",
        "error": "Erro ao enviar denúncia",
        "message": "Mensagem (obrigatório)",
        "reason": "Motivo da denúncia"
    },
    "review": {
        "title": "Avaliar extensão",
        "rating": "avaliação",
        "review": "Avaliação (opcional)",
        "heading": "Título",
        "error": "Erro ao publicar avaliação",
        "posted": "Obrigado pelo seu feedback!",
        "postedDescription": "Sua avaliação será publicada após moderação"
    },
    "deleteAccount": {
        "title": "Tem certeza que deseja excluir a conta?",
        "action": "Excluir conta e todos os dados",
        "logOutAndDelete": "Sair e excluir todos os dados",
        "description": "Esta ação excluirá todos os dados e a carteira atualmente selecionada deste dispositivo e sua conta na blockchain\nVocê precisa transferir todos os seus TON coins para outra carteira. Antes de prosseguir, certifique-se de ter mais de {{amount}} TON em sua conta para completar a transação",
        "complete": "Exclusão da conta concluída",
        "error": {
            "hasNfts": "Você tem NFTs em sua carteira, para excluir a conta, envie-os para outra carteira.",
            "fetchingNfts": "Não foi possível verificar se há NFTs na carteira. Para excluir a conta, certifique-se de que não há NFTs nela.",
            "hasUSDTBalanceTitle": "Você tem saldo USDT em sua carteira",
            "hasUSDTBalanceMessage": "Para excluir a conta, envie-os para outra carteira."
        },
        "confirm": {
            "title": "Tem certeza que deseja excluir sua conta e todos os dados deste aplicativo?",
            "message": "Esta ação excluirá sua conta e todos os dados deste aplicativo e transferirá todos os seus TON coins para o endereço da carteira especificado.\nPor favor, verifique cuidadosamente o endereço do destinatário antes de prosseguir. A taxa padrão da blockchain será cobrada por esta transação."
        },
        "checkRecipient": "Verificar destinatário",
        "checkRecipientDescription": "Para tornar sua conta inativa, você precisa transferir todos os fundos para outra carteira (endereço do destinatário). Por favor, verifique o endereço cuidadosamente antes de prosseguir"
    },
    "logout": {
        "title": "Tem certeza que deseja sair de {{name}}?",
        "logoutDescription": "O acesso à carteira será desativado. Você salvou sua chave privada?"
    },
    "contacts": {
        "title": "Contatos",
        "contact": "Contato",
        "unknown": "Desconhecido",
        "contacts": "Meus contatos",
        "name": "Nome",
        "lastName": "Sobrenome",
        "company": "Empresa",
        "add": "Adicionar Contato",
        "edit": "Editar",
        "save": "Salvar",
        "notes": "Notas",
        "alert": {
            "name": "Nome incorreto",
            "nameDescription": "O nome do contato não pode estar vazio ou ter mais de 126 caracteres",
            "notes": "Campo incorreto",
            "notesDescription": "Os campos do contato não podem ter mais de 280 caracteres"
        },
        "delete": "Excluir contato",
        "empty": "Nenhum contato ainda",
        "description": "Você pode adicionar um endereço aos seus contatos pressionando longamente em qualquer transação ou endereço, usando o botão \"Adicionar\" ou pela lista de contatos recentes abaixo",
        "contactAddress": "Endereço dos contatos",
        "search": "Nome ou endereço da carteira",
        "new": "Novo contato"
    },
    "currency": {
        "USD": "Dólar americano",
        "EUR": "Euro",
        "RUB": "Rublo russo",
        "GBP": "Libra esterlina",
        "CHF": "Franco suíço",
        "CNY": "Yuan chinês",
        "KRW": "Won sul-coreano",
        "IDR": "Rupia indonésia",
        "INR": "Rupia indiana",
        "JPY": "Iene japonês"
    },
    "txActions": {
        "addressShare": "Compartilhar endereço",
        "addressContact": "Adicionar endereço aos contatos",
        "addressContactEdit": "Editar contato do endereço",
        "addressMarkSpam": "Marcar endereço como spam",
        "txShare": "Compartilhar transação",
        "txRepeat": "Repetir transação",
        "view": "Ver no explorador",
        "share": {
            "address": "Endereço TON",
            "transaction": "Transação TON"
        }
    },
    "hardwareWallet": {
        "ledger": "Ledger",
        "title": "Conectar Ledger",
        "description": "Sua carteira física Ledger",
        "installationIOS": "Desbloqueie o Ledger, conecte-o ao seu smartphone via Bluetooth e permita o acesso do Tonhub.",
        "installationAndroid": "Desbloqueie o Ledger, conecte-o ao seu smartphone via Bluetooth ou cabo USB e permita o acesso do Tonhub.",
        "installationGuide": "Guia de conexão do Ledger TON",
        "connectionDescriptionAndroid": "Conecte seu Ledger via USB ou Bluetooth",
        "connectionDescriptionIOS": "Conecte seu Ledger via Bluetooth",
        "connectionHIDDescription_1": "1. Ligue seu Ledger e desbloqueie-o",
        "connectionHIDDescription_2": "2. Pressione \"Continuar\"",
        "openTheAppDescription": "Abra o aplicativo TON no seu Ledger",
        "unlockLedgerDescription": "Desbloqueie seu Ledger",
        "chooseAccountDescription": "Selecione a conta que deseja usar",
        "bluetoothScanDescription_1": "1. Ligue seu Ledger e desbloqueie-o",
        "bluetoothScanDescription_2": "2. Certifique-se de que o Bluetooth está ativado",
        "bluetoothScanDescription_3": "3. Pressione \"Procurar\" para buscar dispositivos disponíveis e selecione o Ledger Nano X adequado",
        "bluetoothScanDescription_3_and": "3. Pressione \"Procurar\" para buscar dispositivos (precisaremos de acesso à localização do dispositivo e permissão para procurar dispositivos próximos)",
        "bluetoothScanDescription_4_and": "4. Em seguida, selecione o Ledger Nano X adequado",
        "openAppVerifyAddress": "Verifique o endereço da conta que você selecionou e depois confirme o endereço com o aplicativo Ledger Ton quando solicitado",
        "devices": "Seus dispositivos",
        "connection": "Conexão",
        "actions": {
            "connect": "Conectar Ledger",
            "selectAccount": "Selecionar conta",
            "account": "Conta #{{account}}",
            "loadAddress": "Verificar endereço",
            "connectHid": "Conectar Ledger via USB",
            "connectBluetooth": "Conectar Ledger via Bluetooth",
            "scanBluetooth": "Procurar novamente",
            "confirmOnLedger": "Verificar no Ledger",
            "sending": "Aguardando transação",
            "sent": "Transação enviada",
            "mainAddress": "Endereço principal",
            "givePermissions": "Dar permissões"
        },
        "confirm": {
            "add": "Tem certeza que deseja adicionar este aplicativo?",
            "remove": "Tem certeza que deseja remover este aplicativo?"
        },
        "errors": {
            "bleTitle": "Erro de Bluetooth",
            "noDevice": "Nenhum dispositivo encontrado",
            "appNotOpen": "Aplicativo Ton não está aberto no Ledger",
            "openApp": "Por favor, abra o aplicativo Ton no seu Ledger",
            "turnOnBluetooth": "Por favor, ative o Bluetooth e tente novamente",
            "lostConnection": "Conexão com Ledger perdida",
            "transactionNotFound": "Transação não encontrada",
            "transactionRejected": "Transação rejeitada",
            "transferFailed": "Transferência falhou",
            "permissions": "Por favor, permita acesso ao bluetooth e localização",
            "unknown": "Erro desconhecido",
            "reboot": "Por favor, reinicie seu dispositivo e tente novamente",
            "turnOnLocation": "Por favor, ative os serviços de localização e tente novamente, isso é necessário para procurar dispositivos próximos",
            "locationServicesUnauthorized": "Serviços de localização não autorizados",
            "bluetoothScanFailed": "Busca por Bluetooth falhou",
            "unsafeTransfer": "Por favor, permita a assinatura cega no aplicativo TON Ledger",
            "userCanceled": "Rejeitado no Ledger",
            "updateApp": "Por favor, atualize o aplicativo TON no Ledger Live para a versão mais recente",
            "permissionsIos": "Por favor, permita o acesso ao Bluetooth"
        },
        "moreAbout": "Mais sobre Ledger",
        "verifyAddress": {
            "title": "Confirmar endereço no Ledger",
            "message": "Por favor, verifique o endereço: {{address}} no seu dispositivo Ledger",
            "action": "Confirmar",
            "invalidAddressTitle": "Endereço inválido",
            "invalidAddressMessage": "Este endereço não é válido. Por favor, verifique o endereço e tente novamente",
            "failed": "Falha ao verificar endereço",
            "failedMessage": "Por favor, reconecte o Ledger e tente novamente",
            "verifying": "Confirmar no Ledger"
        }
    },
    "devTools": {
        "switchNetwork": "Rede",
        "switchNetworkAlertTitle": "Mudando para rede {{network}}",
        "switchNetworkAlertMessage": "Tem certeza que deseja mudar de rede?",
        "switchNetworkAlertAction": "Mudar",
        "copySeed": "Copiar frase semente de 24 palavras",
        "copySeedAlertTitle": "Copiando frase semente de 24 palavras para área de transferência",
        "copySeedAlertMessage": "AVISO! Copiar frase semente de 24 palavras para área de transferência não é seguro. Prossiga por sua conta e risco.",
        "copySeedAlertAction": "Copiar",
        "holdersOfflineApp": "Aplicativo Offline Holders"
    },
    "wallets": {
        "choose_versions": "Escolha carteiras para adicionar",
        "noVersionTitle": "Selecione uma versão",
        "noVersionDescription": "Nenhuma versão de carteira selecionada",
        "switchToAlertTitle": "Mudando para {{wallet}}",
        "switchToAlertMessage": "Tem certeza que deseja mudar de carteira?",
        "switchToAlertAction": "Mudar",
        "addNewTitle": "Adicionar carteira",
        "addNewAlertTitle": "Adicionando nova carteira",
        "addNewAlertMessage": "Tem certeza que deseja adicionar nova carteira?",
        "addNewAlertAction": "Adicionar",
        "alreadyExistsAlertTitle": "Carteira já existe",
        "alreadyExistsAlertMessage": "Carteira com este endereço já existe",
        "settings": {
            "changeAvatar": "Alterar avatar",
            "selectAvatarTitle": "Imagem",
            "selectColorTitle": "Cor de fundo"
        }
    },
    "webView": {
        "checkInternetAndReload": "Por favor, verifique sua conexão com a internet e tente recarregar a página",
        "contactSupportOrTryToReload": "Entre em contato com o suporte ou tente recarregar a página",
        "contactSupport": "Contatar suporte"
    },
    "appAuth": {
        "description": "Para continuar o login no aplicativo"
    },
    "screenCapture": {
        "title": "Uau, ótima captura de tela, mas não é seguro",
        "description": "Cópias digitais não criptografadas da sua frase secreta NÃO são recomendadas. Exemplos incluem salvar cópias no computador, em contas online ou tirar capturas de tela",
        "action": "OK, estou assumindo o risco"
    },
    "onboarding": {
        "avatar": "Aqui você pode alterar o avatar e nome das suas carteiras",
        "wallet": "Aqui você pode adicionar novas carteiras ou alternar entre elas",
        "price": "Aqui você pode alterar sua moeda principal"
    },
    "newAddressFormat": {
        "title": "Formato de endereço",
        "fragmentTitle": "Novo tipo de endereços",
        "learnMore": "Mais sobre novos endereços",
        "shortDescription": "A atualização de endereço tornará a blockchain TON ainda mais segura e estável. Todos os ativos enviados para seu endereço antigo continuarão fluindo para sua carteira.",
        "description_0_0": "Recentemente, TON ",
        "description_0_link": "anunciou esta atualização",
        "description_0_1": " para endereços e solicitou que todas as carteiras a suportem.",
        "title_1": "Por quê?",
        "description_1": "A atualização permite que desenvolvedores distingam entre endereços de carteira e contrato e evitem erros ao enviar transações.",
        "title_2": "O que você precisa fazer?",
        "description_2": "Clique no botão na tela anterior e nos autorize a exibir todos os endereços no aplicativo no novo formato. Você poderá reverter para o formato antigo nas suas configurações.",
        "title_3": "O que acontece com o endereço antigo?",
        "description_3": "Todos os TONs, tokens, NFTs e outros ativos enviados para seu endereço antigo continuarão fluindo para sua carteira.",
        "description_4": "Detalhes técnicos da atualização podem ser encontrados em",
        "action": "Usar {{format}}",
        "oldAddress": "Endereço antigo",
        "newAddress": "Novo endereço",
        "bannerTitle": "Atualize seu endereço",
        "bannerDescription": "De EQ para UQ"
    },
    "changelly": {
        "bannerTitle": "Depósitos de USDT e USDC",
        "bannerDescription": "Disponíveis Tron, Solana, Ethereum, Polygon!"
    },
    "w5": {
        "banner": {
            "title": "Adicionar carteira W5",
            "description": "Transferir USDT sem taxa"
        },
        "update": {
            "title": "Atualizar carteira para W5",
            "subtitle_1": "Transferências USDT sem taxa",
            "description_1": "Você não precisa mais de TON para enviar USDT. As taxas de transação podem ser cobertas com seu saldo de tokens.",
            "subtitle_2": "Economize em taxas",
            "description_2": "W5 permite aumentar o número de operações em uma única transação em 60 vezes e economizar significativamente em taxas.",
            "subtitle_3": "Sua frase semente permanece inalterada",
            "description_3": "Carteiras V4 e W5 têm a mesma frase semente. Você pode sempre alternar versões selecionando o endereço desejado no topo da tela principal.",
            "switch_button": "Mudar para W5"
        },
        "gaslessInfo": "TON não é necessário para pagar taxa quando enviar este token. A taxa será deduzida diretamente do seu saldo de tokens."
    },
    "browser": {
        "listings": {
            "categories": {
                "other": "Outros",
                "exchange": "Exchanges",
                "defi": "DeFi",
                "nft": "NFT",
                "games": "Jogos",
                "social": "Social",
                "utils": "Utilitários",
                "services": "Serviços"
            },
            "title": "Para você"
        },
        "refresh": "Recarregar",
        "back": "Voltar",
        "forward": "Avançar",
        "share": "Compartilhar",
        "search": {
            "placeholder": "Pesquisar",
            "invalidUrl": "URL inválida",
            "urlNotReachable": "URL não está acessível",
            "suggestions": {
                "web": "Pesquisar no {{engine}}",
                "ddg": "DuckDuckGo",
                "google": "Google"
            }
        },
        "alertModal": {
            "message": "Você está prestes a abrir um aplicativo web de terceiros. Não nos responsabilizamos pelo conteúdo ou segurança de aplicativos de terceiros.",
            "action": "Abrir"
        }
    },
    "swap": {
        "title": "DeDust.io — AMM DEX na The Open Network",
        "description": "Você está prestes a usar um serviço Dedust.io operado por uma parte independente não afiliada ao Tonhub\nVocê deve concordar com os Termos de Uso e Política de Privacidade para continuar",
        "termsAndPrivacy": "Li e concordo com os ",
        "dontShowTitle": "Não mostrar novamente para DeDust.io"
    },
    "mandatoryAuth": {
        "title": "Verifique seu backup",
        "description": "Ative a verificação ao abrir a carteira. Isso ajudará a manter os dados do seu cartão bancário seguros.",
        "alert": "Anote as 24 palavras secretas na seção Segurança das configurações da sua carteira. Isso ajudará você a recuperar o acesso caso perca seu telefone ou esqueça seu código PIN.",
        "confirmDescription": "Anotei as 24 palavras secretas da minha carteira e as guardei em um lugar seguro",
        "action": "Ativar",
        "settingsDescription": "A solicitação de autenticação é necessária pois o aplicativo exibe produtos bancários. Os dados sensíveis ficarão ocultos até você ativar a autenticação"
    },
    "update": {
        "callToAction": "Atualizar Tonhub"
    },
    "savings": {
        "ton": "Conta poupança TON",
        "usdt": "Conta poupança USDT",
        "general": "Conta poupança {{symbol}}"
    },
    "spending": {
        "ton": "Conta de gastos TON",
        "usdt": "Conta de gastos USDT",
        "general": "Conta de gastos {{symbol}}"
    },
    "solana": {
        "instructions": {
            "createAssociatedTokenAccount": "Criar conta de token associada",
            "unknown": "Instrução desconhecida",
            "systemTransfer": "Transferência de SOL",
            "createAccount": "Criar conta",
            "tokenTransfer": "Transferência de token",
            "depositCard": "Depósito no cartão",
            "closeCard": "Fechar cartão",
            "updateCardLimits": "Atualizar limites do cartão"
        },
        "banner": {
            "title": "Solana está disponível",
            "description": "Receba, armazene e envie SOL e USDC"
        }
    },
    "iban": {
        "banner": {
            "title": "Depósitos via IBAN",
            "description": "Obtenha acesso antecipado"
        }
    }
};

export default schema;
