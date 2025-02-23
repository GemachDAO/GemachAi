"use client"

import { LogOut, Moon, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import LoginButton from "./login-button"
import { deleteSession } from "@/lib/auth/session";


import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"


export function AccountMenu() {
    const { theme, setTheme } = useTheme()


    return (
        <DropdownMenu >

            <DropdownMenuTrigger asChild className="bg-foreground-muted">

                <Button variant="ghost" className="w-full justify-start ">
                    <User className="mr-2 h-4 w-4" />

                    Account
                </Button>

            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[15rem]">
                <DropdownMenuItem className="flex items-center justify-between">
                    <LoginButton />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
             
                <DropdownMenuItem className="flex items-center justify-between">
                    <div className="flex items-center">
                        {theme === "dark" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                        Theme
                    </div>
                    <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem className="flex items-center justify-between" onClick={deleteSession}>
                    Sign out
                    <LogOut className="mr-2 h-4 w-4" />
                 
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}

