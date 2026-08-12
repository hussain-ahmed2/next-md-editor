'use client'

import { createContext, useEffect } from "react"

const ClarityContext = createContext<undefined>(undefined)

export function ClarityProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
        // Imported lazily and only when configured, so the analytics bundle
        // never ships to users on the landing page / unconfigured deploys.
        if (!projectId) return;
        import("@microsoft/clarity")
            .then(({ default: Clarity }) => Clarity.init(projectId))
            .catch((e) => console.error("Failed to initialize Clarity analytics:", e));
    }, [])
    return (
        <ClarityContext.Provider value={undefined}>
            {children}
        </ClarityContext.Provider>
    )
}