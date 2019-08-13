import {Account, Address, Listener} from "nem2-sdk"
import {aliasInterface} from "@/interface/sdkNamespace"
import {multisigInterface} from '@/interface/sdkMultisig'
import {formatSeconds, formatAddress} from '@/help/help.ts'
import {Component, Vue, Watch} from 'vue-property-decorator'
import {transactionInterface} from "@/interface/sdkTransaction"
import {Message, bandedNamespace as BandedNamespaceList} from "@/config/index"
import CheckPWDialog from '@/common/vue/check-password-dialog/CheckPasswordDialog.vue'

@Component({
    components: {
        CheckPWDialog
    }
})
export class RootNamespaceTs extends Vue {
    durationIntoDate = 0
    currentMinApproval = -1
    showCheckPWDialog = false
    form = {
        duration: 1000,
        rootNamespaceName: '',
        multisigPublickey: '',
        innerFee: 50000,
        aggregateFee: 50000,
        lockFee: 50000
    }
    multisigPublickeyList = [
        {
            value: 'no data ',
            label: 'no data '
        },
    ]
    typeList = [
        {
            name: 'ordinary_account',
            isSelected: true
        }, {
            name: 'multi_sign_account',
            isSelected: false
        }
    ]

    get getWallet() {
        return this.$store.state.account.wallet
    }

    get generationHash() {
        return this.$store.state.account.generationHash
    }

    get node() {
        return this.$store.state.account.node
    }

    initForm() {
        this.form = {
            multisigPublickey: '',
            duration: 1000,
            rootNamespaceName: '',
            innerFee: 50000,
            aggregateFee: 50000,
            lockFee: 50000
        }
    }

    formatAddress(address) {
        return formatAddress(address)
    }

    switchAccountType(index) {
        let list = this.typeList
        list = list.map((item) => {
            item.isSelected = false
            return item
        })
        list[index].isSelected = true
        this.typeList = list
    }

    async createBySelf(privatekey) {
        let transaction;
        const that = this;
        const account = Account.createFromPrivateKey(privatekey, this.getWallet.networkType);
        await this.createRootNamespace().then((rootNamespaceTransaction) => {
            transaction = rootNamespaceTransaction
        })
        const signature = account.sign(transaction, this.generationHash)
        transactionInterface.announce({signature, node: this.node}).then((announceResult) => {
            // get announce status
            announceResult.result.announceStatus.subscribe((announceInfo: any) => {
                that.$emit('createdNamespace')
                that.$Notice.success({title: this.$t(Message.SUCCESS) + ''})
                that.initForm()
            })
        })
    }

    createByMultisig(privatekey) {
        const that = this
        const {duration, rootNamespaceName, aggregateFee, lockFee, innerFee, multisigPublickey} = this.form
        const {networkType} = this.getWallet
        const account = Account.createFromPrivateKey(privatekey, networkType)
        const {generationHash, node} = this.$store.state.account
        const listener = new Listener(node.replace('http', 'ws'), WebSocket)
        aliasInterface.createdRootNamespace({
            namespaceName: rootNamespaceName,
            duration: duration,
            networkType: networkType,
            maxFee: innerFee
        }).then((transaction) => {
            const rootNamespaceTransaction = transaction.result.rootNamespaceTransaction
            if (that.currentMinApproval > 1) {
                multisigInterface.bondedMultisigTransaction({
                    networkType: networkType,
                    account: account,
                    fee: aggregateFee,
                    multisigPublickey: multisigPublickey,
                    transaction: [rootNamespaceTransaction],
                }).then((result) => {
                    const aggregateTransaction = result.result.aggregateTransaction
                    transactionInterface.announceBondedWithLock({
                        aggregateTransaction,
                        account,
                        listener,
                        node,
                        generationHash,
                        networkType,
                        fee: lockFee
                    })
                })
                return
            }
            multisigInterface.completeMultisigTransaction({
                networkType: networkType,
                fee: aggregateFee,
                multisigPublickey: multisigPublickey,
                transaction: [rootNamespaceTransaction],
            }).then((result) => {
                const aggregateTransaction = result.result.aggregateTransaction
                transactionInterface._announce({
                    transaction: aggregateTransaction,
                    account,
                    node,
                    generationHash
                })
            })
        })
        console.log(privatekey)
    }

    async checkEnd(privatekey) {
        if (this.typeList[0].isSelected) {
            this.createBySelf(privatekey)
        } else {
            this.createByMultisig(privatekey)
        }
    }

    createRootNamespace() {
        return aliasInterface.createdRootNamespace({
            namespaceName: this.form.rootNamespaceName,
            duration: this.form.duration,
            networkType: this.getWallet.networkType,
            maxFee: this.form.innerFee
        }).then((transaction) => {
            return transaction.result.rootNamespaceTransaction
        })
    }


    closeCheckPWDialog() {
        this.showCheckPWDialog = false
    }

    checkForm(): boolean {
        const {duration, rootNamespaceName, aggregateFee, lockFee, innerFee, multisigPublickey} = this.form

        // check multisig
        if (this.typeList[1].isSelected) {
            if (!multisigPublickey) {
                this.$Notice.error({
                    title: this.$t(Message.INPUT_EMPTY_ERROR) + ''
                })
                return false
            }
            if ((!Number(aggregateFee) && Number(aggregateFee) !== 0) || Number(aggregateFee) < 0) {
                this.showErrorMessage(this.$t(Message.FEE_LESS_THAN_0_ERROR))
                return false
            }
            if ((!Number(lockFee) && Number(lockFee) !== 0) || Number(lockFee) < 0) {
                this.showErrorMessage(this.$t(Message.FEE_LESS_THAN_0_ERROR))
                return false
            }
        }

        //check common
        if (!Number(duration) || Number(duration) < 0) {
            this.showErrorMessage(this.$t(Message.DURATION_VALUE_LESS_THAN_1_ERROR))
            return false
        }

        if (!rootNamespaceName || !rootNamespaceName.trim()) {
            this.showErrorMessage(this.$t(Message.NAMESPACE_NULL_ERROR))
            return false
        }

        if (rootNamespaceName.length > 16) {
            this.showErrorMessage(this.$t(Message.ROOT_NAMESPACE_TOO_LONG_ERROR))
            return false
        }

        //^[a-z].*
        if (!rootNamespaceName.match(/^[a-z].*/)) {
            this.showErrorMessage(this.$t(Message.NAMESPACE_STARTING_ERROR))
            return false
        }
        //^[0-9a-zA-Z_-]*$
        if (!rootNamespaceName.match(/^[0-9a-zA-Z_-]*$/g)) {
            this.showErrorMessage(this.$t(Message.NAMESPACE_FORMAT_ERROR))
            return false
        }

        if ((!Number(innerFee) && Number(innerFee) !== 0) || Number(innerFee) < 0) {
            this.showErrorMessage(this.$t(Message.FEE_LESS_THAN_0_ERROR))
            return false
        }
        //BandedNamespaceList
        const flag = BandedNamespaceList.every((item) => {
            if (item == rootNamespaceName) {
                this.showErrorMessage(this.$t(Message.NAMESPACE_USE_BANDED_WORD_ERROR))
                return false
            }
            return true
        })
        return flag
    }


    getMultisigAccountList() {
        const that = this
        const {address} = this.$store.state.account.wallet
        const {node} = this.$store.state.account
        multisigInterface.getMultisigAccountInfo({
            address,
            node
        }).then((result) => {
            that.multisigPublickeyList = result.result.multisigInfo.multisigAccounts.map((item) => {
                item.value = item.publicKey
                item.label = item.publicKey
                return item
            })
        })
    }

    @Watch('formItem.multisigPublickey')
    async onMultisigPublickeyChange() {
        const that = this
        const {multisigPublickey} = this.form
        const {node} = this.$store.state.account
        const {networkType} = this.$store.state.account.wallet
        let address = Address.createFromPublicKey(multisigPublickey, networkType)['address']
        multisigInterface.getMultisigAccountInfo({
            address,
            node
        }).then((result) => {
            const currentMultisigAccount = result.result.multisigInfo
            that.currentMinApproval = currentMultisigAccount.minApproval
        })
    }

    showErrorMessage(message) {
        this.$Notice.destroy()
        this.$Notice.error({
            title: message
        })
    }

    createTransaction() {
        if (!this.checkForm()) return
        this.showCheckPWDialog = true
    }

    changeXEMRentFee() {
        const duration = Number(this.form.duration)
        if (Number.isNaN(duration)) {
            this.form.duration = 0
            this.durationIntoDate = 0
            return
        }
        if (duration * 12 >= 60 * 60 * 24 * 365) {
            this.$Message.error(Message.DURATION_MORE_THAN_1_YEARS_ERROR)
            this.form.duration = 0
        }
        this.durationIntoDate = Number(formatSeconds(duration * 12))
    }

    initData() {
        this.changeXEMRentFee()
    }

    created() {
        this.initData()
        this.getMultisigAccountList()
    }
}
