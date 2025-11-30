"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PolicyModal } from "@/components/policy-modal"

interface LandingFooterProps {
    systemName: string
}

export function LandingFooter({ systemName }: LandingFooterProps) {
    const [isFooterVisible, setIsFooterVisible] = useState(false)

    return (
        <>
            {/* Toggle Button - Only visible on mobile */}
            <div className="md:hidden fixed bottom-2 right-4 z-20">
                <Button
                    onClick={() => setIsFooterVisible(!isFooterVisible)}
                    variant="ghost"
                    size="icon"
                    className="bg-black/60 hover:bg-black/80 text-white border border-white/20 rounded-full p-2 backdrop-blur-md shadow-lg"
                >
                    {isFooterVisible ? (
                        <ChevronDown className="h-5 w-5" />
                    ) : (
                        <ChevronUp className="h-5 w-5" />
                    )}
                    <span className="sr-only">{isFooterVisible ? 'Hide footer' : 'Show footer'}</span>
                </Button>
            </div>

            {/* Footer */}
            <footer
                className={`fixed bottom-0 w-full border-t border-white/20 bg-gradient-to-r from-black/60 via-black/50 to-black/60 backdrop-blur-md z-10 transition-transform duration-300 ${isFooterVisible ? 'translate-y-0 md:translate-y-0' : 'translate-y-full md:translate-y-0'
                    }`}
            >
                <div className="container py-2 md:py-4 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
                        {/* Left Section - Copyright */}
                        <div className="flex flex-col items-center md:items-start gap-0.5 md:gap-1">
                            <p className="text-xs md:text-sm text-white/80 font-medium text-center md:text-left">
                                © 2025 {systemName}
                            </p>
                            <p className="text-[10px] md:text-xs text-white/50 text-center md:text-left">
                                All rights reserved.
                            </p>
                        </div>

                        {/* Center Section - Links */}
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
                            <PolicyModal
                                type="privacy"
                                trigger={
                                    <button className="text-[10px] md:text-xs text-white/60 hover:text-white transition-all duration-300 hover:underline underline-offset-4">
                                        Privacy Policy
                                    </button>
                                }
                            />
                            <span className="text-white/30 hidden md:inline">•</span>
                            <PolicyModal
                                type="terms"
                                trigger={
                                    <button className="text-[10px] md:text-xs text-white/60 hover:text-white transition-all duration-300 hover:underline underline-offset-4">
                                        Terms of Service
                                    </button>
                                }
                            />
                        </div>

                        {/* Right Section - Made with love */}
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-white/50">
                            <span>Made with</span>
                            <span className="text-red-400 animate-pulse">❤️</span>
                            <span>by CSU Interns</span>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
