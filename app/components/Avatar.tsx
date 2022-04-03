import * as React from 'react';
import { View } from 'react-native';
import { avatarHash } from '../utils/avatarHash';

import Img_ant from '../../assets/images/img_ant.svg';
import Img_antelope from '../../assets/images/img_antelope.svg';
import Img_bass from '../../assets/images/img_bass.svg';
import Img_bat from '../../assets/images/img_bat.svg';
import Img_bear from '../../assets/images/img_bear.svg';
import Img_beaver from '../../assets/images/img_beaver.svg';
import Img_bee from '../../assets/images/img_bee.svg';
import Img_beetle from '../../assets/images/img_beetle.svg';
import Img_boar from '../../assets/images/img_boar.svg';
import Img_bull from '../../assets/images/img_bull.svg';
import Img_butterfly from '../../assets/images/img_butterfly.svg';
import Img_camel from '../../assets/images/img_camel.svg';
import Img_cat from '../../assets/images/img_cat.svg';
import Img_chameleon from '../../assets/images/img_chameleon.svg';
import Img_chicken from '../../assets/images/img_chicken.svg';
import Img_clam from '../../assets/images/img_clam.svg';
import Img_cobra from '../../assets/images/img_cobra.svg';
import Img_cock from '../../assets/images/img_cock.svg';
import Img_cockroach from '../../assets/images/img_cockroach.svg';
import Img_cow from '../../assets/images/img_cow.svg';
import Img_crab from '../../assets/images/img_crab.svg';
import Img_croc from '../../assets/images/img_croc.svg';
import Img_crow from '../../assets/images/img_crow.svg';
import Img_deer from '../../assets/images/img_deer.svg';
import Img_dodo from '../../assets/images/img_dodo.svg';
import Img_dog from '../../assets/images/img_dog.svg';
import Img_dolphin from '../../assets/images/img_dolphin.svg';
import Img_dragon from '../../assets/images/img_dragon.svg';
import Img_duck from '../../assets/images/img_duck.svg';
import Img_eagle from '../../assets/images/img_eagle.svg';
import Img_elk from '../../assets/images/img_elk.svg';
import Img_falcon from '../../assets/images/img_falcon.svg';
import Img_fish from '../../assets/images/img_fish.svg';
import Img_flamingo from '../../assets/images/img_flamingo.svg';
import Img_fly from '../../assets/images/img_fly.svg';
import Img_fox from '../../assets/images/img_fox.svg';
import Img_frog from '../../assets/images/img_frog.svg';
import Img_gecko from '../../assets/images/img_gecko.svg';
import Img_giraffe from '../../assets/images/img_giraffe.svg';
import Img_gnat from '../../assets/images/img_gnat.svg';
import Img_gnu from '../../assets/images/img_gnu.svg';
import Img_goat from '../../assets/images/img_goat.svg';
import Img_goose from '../../assets/images/img_goose.svg';
import Img_gopher from '../../assets/images/img_gopher.svg';
import Img_gorilla from '../../assets/images/img_gorilla.svg';
import Img_griffin from '../../assets/images/img_griffin.svg';
import Img_gull from '../../assets/images/img_gull.svg';
import Img_hamster from '../../assets/images/img_hamster.svg';
import Img_hare from '../../assets/images/img_hare.svg';
import Img_hawk from '../../assets/images/img_hawk.svg';
import Img_hedgehog from '../../assets/images/img_hedgehog.svg';
import Img_heron from '../../assets/images/img_heron.svg';
import Img_horse from '../../assets/images/img_horse.svg';
import Img_hyena from '../../assets/images/img_hyena.svg';
import Img_ibex from '../../assets/images/img_ibex.svg';
import Img_jackal from '../../assets/images/img_jackal.svg';
import Img_jaguar from '../../assets/images/img_jaguar.svg';
import Img_kangaroo from '../../assets/images/img_kangaroo.svg';
import Img_kitten from '../../assets/images/img_kitten.svg';
import Img_kiwi from '../../assets/images/img_kiwi.svg';
import Img_ladybird from '../../assets/images/img_ladybird.svg';
import Img_lemur from '../../assets/images/img_lemur.svg';
import Img_leopard from '../../assets/images/img_leopard.svg';
import Img_lion from '../../assets/images/img_lion.svg';
import Img_lizard from '../../assets/images/img_lizard.svg';
import Img_llama from '../../assets/images/img_llama.svg';
import Img_lynx from '../../assets/images/img_lynx.svg';
import Img_mammoth from '../../assets/images/img_mammoth.svg';
import Img_mantis from '../../assets/images/img_mantis.svg';
import Img_meerkat from '../../assets/images/img_meerkat.svg';
import Img_mink from '../../assets/images/img_mink.svg';
import Img_monkey from '../../assets/images/img_monkey.svg';
import Img_moth from '../../assets/images/img_moth.svg';
import Img_mule from '../../assets/images/img_mule.svg';
import Img_otter from '../../assets/images/img_otter.svg';
import Img_owl from '../../assets/images/img_owl.svg';
import Img_panda from '../../assets/images/img_panda.svg';
import Img_parrot from '../../assets/images/img_parrot.svg';
import Img_peacock from '../../assets/images/img_peacock.svg';
import Img_penguin from '../../assets/images/img_penguin.svg';
import Img_phoenix from '../../assets/images/img_phoenix.svg';
import Img_pigeon from '../../assets/images/img_pigeon.svg';
import Img_piranha from '../../assets/images/img_piranha.svg';
import Img_pony from '../../assets/images/img_pony.svg';
import Img_puffin from '../../assets/images/img_puffin.svg';
import Img_pug from '../../assets/images/img_pug.svg';
import Img_puma from '../../assets/images/img_puma.svg';
import Img_python from '../../assets/images/img_python.svg';
import Img_quokka from '../../assets/images/img_quokka.svg';
import Img_rabbit from '../../assets/images/img_rabbit.svg';
import Img_raccoon from '../../assets/images/img_raccoon.svg';
import Img_ram from '../../assets/images/img_ram.svg';
import Img_rat from '../../assets/images/img_rat.svg';
import Img_raven from '../../assets/images/img_raven.svg';
import Img_rhino from '../../assets/images/img_rhino.svg';
import Img_scorpion from '../../assets/images/img_scorpion.svg';
import Img_seal from '../../assets/images/img_seal.svg';
import Img_shark from '../../assets/images/img_shark.svg';
import Img_sheep from '../../assets/images/img_sheep.svg';
import Img_shrimp from '../../assets/images/img_shrimp.svg';
import Img_skunk from '../../assets/images/img_skunk.svg';
import Img_sloth from '../../assets/images/img_sloth.svg';
import Img_snail from '../../assets/images/img_snail.svg';
import Img_spider from '../../assets/images/img_spider.svg';
import Img_squid from '../../assets/images/img_squid.svg';
import Img_squirrel from '../../assets/images/img_squirrel.svg';
import Img_starfish from '../../assets/images/img_starfish.svg';
import Img_swallow from '../../assets/images/img_swallow.svg';
import Img_swan from '../../assets/images/img_swan.svg';
import Img_tapir from '../../assets/images/img_tapir.svg';
import Img_tiger from '../../assets/images/img_tiger.svg';
import Img_toad from '../../assets/images/img_toad.svg';
import Img_turkey from '../../assets/images/img_turkey.svg';
import Img_turtle from '../../assets/images/img_turtle.svg';
import Img_unicorn from '../../assets/images/img_unicorn.svg';
import Img_walrus from '../../assets/images/img_walrus.svg';
import Img_wasp from '../../assets/images/img_wasp.svg';
import Img_whale from '../../assets/images/img_whale.svg';
import Img_wolf from '../../assets/images/img_wolf.svg';
import Img_wombat from '../../assets/images/img_wombat.svg';
import Img_yak from '../../assets/images/img_yak.svg';
import Img_zebra from '../../assets/images/img_zebra.svg';

import Img_EXMO from '../../assets/images/EXMO.svg';
import Img_Foundation from '../../assets/images/Foundation.svg';
import Img_Whales from '../../assets/images/Whales.svg';
import Img_OKX from '../../assets/images/OKX.svg';
import Img_FTX from '../../assets/images/FTX.svg';
import { Address } from 'ton';
import { AppConfig } from '../AppConfig';

export const avatarImages = [
    Img_ant,
    Img_antelope,
    Img_bass,
    Img_bat,
    Img_bear,
    Img_beaver,
    Img_bee,
    Img_beetle,
    Img_boar,
    Img_bull,
    Img_butterfly,
    Img_camel,
    Img_cat,
    Img_chameleon,
    Img_chicken,
    Img_clam,
    Img_cobra,
    Img_cock,
    Img_cockroach,
    Img_cow,
    Img_crab,
    Img_croc,
    Img_crow,
    Img_deer,
    Img_dodo,
    Img_dog,
    Img_dolphin,
    Img_dragon,
    Img_duck,
    Img_eagle,
    Img_elk,
    Img_falcon,
    Img_fish,
    Img_flamingo,
    Img_fly,
    Img_fox,
    Img_frog,
    Img_gecko,
    Img_giraffe,
    Img_gnat,
    Img_gnu,
    Img_goat,
    Img_goose,
    Img_gopher,
    Img_gorilla,
    Img_griffin,
    Img_gull,
    Img_hamster,
    Img_hare,
    Img_hawk,
    Img_hedgehog,
    Img_heron,
    Img_horse,
    Img_hyena,
    Img_ibex,
    Img_jackal,
    Img_jaguar,
    Img_kangaroo,
    Img_kitten,
    Img_kiwi,
    Img_ladybird,
    Img_lemur,
    Img_leopard,
    Img_lion,
    Img_lizard,
    Img_llama,
    Img_lynx,
    Img_mammoth,
    Img_mantis,
    Img_meerkat,
    Img_mink,
    Img_monkey,
    Img_moth,
    Img_mule,
    Img_otter,
    Img_owl,
    Img_panda,
    Img_parrot,
    Img_peacock,
    Img_penguin,
    Img_phoenix,
    Img_pigeon,
    Img_piranha,
    Img_pony,
    Img_puffin,
    Img_pug,
    Img_puma,
    Img_python,
    Img_quokka,
    Img_rabbit,
    Img_raccoon,
    Img_ram,
    Img_rat,
    Img_raven,
    Img_rhino,
    Img_scorpion,
    Img_seal,
    Img_shark,
    Img_sheep,
    Img_shrimp,
    Img_skunk,
    Img_sloth,
    Img_snail,
    Img_spider,
    Img_squid,
    Img_squirrel,
    Img_starfish,
    Img_swallow,
    Img_swan,
    Img_tapir,
    Img_tiger,
    Img_toad,
    Img_turkey,
    Img_turtle,
    Img_unicorn,
    Img_walrus,
    Img_wasp,
    Img_whale,
    Img_wolf,
    Img_wombat,
    Img_yak,
    Img_zebra,
];

export const KnownWallets: { [key: string]: { name: string, ic?: any, color?: string } } = {
    [Address.parse('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N').toFriendly()]: { name: 'TON Foundation', color: '#D55F5F', ic: Img_Foundation },

    [Address.parse('EQABMMdzRuntgt9nfRB61qd1wR-cGPagXA3ReQazVYUNrT7p').toFriendly()]: { name: 'EXMO Deposit', color: '#D5AD5F', ic: Img_EXMO },
    [Address.parse('EQB5lISMH8vLxXpqWph7ZutCS4tU4QdZtrUUpmtgDCsO73JR').toFriendly()]: { name: 'EXMO Withdraw', color: '#D5AD5F', ic: Img_EXMO },
    [Address.parse('EQCNGVeTuq2aCMRtw1OuvpmTQdq9B3IblyXxnhirw9ENkhLa').toFriendly()]: { name: 'EXMO Cold', color: '#D5AD5F', ic: Img_EXMO },
    [Address.parse('EQBfAN7LfaUYgXZNw5Wc7GBgkEX2yhuJ5ka95J1JJwXXf4a8').toFriendly()]: { name: 'OKX', color: '#76C84D', ic: Img_OKX },
    [Address.parse('EQCzFTXpNNsFu8IgJnRnkDyBCL2ry8KgZYiDi3Jt31ie8EIQ').toFriendly()]: { name: 'FTX', color: '#8E85EE', ic: Img_FTX },
    [Address.parse('EQDd3NPNrWCvTA1pOJ9WetUdDCY_pJaNZVq0JMaara-TIp90').toFriendly()]: { name: 'FTX 2', color: '#8E85EE', ic: Img_FTX },

    [Address.parse('EQAAFhjXzKuQ5N0c96nsdZQWATcJm909LYSaCAvWFxVJP80D').toFriendly()]: { name: 'Whales Pool', color: '#5FBED5', ic: Img_Whales },
    [Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales').toFriendly()]: { name: 'Whales Staking Pool', color: '#5FBED5', ic: Img_Whales },
    [Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs').toFriendly({ testOnly: AppConfig.isTestnet })]: { name: 'Whales Staking Pool', color: '#5FBED5', ic: Img_Whales },
    [Address.parse('EQBeNwQShukLyOWjKWZ0Oxoe5U3ET-ApQIWYeC4VLZ4tmeTm').toFriendly()]: { name: 'Whales Pool Withdraw 1', color: '#5FBED5', ic: Img_Whales },
    [Address.parse('EQAQwQc4N7k_2q1ZQoTOi47_e5zyVCdEDrL8aCdi4UcTZef4').toFriendly()]: { name: 'Whales Pool Withdraw 2', color: '#5FBED5', ic: Img_Whales },
    [Address.parse('EQDQA68_iHZrDEdkqjJpXcVqEM3qQC9u0w4nAhYJ4Ddsjttc').toFriendly()]: { name: 'Whales Pool Withdraw 3', color: '#5FBED5', ic: Img_Whales },
    [Address.parse('EQCr1U4EVmSWpx2sunO1jhtHveatorjfDpttMCCkoa0JyD1P').toFriendly()]: { name: 'Whales Pool Withdraw 4', color: '#5FBED5', ic: Img_Whales },
    [Address.parse('EQAB_3oC0MH1r4fz1kztk6Nhq9GFQnrBUgObzrhyAXjzzjrc').toFriendly()]: { name: 'Whales Pool Withdraw 5', color: '#5FBED5', ic: Img_Whales },
}

export const avatarColors = [
    '#294659',
    '#e56555',
    '#f28c48',
    '#8e85ee',
    '#76c84d',
    '#5fbed5',
    '#549cdd',
    '#f2749a',
    '#d1b04d'
];

export const Avatar = React.memo((props: { size: number, id: string, address?: string }) => {
    let Img = avatarImages[avatarHash(props.id, avatarImages.length)];
    let color = avatarColors[avatarHash(props.id, avatarColors.length)];

    let known = props.address ? KnownWallets[props.address] : undefined;
    if (known) {
        if (known.ic) Img = known.ic;
        if (known.color) color = known.color
    }

    return (
        <View style={{ width: props.size, height: props.size, borderRadius: props.size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <Img width={Math.floor(props.size * 0.7)} height={Math.floor(props.size * 0.7)} color="white" />
        </View>
    );
});