import { motion } from 'framer-motion';
import Image from 'next/image';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <Image src="/logo.svg" alt="Gemach Logo" width={32} height={32} />

        </p>
        <p>
          Gemach AI is an on-chain assistant that helps you navigate and execute blockchain transactions with ease.
          It provides intelligent guidance for interacting with smart contracts, managing digital assets,
          and understanding blockchain operations, all through a natural conversation interface powered by{' '}
          <code className="rounded-md bg-muted px-1 py-0.5">AI technology</code>{' '}
          and seamlessly connected to the blockchain.
        </p>
      </div>
    </motion.div>
  );
};
