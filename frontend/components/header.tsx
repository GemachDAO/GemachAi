import React from 'react'
import Image from 'next/image'
import LoginButton from '@/components/login-button'
const Header = () => {
  return (
    <div className="flex h-14 items-center justify-between flex-1">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer flex flex-row items-center gap-2 font-geist">
          <Image src="/logo.svg" alt="agent-logo" width={24} height={24} />
          Gemach AI
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* <nav className="flex items-center gap-4">
          <Link 
            href="https://support.gemach.ai" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Support
          </Link>
          <Link 
            href="https://docs.gemach.ai" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Docs
          </Link>
        </nav> */}
        <LoginButton />
      </div>
    </div>
  )
}

export default Header 