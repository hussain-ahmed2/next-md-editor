'use client'

import { createContext, useEffect } from "react"
import Clarity from '@microsoft/clarity';

const ClarityContext = createContext<undefined>(undefined)

export function ClarityProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
        if (!projectId) return;
        try {
            Clarity.init(projectId);
        } catch (e) {
            console.error("Failed to initialize Clarity analytics:", e);
        }
    }, [])
    return (
        <ClarityContext.Provider value={undefined}>
            {children}
        </ClarityContext.Provider>
    )
}