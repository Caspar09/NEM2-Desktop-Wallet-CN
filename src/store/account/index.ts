import {Account} from 'nem2-sdk'

declare interface account {
    account: Account,
    wallet: any,
    mosaic: any[],
    namespace: any[],
}

export default {
    state: {
        accountPrivateKey: '',
        accountPublicKey: '',
        accountAddress: '',
        node: 'http://47.107.245.217:3000',
        currentXem: 'nem.xem',
        currentXEM1: '577cba5470751c05',
        // currentXEM1: '37EF2403A20729DF',
        currentXEM2: '1B47399ABD2C1E49',
        account: {},
        wallet: {},
        mosaic: [],
        namespace: [],
        UnconfirmedTx: [],
        ConfirmedTx: [],
        errorTx: [],
        generationHash: ''
    },
    getters: {
        Address(state) {
            return state.account.address;
        },
        PublicAccount(state) {
            return state.account.publicAccount;
        },
        privateKey(state) {
            return state.account.privateKey;
        },
        publicKey(state) {
            return state.account.publicKey;
        }
    },
    mutations: {
        SET_ACCOUNT(state: account, account: Account): void {
            state.account = account
        },
        SET_WALLET(state: account, wallet: any): void {
            state.wallet = wallet
        },
        SET_MOSAICS(state: account, mosaic: any[]): void {
            state.mosaic = mosaic
        },
        SET_NAMESPACE(state: account, namespace: any[]): void {
            state.namespace = namespace
        },
    },
}
