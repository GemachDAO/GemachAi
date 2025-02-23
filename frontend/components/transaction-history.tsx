'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight, Clock, Loader2 } from 'lucide-react'
import TransactionDetails from './transaction/transaction-details'
import { ScrollArea } from './ui/scroll-area'
import { authFetch } from '@/lib/auth/authFetch'
const TransactionHistory = () => {
    const [sequences, setSequences] = useState<ActionSequence[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSequences()
    }, [])

    const fetchSequences = async () => {
        try {
            const response = await authFetch(`/transactions/history`)

            setSequences(response)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load transaction history')
        } finally {
            setLoading(false)
        }
    }
    const getSequenceStatus = (sequence: ActionSequence) => {
        const statuses = sequence.actions.map(action => {
            if (action.error) return 'error'
            return action.data.status.toLowerCase()
        })

        if (statuses.some(s => s === 'error')) return 'error'
        if (statuses.every(s => s === 'confirmed')) return 'confirmed'
        if (statuses.some(s => s === 'sent')) return 'pending'
        return 'pending'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                {error}
            </div>
        )
    }

    if (sequences.length === 0) {
        return (
            <Card className="mt-4">
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                        No transactions yet
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
                <Accordion type="single" collapsible>
                    {sequences.map((sequence) => {
                        const status = getSequenceStatus(sequence)
                        const date = new Date(sequence.createdAt)

                        return (
                            <AccordionItem
                                key={sequence.id}
                                value={sequence.id}
                                className="border rounded-lg mb-2 overflow-hidden"
                            >
                                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <Badge
                                                variant={
                                                    status === 'confirmed' ? 'default' :
                                                        status === 'error' ? 'destructive' :
                                                            'secondary'
                                                }
                                            >
                                                {status}
                                            </Badge>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {formatDistanceToNow(date, { addSuffix: true })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                {sequence.actions.length} action{sequence.actions.length !== 1 ? 's' : ''}
                                            </span>
                                            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <TransactionDetails
                                        transactionSequence={sequence}
                                        messageId=""
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
        </ScrollArea>
    )
}

export default TransactionHistory