import {KlineQuery} from "@/core/query/klineQuery"
import {market} from "@/core/api/logicApi"
import {Component, Vue} from 'vue-property-decorator'
import LineChart from '@/common/vue/line-chart-by-day/LineChartByDay.vue'
import {isRefreshData, localSave, localRead, formatDate} from '@/core/utils/utils'

@Component({
    components: {
        LineChart
    }
})
export class MonitorMarketTs extends Vue {
    assetType = ''
    lowestPrice = 0
    sellAmount = 10
    highestPrice = 0
    riseRange: any = 0
    purchaseAmount = 10
    averagePrice: any = 0
    currentPrice: any = 0
    recentTransactionList = []
    isShowSearchDetail = false
    noTransactionRecord = false
    currentMonth = (new Date()).getFullYear() + '-' + ((new Date()).getMonth() + 1)

    showSearchDetail() {
        this.isShowSearchDetail = true
    }

    hideSearchDetail() {
        this.isShowSearchDetail = false
    }

    resetTransactionList() {
        this.recentTransactionList = []

    }

    async searchByasset() {
        // TODO
    }

    formatDate(timestamp) {
        return formatDate(timestamp).replace(/-/g, '/')
    }

    addPurchaseAmount() {
        this.purchaseAmount += 1
    }

    cutPurchaseAmount() {
        this.purchaseAmount = this.purchaseAmount >= 1 ? this.purchaseAmount - 1 : this.purchaseAmount
    }

    addSellAmount() {
        this.sellAmount += 1
    }


    cutSellAmount() {
        this.sellAmount = this.sellAmount >= 1 ? this.sellAmount - 1 : this.sellAmount
    }

    changeCurrentMonth(e) {
        this.currentMonth = e
    }

    async getMarketPrice() {
        if (!isRefreshData('oneWeekPrice', 1000 * 60 * 60 * 24, new Date().getHours())) {
            const oneWeekPrice = JSON.parse(localRead('oneWeekPrice'))
            this.highestPrice = oneWeekPrice.highestPrice
            this.lowestPrice = oneWeekPrice.lowestPrice
            this.averagePrice = oneWeekPrice.averagePrice
            this.riseRange = oneWeekPrice.riseRange
            return
        }

        const that = this
        const rstStr = await market.kline({period: "1day", symbol: "xemusdt", size: "14"});
        const rstQuery: KlineQuery = JSON.parse(rstStr.rst);
        const result = rstQuery.data
        const currentWeek = result.slice(0, 7)
        const preWeek = result.slice(7, 14)

        currentWeek.sort((a, b) => {
            return a.high < b.high ? 1 : -1;
        })
        that.highestPrice = currentWeek[0].high

        currentWeek.sort((a, b) => {
            return a.low < b.low ? -1 : 1;
        })
        that.lowestPrice = currentWeek[0].low

        let average = 0
        currentWeek.forEach((item) => {
            average += item.high + item.low
        })
        that.averagePrice = (average / 14).toFixed(4)

        let preAverage: any = 0
        preWeek.forEach((item) => {
            preAverage += item.high + item.low
        })
        preAverage = (preAverage / 14).toFixed(4)
        that.riseRange = (((that.averagePrice - preAverage) / preAverage) * 100).toFixed(2)
        const oneWeekPrice = {
            averagePrice: that.averagePrice,
            lowestPrice: that.lowestPrice,
            highestPrice: that.highestPrice,
            riseRange: that.riseRange,
            timestamp: new Date().getTime()
        }
        localSave('oneWeekPrice', JSON.stringify(oneWeekPrice))

    }

    async getMarketOpenPrice() {
        if (!isRefreshData('openPriceOneMinute', 1000 * 60, new Date().getSeconds())) {
            const openPriceOneMinute = JSON.parse(localRead('openPriceOneMinute'))
            this.currentPrice = openPriceOneMinute.openPrice
            return
        }
        const that = this
        const rstStr = await market.kline({period: "1min", symbol: "xemusdt", size: "1"});
        const rstQuery: KlineQuery = JSON.parse(rstStr.rst);
        const result = rstQuery.data[0].close
        that.currentPrice = result
        const openPriceOneMinute = {timestamp: new Date().getTime(), openPrice: result}
        localSave('openPriceOneMinute', JSON.stringify(openPriceOneMinute))
    }

    async getRecentTransactionList() {
        if (!isRefreshData('transactionsOverNetwork', 1000 * 60 * 3, 1)) {
            const transactionsOverNetwork = JSON.parse(localRead('transactionsOverNetwork'))
            this.recentTransactionList = transactionsOverNetwork.recentTransactionList
            return
        }
        const that = this

        const rstStr = await market.trade({symbol: "xemusdt", size: "50"});
        const rstQuery = JSON.parse(rstStr.rst);
        let recentTransactionList = []
        let result = rstQuery.data
        result.map((item) => {
            item.data.map((i) => {
                i.type = 'XEM'
                i.time = that.formatDate(i.ts)
                i.result = (i.amount * i.price).toFixed(2)
                recentTransactionList.push(i)
            })
            return item
        })
        recentTransactionList.sort((a, b) => {
            return a.ts > b.ts ? -1 : 1
        })
        if (recentTransactionList.length == 0) {
            this.noTransactionRecord = true
        } else {
            this.noTransactionRecord = false
            that.recentTransactionList = recentTransactionList
            const transactionsOverNetwork = {
                timestamp: new Date().getTime(),
                recentTransactionList: recentTransactionList
            }
            localSave('transactionsOverNetwork', JSON.stringify(transactionsOverNetwork))
        }
    }

    async created() {
        this.getMarketPrice()
        this.getMarketOpenPrice()
        this.getRecentTransactionList()
    }
}
