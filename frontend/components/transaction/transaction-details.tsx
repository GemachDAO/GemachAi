'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { cn, getServerUrl, } from "@/lib/utils"
import Image from 'next/image'
import { AlertCircle, CheckCircle2, ChevronRight, ExternalLink, Loader2, Check, Copy } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from 'sonner'
import { formatEther } from 'ethers'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SUPPORTED_CHAINS } from "@/constants"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { authFetch } from '@/lib/auth/authFetch';

const TransactionDetails = ({ transactionSequence, messageId }: { transactionSequence: ActionSequence; messageId: string; }) => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [localTransactionSequence, setLocalTransactionSequence] = useState<ActionSequence>(transactionSequence)
  const [streamStatus, setStreamStatus] = useState<'idle' | 'streaming' | 'completed' | 'error' | 'pending'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [hasOngoingTransactions, setHasOngoingTransactions] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const serverUrl = getServerUrl()

  useEffect(() => {
    checkSequenceStatus();
  }, [transactionSequence.id]);

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const checkSequenceStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await authFetch(`/transactions/sequence/${transactionSequence.id}`, {
        method: 'GET',
      });
      console.log('response', response);

      setIsSaved(true);
      setLocalTransactionSequence(response);
    } catch (error) {
      console.error('Error checking sequence status:', error);
      setIsSaved(false);
    } finally {
      setIsCheckingStatus(false);
    
    }
  };
  console.log("isCheckingStatus ", isCheckingStatus)
  const hasErrorActions = localTransactionSequence.actions.some(action => action.error);

  const handleSaveWithErrors = async () => {
    // Filter out actions with errors
    const validActions = localTransactionSequence.actions.filter(action => !action.error);

    const cleanedSequence = {
      ...localTransactionSequence,
      actions: validActions
    };

    setIsSaving(true);
    try {
      await authFetch(`/transactions/save`, {
        method: 'POST',
        body: JSON.stringify(cleanedSequence),
      });
      setIsSaved(true);
      toast.success('Transaction sequence saved successfully');
    } catch (error) {
      toast.error('Failed to save transaction sequence');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (hasErrorActions) {
      setShowErrorDialog(true);
    } else {
      setShowSaveDialog(true);
    }
  };

  const handleExecute = async (isRetry: boolean = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
      setStreamStatus('idle');
      setIsExecuting(false);
      setLocalTransactionSequence(prev => ({
        ...prev,
        actions: prev.actions.map(action => ({
          ...action,
          data: {
            ...action.data,
            transactions: (action.data as Action).transactions?.map(tx =>
              ['FAILED', 'REJECTED'].includes(tx.status) ? { ...tx, status: 'UNSIGNED' } : tx
            )
          }
        }))
      }));
    }

    setIsExecuting(true);
    try {
      authFetch(`/transactions/sequence/execute/${transactionSequence?.id}`, {
        method: 'POST',
        body: JSON.stringify(localTransactionSequence),
      });


      toast.success('Starting transaction execution...');
      setStreamStatus('streaming');

      const newEventSource = new EventSource(
        `${serverUrl}/transactions/sequence/stream/${transactionSequence?.id}`,
        {
          withCredentials: true,

        }
      );
      setEventSource(newEventSource);

      newEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'message') {
            setLocalTransactionSequence(prev => ({
              ...prev,
              actions: prev.actions.map(action => {
                const updatedAction = data.actions.find((a: Action) => a.id === action.data.id);
                if (updatedAction) {
                  return {
                    ...action,
                    data: updatedAction
                  };
                }
                return action;
              })
            }));

            setHasFailed(data.hasFailed);
            setHasOngoingTransactions(data.hasOngoingTransactions);
          }

          if (data.final) {
            newEventSource.close();
            setEventSource(null);
            setStreamStatus(data.hasFailed ? 'error' : 'completed');
            setIsExecuting(false);

            if (data.hasFailed) {
              toast.error('Transaction sequence failed');
            } else {
              toast.success('All transactions completed successfully!');
            }
          }
        } catch (error) {
          console.error('Error processing transactions', error);
          newEventSource.close();
          setEventSource(null);
          setStreamStatus('error');
          setIsExecuting(false);
          toast.error('Error processing transactions');
        }
      };

      // newEventSource.onerror = () => {
      //   newEventSource.close();
      //   setEventSource(null);
      //   setStreamStatus('error');
      //   setIsExecuting(false);
      //   toast.error('Lost connection to transaction stream');
      // };

    } catch (error) {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      setStreamStatus('error');
      setIsExecuting(false);
      toast.error('Failed to execute transactions');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getExplorerLink = (chainId: number, value: string, type: 'token' | 'tx') => {
    const chain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
    if (!chain || !chain.explorerUrl) return '';
    return type === 'token'
      ? `${chain.explorerUrl}/token/${value}`
      : `${chain.explorerUrl}/tx/${value}`;
  };

  const TokenComponent = ({ token }: { token: { address: string, logo: string, name: string, symbol: string, chainId: number } }) => {
    const isNativeToken = token.address === "0x0000000000000000000000000000000000000000";
    const tokenInfo = token;
    const symbol = tokenInfo.symbol.toUpperCase();
    const address = isNativeToken ? "Native Token" : tokenInfo.address;

    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5">
            <AvatarImage src={tokenInfo.logo} alt={tokenInfo.name} />
            <AvatarFallback>{symbol.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-purple-800 dark:text-purple-400 font-mono">{symbol}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[150px]">
            {address}
          </span>
          {!isNativeToken && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(address)}
                    >
                      {copiedAddress === address ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-500" />
                      )}
                      <span className="sr-only">Copy token address</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copiedAddress === address ? 'Copied!' : 'Copy address'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(getExplorerLink(token.chainId, address, 'token'), '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 text-gray-500" />
                      <span className="sr-only">View on explorer</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View on explorer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ChainComponent = (chain: ChainMetadata) => {
    return (
      <Badge variant="outline" className='flex items-center py-2  text-black dark:text-white gap-2'>
        <Image src={chain.nativeToken.logoURI} alt={chain.name} width={20} height={20} className="rounded-full" />
        {chain.name}
      </Badge>
    );
  };

  const AmountComponent = (amount: string) => {
    return <div className="text-green-700 dark:text-green-400 font-bold">{amount}</div>;
  };

  const AddressComponent = (address: string) => {
    return <div className="text-yellow-700 dark:text-yellow-400 font-mono">{address}</div>;
  };

  const ProtocolComponent = (protocolName: string) => {
    return <div className="text-cyan-800 dark:text-cyan-400">{protocolName}</div>;
  };

  const ParamsList = ({ actionArgs }: { actionArgs: Action['actionArgs'] }) => {
    if (!actionArgs?.length) return null;
    return (
      <div className="space-y-2 mt-4 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Parameters</h4>
        <div className="space-y-2">
          {actionArgs.map((arg, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-sm text-cyan-700 dark:text-cyan-300 min-w-[100px]">{arg.label}:</span>
              {arg.paramType === 'Protocol' && ProtocolComponent(arg.value)}
              {arg.paramType === 'Token' && TokenComponent({ token: arg.value, })} {/* Pass actual chainId */}
              {arg.paramType === 'Chain' && ChainComponent(arg.value)}
              {arg.paramType === 'Amount' && AmountComponent(arg.value)}
              {arg.paramType === 'Address' && AddressComponent(arg.value)}
              {!['Protocol', 'Token', 'Chain', 'Amount', 'Address'].includes(arg.paramType) && (
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                  {typeof arg.value === 'object' ? JSON.stringify(arg.value) : arg.value.toString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const variants = {
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      queued: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      unsigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200',
    }

    return (
      <Badge className={cn('capitalize', variants[status as keyof typeof variants])}>
        {status}
      </Badge>
    )
  }

  const ChainBadge = ({ chain }: { chain: ChainMetadata }) => (
    <Badge variant="outline" className="flex items-center gap-2 py-1.5">
      <Image
        src={chain.nativeToken.logoURI}
        alt={chain.name}
        width={16}
        height={16}
        className="rounded-full"
      />
      {chain.name}
    </Badge>
  )

  const getActionStatus = (action: ActionResult) => {
    if (action.error) return 'failed';
    const transactions = (action.data as Action).transactions;
    if (!transactions?.length) return 'unsigned';
    if (transactions.every(tx => tx.status === 'CONFIRMED')) return 'confirmed';
    if (transactions.some(tx => tx.status === 'FAILED')) return 'failed';
    if (transactions.some(tx => tx.status === 'SENT')) return 'sent';
    if (transactions.some(tx => tx.status === 'PENDING')) return 'pending';
    return 'unsigned';
  }

  const getChainById = (chainId: number) => {
    return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  };

  const TransactionData = ({ tx }: { tx: ActionTransaction }) => {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[300px] grid gap-2 text-sm text-gray-600 dark:text-gray-400">
          {Object.entries(tx.transaction).map(([key, value]) => {
            if (!value) return null;

            // Special handling for chainId
            if (key === 'chainId') {
              const chain = getChainById(Number(value));
              if (chain) {
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-medium min-w-[80px]">Chain:</span>
                    <div className="flex items-center gap-2">
                      <Image
                        src={chain.nativeToken.logoURI}
                        alt={chain.name}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {chain.name}
                      </span>
                    </div>
                  </div>
                );
              }
            }

            // Special handling for value (ETH amount)
            if (key === 'value') {
              const chainId = tx.transaction.chainId ? Number(tx.transaction.chainId) : undefined;
              const chain = chainId ? getChainById(chainId) : undefined;
              const symbol = chain?.nativeToken.symbol || 'ETH';

              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">Value:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    {formatEther(value.toString())} {symbol}
                  </span>
                </div>
              );
            }

            // Default display for other fields
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="font-medium min-w-[80px]">{key}:</span>
                <span className="font-mono truncate hover:text-clip hover:overflow-visible">
                  {value.toString()}
                </span>
              </div>
            );
          })}

          {/* Transaction Hash with Explorer Link */}
          {tx.hash && (
            <div className="flex items-center gap-2">
              <span className="font-medium min-w-[80px]">Explorer:</span>
              <a
                href={getExplorerLink(tx.transaction.chainId as number, tx.hash, 'tx')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono text-sm"
              >
                {getExplorerLink(tx.transaction.chainId as number, tx.hash, 'tx').slice(0, 6)}...{getExplorerLink(tx.transaction.chainId as number, tx.hash, 'tx').slice(-4)}

                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProtocolBadge = ({ protocol }: { protocol?: string }) => {
    if (!protocol) return null;
    return (
      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
        {protocol}
      </Badge>
    );
  };

  const areAllActionsConfirmed = () => {
    return localTransactionSequence.actions.every(action => {
      const actionData = action.data as Action;
      return actionData.transactions?.every(tx => tx.status === 'CONFIRMED');
    });
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl font-semibold text-center">
            Transaction Summary
          </CardTitle>
          {streamStatus === 'streaming' && (
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {hasOngoingTransactions
                  ? "Executing transactions..."
                  : "Waiting for transaction confirmation..."}
              </span>
            </div>
          )}
          {streamStatus === 'completed' && !hasFailed && (
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>All transactions completed successfully!</span>
            </div>
          )}
          {(streamStatus === 'error' || hasFailed) && (
            <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>Some transactions failed. Please retry or check details below.</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="space-y-2">
            {localTransactionSequence.actions.map((action, index) => {

              if (action.error) return (
                <div key={index} className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-1" />
                    <div className="space-y-2 overflow-hidden">
                      <div className="font-medium break-words">
                        Error: {action.message}
                      </div>
                      {action.description && (
                        <p className="text-sm text-red-500 dark:text-red-400 break-words">
                          Action: {action.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )

              const actionData = action.data as Action;
              const status = getActionStatus(action);

              return (
                <AccordionItem
                  key={index}
                  value={`action-${index}`}
                  className={cn(
                    "rounded-lg border overflow-hidden transition-colors",
                    status === 'confirmed' && "border-green-200 dark:border-green-800",
                    status === 'failed' && "border-red-200 dark:border-red-800",
                    status === 'sent' && "border-blue-200 dark:border-blue-800",
                    status === 'unsigned' && "border-gray-200 dark:border-gray-800"
                  )}
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <ChainBadge chain={actionData.chain} />
                        <span className="font-medium">{actionData.action}</span>
                        <ProtocolBadge protocol={actionData.protocol} />
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Action Description */}
                      {action.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                          {action.description}
                        </div>
                      )}

                      {/* Parameters Section */}
                      <ParamsList actionArgs={actionData.actionArgs} />

                      {/* Transactions Section */}
                      <div className="space-y-2">
                        {actionData.transactions.map((tx, txIndex) => (
                          <div
                            key={txIndex}
                            className={cn(
                              "p-3 rounded-lg border",
                              tx.status === 'CONFIRMED' && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
                              tx.status === 'FAILED' && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
                              tx.status === 'SENT' && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
                              tx.status === 'UNSIGNED' && "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20",
                              tx.status === 'PENDING' && "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">
                                {tx.type === 'contractExecution' ? 'Contract Call' : 'Transfer'}
                              </span>
                              <StatusBadge status={tx.status} />
                            </div>

                            {/* Transaction Data */}
                            <TransactionData tx={tx} />



                            {tx.executionError && (
                              <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                  <span className="font-medium">Execution Error</span>
                                </div>
                                <p className="text-sm mt-1 ml-6">
                                  {tx.message || 'An error occurred during transaction execution'}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* Updated Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            {isCheckingStatus ? (
              <Button disabled variant="outline" className="min-w-[100px]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </Button>
            ) : !isSaved && (
              <Button
                onClick={handleSaveClick}
                disabled={isSaving}
                variant="outline"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Sequence'
                )}
              </Button>
            )}

            {isSaved && !areAllActionsConfirmed() && (
              <Button
                onClick={() => handleExecute(streamStatus === 'error')}
                disabled={isExecuting}
                className={cn(
                  "min-w-[100px]",
                  streamStatus === 'error' && "bg-red-500 hover:bg-red-600"
                )}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : streamStatus === 'error' ? (
                  'Retry'
                ) : (
                  'Execute All'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Sequence Contains Errors</AlertDialogTitle>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This sequence contains actions with errors. If you save this sequence:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Actions with errors will be removed from the sequence</li>
                <li>
                  If the remaining actions are dependent on each other (e.g., swapping token X to Z,
                  then sending token Z), the sequence may fail when executed
                </li>
                <li>
                  Only save if the remaining actions are independent and can be executed separately
                </li>
              </ul>
              <p className="font-medium text-yellow-600 dark:text-yellow-400">
                Are you sure you want to save this sequence without the error actions?
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveWithErrors}
              className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800"
            >
              Save Without Error Actions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transaction Sequence</AlertDialogTitle>
            <div className="space-y-3 text-sm text-muted-foreground">
              Before saving this transaction sequence, please verify:
              <ul className="list-disc pl-6 space-y-2">
                <li>Token addresses and symbols are correct</li>
                <li>Transaction amounts are accurate</li>
                <li>Target chains and protocols are as intended</li>
                <li>Transaction order is logical and dependencies are correct</li>
                <li>Gas fees and network conditions are acceptable</li>
              </ul>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Would you like to save this sequence?
              </span>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveWithErrors}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Sequence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TransactionDetails

