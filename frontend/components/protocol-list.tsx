"use client"

import { useState } from "react"
import useSWR from "swr"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar"
import { authFetch } from "@/lib/auth/authFetch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"


export function ProtocolList({ user }: { user: User | undefined }) {
    const { data: protocolData, isLoading: isProtocolDataLoading } = useSWR<ProtocolData[]>(
        user ? `/protocols/display/user/${user.evmWalletAddress}` : null,
        authFetch,
    )

    const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set())

    const toggleProtocol = (protocolName: string) => {
        setExpandedProtocols((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(protocolName)) {
                newSet.delete(protocolName)
            } else {
                newSet.add(protocolName)
            }
            return newSet
        })
    }

    if (isProtocolDataLoading) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>Loading Protocol Data...</SidebarGroupLabel>
                <SidebarGroupContent>
                    <div className="flex flex-col space-y-4 p-2">
                        {[60, 45, 75, 50, 65].map((width, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-sidebar-accent-foreground/10 animate-pulse" />
                                    <div
                                        className="h-4 rounded-md bg-sidebar-accent-foreground/10 animate-pulse"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                                <div className="h-3 w-3/4 rounded-md bg-sidebar-accent-foreground/10 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        )
    }

    if (!protocolData || protocolData.length === 0) {
        return null
    }

    const renderDisplayField = (field: DisplayField) => {
        switch (field.paramType) {
            case "Token":
                const tokenValue = field.value as Token
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="w-4 h-4">
                            <AvatarImage src={tokenValue.logoURI} alt={tokenValue.symbol} />
                            <AvatarFallback>{tokenValue.symbol.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{tokenValue.symbol}</span>
                    </div>
                )
            case "Number":
                const numValue = field.value.toString()
                if (numValue.includes("%")) {
                    return <Badge variant="secondary">{numValue}</Badge>
                }
                if (numValue.includes(" ")) {
                    return <span>{numValue}</span>
                }
                return <span>{Number.parseFloat(numValue).toFixed(4)}</span>
            case "Object":
                const objValue = field.value as { [key: string]: string | number | boolean }
                return (
                    <div className="space-y-1">
                        {Object.entries(objValue).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                                <span className="text-sidebar-accent-foreground/70">{key.split("_").join(" ")}:</span>
                                <span className="font-medium">
                                    {typeof value === "boolean" ? (
                                        <Badge variant={value ? "default" : "destructive"}>{value ? "Yes" : "No"}</Badge>
                                    ) : (
                                        value.toString()
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )
            case "Chain":
                const chain = field.value as ChainMetadata
                return (
                    <Badge variant="outline" className='flex items-center  py-2  text-black dark:text-white gap-2'>
                        <Image src={chain.nativeToken.logoURI} alt={chain.name} width={20} height={20} className="rounded-full" />
                        {chain.name}
                    </Badge>
                )
            case "String":
            default:
                return <span>{field.value.toString()}</span>
        }
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Protocol Details</SidebarGroupLabel>
            <SidebarGroupContent>
                {protocolData.map((protocol) => (
                    <Collapsible
                        key={protocol.protocolName}
                        open={expandedProtocols.has(protocol.protocolName)}
                        onOpenChange={() => toggleProtocol(protocol.protocolName)}
                    >
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${protocol.protocolName}`} />
                                    <AvatarFallback>{protocol.protocolName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{protocol.protocolName}</span>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${expandedProtocols.has(protocol.protocolName) ? "rotate-180" : ""}`}
                            />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="mt-2 space-y-2">
                                {protocol.data.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-sidebar-accent-foreground/70 italic">
                                        No interaction data available for this protocol
                                    </div>
                                ) : protocol.data.map((dataObject, index) => (
                                    <div key={index} className="px-3 py-2 bg-sidebar-accent/30 rounded-md">
                                        {Object.entries(dataObject).map(([key, fields]) => (
                                            <Collapsible key={key}>
                                                <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
                                                    <span className="text-sm font-medium">{key}</span>
                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="mt-2 space-y-2">
                                                        {fields.map((field, fieldIndex) => (
                                                            <div key={fieldIndex} className="flex flex-col gap-1 bg-sidebar-accent/20 p-2 rounded-sm">
                                                                {field.paramType === "Object" ? (
                                                                    <div className="space-y-1.5">
                                                                        {Object.entries(field.value as { [key: string]: string | number | boolean }).map(
                                                                            ([objKey, objValue]) => (
                                                                                <div key={objKey} className="flex items-center justify-between text-xs">
                                                                                    <span className="text-sidebar-accent-foreground/70">
                                                                                        {objKey.split("_").join(" ")}
                                                                                    </span>
                                                                                    <span className="font-medium">
                                                                                        {typeof objValue === "boolean" ? (
                                                                                            <Badge variant={objValue ? "default" : "destructive"}>
                                                                                                {objValue ? "Yes" : "No"}
                                                                                            </Badge>
                                                                                        ) : (
                                                                                            objValue.toString()
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="text-sidebar-accent-foreground/70">{field.label}</span>
                                                                        <div className="font-medium">{renderDisplayField(field)}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

