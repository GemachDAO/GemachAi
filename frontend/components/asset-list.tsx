'use client';


import { useState } from 'react'
import useSWR from 'swr'
import { CopyIcon } from './icons'
import { toast } from 'sonner';
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import {
    SidebarGroup,
    SidebarGroupContent,
} from '@/components/ui/sidebar'
import { blockchainIcons } from '@/lib/utils'
import { authFetch } from '@/lib/auth/authFetch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronDown, WalletIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ProtocolList } from './protocol-list'


export function AssetList({ user }: { user: User | undefined }) {
    const { data: balances, isLoading: isBalancesLoading, mutate: mutateBalances } = useSWR<Array<BalanceResponse>>(user ? `/balances/balances/${user.evmWalletAddress}` : null, authFetch ,{
        fallbackData:[]
    })
    console.log('balances', balances)
    const [walletName, setWalletName] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const createWallet = async () => {
        if (!walletName.trim()) {
            toast.error("Please enter a wallet name")
            return
        }
        if (walletName.length > 40) {
            toast.error("Wallet name must not exceed 40 characters")
            return
        }
        if (walletName.length < 5) {
            toast.error("Wallet name must be at least 5 characters")
            return
        }

        setIsLoading(true)
        try {
            const response = await authFetch(`/wallets/create`, {
                method: 'POST',
                body: JSON.stringify({ name: walletName }),
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.message)
            } else {
                await mutateBalances()
                toast.success("Wallet created successfully")
                setIsDialogOpen(false)
                setWalletName('')
            }
        } catch (error) {
            console.error("Error creating wallet", error)
            toast.error("Failed to create wallet")
        } finally {
            setIsLoading(false)
        }
    }

    const blockchainSymbolToName = {
        'eth-mainnet': 'Ethereum',
        'arbitrum-mainnet': 'Arbitrum',
        'matic-mainnet': 'Polygon',
        'avalanche-mainnet': 'Avalanche',
        'base-mainnet': 'Base',
        'fraxtal-mainnet': 'Fraxtal',
        'optimism-mainnet': 'Optimism',
        'bsc-mainnet': 'Binance Smart Chain',
        'sonic-mainnet': 'Sonic'
    }

    if (isBalancesLoading) {
        return (
            <SidebarGroup>
                <div className="px-2 py-1 text-xs font-semibold">
                    Loading Balances...
                </div>
                <SidebarGroupContent>
                    <div className="flex flex-col">
                        {[60, 45, 75, 50, 65].map((width) => (
                            <div
                                key={width}
                                className="p-2"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-4 w-4 rounded-full bg-sidebar-accent-foreground/10" />
                                    <div
                                        className="h-4 rounded-md bg-sidebar-accent-foreground/10"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                                <div className="flex justify-between px-1">
                                    <div className="h-3 w-16 rounded-md bg-sidebar-accent-foreground/10" />
                                    <div className="h-3 w-20 rounded-md bg-sidebar-accent-foreground/10" />
                                </div>
                            </div>
                        ))}
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    if (!user?.evmWalletAddress) {
        return (
            <SidebarGroup>
                <div className="px-2 py-1 text-xs  font-semibold">
                    Gemach AI Wallet
                </div>

                <SidebarGroupContent>
                    <div className="flex flex-col gap-2 p-2">
                        <p className="">No wallet found. Create one to get started!</p>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600">
                                    <WalletIcon className="mr-2 h-4 w-4" />
                                    Create Wallet
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black border border-cyan-200 dark:border-cyan-500  ">
                                <DialogHeader>
                                    <DialogTitle className=" ">Create a Wallet</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label htmlFor="wallet-name" className="text-right  ">
                                            Name
                                        </label>
                                        <Input
                                            id="wallet-name"
                                            value={walletName}
                                            onChange={(e) => setWalletName(e.target.value)}
                                            className="col-span-3 bg-white dark:bg-gray-800 border-cyan-300 dark:border-cyan-600  "
                                            placeholder="Enter wallet name"
                                        />
                                    </div>
                                </div>
                                <Button onClick={createWallet} disabled={isLoading} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600">
                                    {isLoading ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-cyan-300"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Wallet'
                                    )}
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    return (
        <>
            <SidebarGroup>
                <div className="px-2 py-1 text-xs font-semibold   flex items-center gap-2 justify-between">
                    Gemach AI Wallet ({user.evmWalletAddress.slice(0, 4)}...{user.evmWalletAddress.slice(-4)})
                    <div className="cursor-pointer " onClick={() => {
                        navigator.clipboard.writeText(user.evmWalletAddress || '')
                        toast.success("Gemach AI Wallet Address Copied")
                    }}>
                        <CopyIcon size={14} />
                    </div>
                </div>
                <div className="px-2 py-1 text-xs   font-semibold">
                    Token Holdings
                </div>
                <SidebarGroupContent>
                    {balances?.map((chain) => (
                        <Collapsible key={chain.chain_id}>
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5  rounded-md  ">
                                <div className="flex items-center gap-2">
                                    <Image
                                        src={blockchainIcons[chain.chain_name]}
                                        alt={chain.chain_name}
                                        width={18}
                                        height={18}
                                        className="h-4 w-4 rounded-full"
                                    />
                                    <span className="font-medium">{blockchainSymbolToName[chain.chain_name]}</span>
                                </div>
                                <ChevronDown className="h-4 w-4   transition-transform duration-200" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="mt-1 space-y-0.5">
                                    {chain.items.filter((item) => !item.is_spam).map((token) => (
                                        <div
                                            key={token.contract_address}
                                            className="group px-3 py-2 hover:bg-cyan-50 dark:hover:bg-cyan-800/20 rounded-sm"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage src={token.logo_url} alt={token.contract_name} />
                                                        <AvatarFallback>{token.contract_ticker_symbol.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>

                                                    <span className="text-sm font-medium  ">
                                                        {token.contract_ticker_symbol}
                                                    </span>
                                                </div>
                                                {!token.native_token && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(token.contract_address);
                                                            toast.success(`${token.contract_ticker_symbol} Address Copied`);
                                                        }}
                                                        className="flex items-center gap-2 text-cyan-600 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-100"
                                                    >
                                                        <CopyIcon size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-medium  ">Amount</span>
                                                    <span className="font-medium  ">   {parseFloat(token.balance).toFixed(8)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-medium  ">
                                                        Price: ${token.quote_rate < 0.00001 ? "<0.00001" : token.quote_rate.toFixed(6).replace(/\.?0+$/, '')}
                                                    </span>
                                                    <span className="font-medium  ">
                                                        ${token.quote.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </SidebarGroupContent>
            </SidebarGroup>
            <ProtocolList user={user} />
        </>
    )
}