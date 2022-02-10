import axios from "axios";

export async function fetchConfig() {
    return (await axios.get('https://connect.tonhubapi.com/config')).data as {
        wallets: {
            restrict_send: string[]
        }
    };
}