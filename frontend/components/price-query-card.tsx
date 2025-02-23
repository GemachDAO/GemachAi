import { ArrowDownIcon, ArrowUpIcon, Hexagon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'

interface TokenData {
    image: string
    price: number
    symbol: string
    id: string
    marketCap: number
    price_change_24h: number
    ath: number
    ath_date: string
    market_cap_rank: number
}

export function TokenInfoCard({ data }: { data: TokenData }) {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        }).format(num)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <Card className="w-full max-w-md overflow-hiddenmax-w-2xl  bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-cyan-100 dark:bg-cyan-900/30 rounded-xl p-1">
                            <Image src={data.image} alt={data.symbol} className="w-8 h-8 rounded-lg" width={32} height={32} />
                        </div>
                        <CardTitle className="text-2xl font-bold flex items-center text-cyan-800 dark:text-cyan-400">
                            <Hexagon className="w-5 h-5 mr-1 text-cyan-600 dark:text-cyan-400" />
                            {data.symbol.toUpperCase()}
                        </CardTitle>
                    </div>
                    <Badge className=" text-white dark:text-gray-900 font-bold px-3 py-1 rounded-full text-xs">
                        Rank #{data.market_cap_rank}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2">
                    <div className="flex justify-between items-baseline">
                        <h2 className="text-3xl font-bold text-cyan-800 dark:text-cyan-400">{formatNumber(data.price)}</h2>
                        <div className={`flex items-center ${data.price_change_24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {data.price_change_24h >= 0 ? (
                                <ArrowUpIcon className="w-4 h-4 mr-1" />
                            ) : (
                                <ArrowDownIcon className="w-4 h-4 mr-1" />
                            )}
                            <span className="font-semibold">{Math.abs(data.price_change_24h).toFixed(2)}%</span>
                        </div>
                    </div>
                    <div className="text-sm text-cyan-700 dark:text-cyan-300">
                        Market Cap: {formatNumber(data.marketCap)}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="font-medium text-blue-700 dark:text-blue-400">All Time High:</span>
                            <div className="text-cyan-800 dark:text-cyan-300">{formatNumber(data.ath)}</div>
                            <div className="text-xs text-cyan-600 dark:text-cyan-500">{formatDate(data.ath_date)}</div>
                        </div>
                        <div className="text-right">
                            <span className="font-medium text-blue-700 dark:text-blue-400">Current Price:</span>
                            <div className="text-cyan-800 dark:text-cyan-300">{formatNumber(data.price)}</div>
                            <div className="text-xs text-cyan-600 dark:text-cyan-500">
                                {((data.price / data.ath) * 100).toFixed(2)}% of ATH
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

