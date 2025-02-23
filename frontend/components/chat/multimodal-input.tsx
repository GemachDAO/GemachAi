'use client';
import { cn } from "@/lib/utils";
import { Send, FileUp, X } from "lucide-react";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { Attachment, ChatRequestOptions, CreateMessage, Message } from 'ai';

import React, {
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { sanitizeUIMessages } from '@/lib/utils';

import { StopIcon } from '../icons';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { client } from '@/lib/client';
import { useConnectModal } from "thirdweb/react";

const suggestedActions = [
  {
    title: 'What is the price of ETH?',
    label: 'price query',
    action: 'What is the price of ETH in USD?',
  },
  {
    title: 'Show ETH balance',
    label: 'balance query',
    action: 'What is my ETH balance?',
  },
];

// interface FileDisplayProps {
//   fileName: string;
//   onClear: () => void;
// }

// function FileDisplay({ fileName, onClear }: FileDisplayProps) {
//   return (
//     <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 w-fit px-3 py-1 rounded-lg group border dark:border-white/10">
//       <FileUp className="w-4 h-4 dark:text-white" />
//       <span className="text-sm dark:text-white">{fileName}</span>
//       <button
//         type="button"
//         onClick={onClear}
//         className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
//       >
//         <X className="w-3 h-3 dark:text-white" />
//       </button>
//     </div>
//   );
// }

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  user,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  className?: string;
  user?: User;
}) {
  const { width } = useWindowSize();
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 52,
    maxHeight: 200,
  });

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const { connect, } = useConnectModal();



  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    ''
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {

    setInput(event.target.value);
    adjustHeight();
  };

  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue,] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    // window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  // const uploadFile = async (file: File) => {
  //   const formData = new FormData();
  //   formData.append('file', file);

  //   try {
  //     const response = await fetch(`/api/files/upload`, {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       const { url, pathname, contentType } = data;

  //       return {
  //         url,
  //         name: pathname,
  //         contentType: contentType,
  //       };
  //     } else {
  //       const { error } = await response.json();
  //       toast.error(error);
  //     }
  //   } catch (error) {
  //     toast.error('Failed to upload file, please try again!');
  //   }
  // };

  // const handleFileChange = useCallback(
  //   async (event: ChangeEvent<HTMLInputElement>) => {
  //     const files = Array.from(event.target.files || []);

  //     setUploadQueue(files.map((file) => file.name));

  //     try {
  //       const uploadPromises = files.map((file) => uploadFile(file));
  //       const uploadedAttachments = await Promise.all(uploadPromises);
  //       const successfullyUploadedAttachments = uploadedAttachments.filter(
  //         (attachment) => attachment !== undefined
  //       );

  //       setAttachments((currentAttachments) => [
  //         ...currentAttachments,
  //         ...successfullyUploadedAttachments,
  //       ]);
  //     } catch (error) {
  //       console.error('Error uploading files!', error);
  //     } finally {
  //       setUploadQueue([]);
  //     }
  //   },
  //   [setAttachments]
  // );

  return (
    <div className="relative w-full flex flex-col gap-4">
      {/* {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="grid sm:grid-cols-2 gap-2 w-full">
            {suggestedActions.map((suggestedAction, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.05 * index }}
                key={index}
                className={index > 1 ? 'hidden sm:block' : 'block'}
              >
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (!user) {
                      toast.error('Please sign in to continue!');
                      return;
                    }
                    // window.history.replaceState({}, '', `/chat/${chatId}`);

                    append({
                      role: 'user',
                      content: suggestedAction.action,
                    });
                  }}
                  className="text-left rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                >
                  <span className="font-medium">{suggestedAction.title}</span>
                  <span className="text-muted-foreground">
                    {suggestedAction.label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        )} */}
      <div className={cn("w-full py-2 sm:py-4 px-2 sm:px-0", className)}>
        <div className="relative max-w-2xl w-full mx-auto flex flex-col gap-2">
          {/* {fileName && <FileDisplay fileName={fileName} onClear={clearFile} />} */}

          <div className="relative">
            {/* <div
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 sm:h-8 w-7 sm:w-8 rounded-lg bg-black/5 dark:bg-white/5 hover:cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="w-3.5 sm:w-4 h-3.5 sm:h-4 transition-opacity transform scale-x-[-1] rotate-45 dark:text-white" />
                    </div> */}

            {/* <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept={accept}
                    /> */}

            <Textarea
              ref={textareaRef}
              id={'ai-input-with-file'}
              placeholder={'Ask me anything about your wallet...'}
              className={cn(
                "max-w-2xl bg-black/5 dark:bg-white/5 w-full rounded-2xl sm:rounded-3xl pl-6 sm:pl-6 pr-12 sm:pr-16",
                "placeholder:text-black/70 dark:placeholder:text-white/70",
                "border-collapse ring-black/30 dark:ring-white/30",
                "text-black dark:text-white text-wrap py-3 sm:py-4",
                "text-sm sm:text-base",
                "max-h-[200px] overflow-y-auto resize-none leading-[1.2] focus-visible:ring-0",
                `min-h-[52px]`
              )}

              value={input}
              autoFocus
              onChange={handleInput}
              onKeyDown={async (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (!user) {
                    await connect({ client, });
                    return;
                  }

                  if (isLoading) {
                    toast.error('Please wait for the model to finish its response!');
                  } else {
                    submitForm();
                  }
                }
              }}
            />


            {
              isLoading ? (<Button
                className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border-collapse"
                onClick={(event) => {
                  event.preventDefault();
                  stop();
                  setMessages((messages) => sanitizeUIMessages(messages));
                }}
              >
                <StopIcon size={14} />
              </Button>) : (
                <Button
                  className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border-collapse "
                  onClick={async (event) => {
                    event.preventDefault();
                    if (!user) {
                      await connect({ client, });
                      return;
                    }
                    submitForm();
                  }}
                  disabled={input.length === 0 || uploadQueue.length > 0}
                >
                  <Send
                    className={cn(
                      "w-3.5 sm:w-4 h-3.5 sm:h-4 transition-opacity ",
                      // (inputValue || selectedFile) ? "opacity-100" : "opacity-30"
                    )}
                  />
                </Button>
              )

            }
          </div>
        </div>
      </div>


    </div>
  );
}
