'use client'

import { createContext, useEffect } from "react"
import Clarity from '@microsoft/clarity';

const ClarityContext = createContext<undefined>(undefined)

export function ClarityProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        Clarity.init(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID!);
    }, [])
    return (
        <ClarityContext.Provider value={undefined}>
            {children}
        </ClarityContext.Provider>
    )
}