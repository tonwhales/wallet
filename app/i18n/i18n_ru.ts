import { LocalizationSchema, PrepareSchema } from "./schema";

const schema: PrepareSchema<LocalizationSchema, '_0' | '_1' | '_2'> = {
    lang: 'ru',
    common: {
        and: 'и',
        accept: 'Принимаю',
        start: 'Начать',
        continue: 'Продолжить',
        back: 'Назад'
    },
    welcome: {
        title: 'Tonhub',
        titleDev: 'Ton Development Wallet',
        subtitle: 'Простой и безопасный кошелек для TON',
        subtitleDev: 'Кошелек для разработчиков',
        createWallet: 'Создать кошелек',
        importWallet: 'Импортировать кошелек'
    },
    legal: {
        title: 'Правовая информация',
        subtitle: 'Пожалуйста, примите нашу',
        privacyPolicy: 'политику конфиденциальности',
        termsOfService: 'условия использования'
    },
    create: {
        inProgress: 'Создаем...'
    }
};

export default schema;