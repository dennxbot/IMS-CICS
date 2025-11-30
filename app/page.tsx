import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  ArrowRight,
  LayoutDashboard,
  Menu,
  Eye,
  Target,
  Info
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { createClient } from "@/utils/supabase/server";
import { LandingFooter } from "@/components/landing-footer";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('system_settings')
    .select('hero_image_url, name, logo_url')
    .single();

  const heroImage = settings?.hero_image_url;
  const systemName = settings?.name || 'IMS-CICS';
  const logoUrl = settings?.logo_url;

  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-md transition-all duration-300">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 md:gap-3 font-bold tracking-tight text-white">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={32}
                height={32}
                className="object-contain h-8 w-8 md:h-10 md:w-10"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/20">
                <LayoutDashboard className="h-5 w-5" />
              </div>
            )}
            <span className="text-lg md:text-xl font-bold tracking-tight text-white">{systemName}</span>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="dark w-[90vw] sm:w-[450px] !h-auto !top-16 !bottom-auto !right-4 rounded-xl border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground">
              <SheetHeader>
                <SheetTitle className="text-foreground text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-6">
                <div className="space-y-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0 h-auto font-bold text-lg text-blue-400 hover:text-blue-300 hover:bg-transparent gap-2">
                        <Eye className="h-5 w-5" />
                        VISION
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark bg-background border-border text-foreground w-[90vw] max-w-[425px] p-4 sm:p-6">
                      <DialogHeader>
                        <DialogTitle className="text-blue-400 text-lg sm:text-xl mb-2 sm:mb-4">VISION</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                          CSU is a University with global stature in the arts, culture, agriculture and fisheries, the sciences as well as technological and professional fields.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0 h-auto font-bold text-lg text-emerald-400 hover:text-emerald-300 hover:bg-transparent gap-2">
                        <Target className="h-5 w-5" />
                        MISSION
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark bg-background border-border text-foreground w-[90vw] max-w-[425px] p-4 sm:p-6">
                      <DialogHeader>
                        <DialogTitle className="text-emerald-400 text-lg sm:text-xl mb-2 sm:mb-4">MISSION</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                          Cagayan State University shall produce globally competent graduates through excellent instruction, innovative and creative research, responsive public service and productive industry and community engagement.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0 h-auto font-bold text-lg text-purple-400 hover:text-purple-300 hover:bg-transparent gap-2">
                        <Info className="h-5 w-5" />
                        About
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark bg-background border-border text-foreground w-[90vw] max-w-[425px] p-4 sm:p-6">
                      <DialogHeader>
                        <DialogTitle className="text-purple-400 text-lg sm:text-xl mb-2 sm:mb-4">About</DialogTitle>
                        <DialogDescription asChild>
                          <div className="text-muted-foreground text-sm sm:text-base space-y-3 sm:space-y-4 text-center">
                            <div>
                              <p className="font-semibold text-foreground mb-2">Developed by our interns:</p>
                              <div className="space-y-1">
                                <p>Jhomilyn P. Guerrero</p>
                                <p>Krizel Jane V. Sabio</p>
                                <p>Maricar C. Tabalno</p>
                                <p>Jenifer C. Uddipa</p>
                              </div>
                            </div>
                            <p className="pt-2 border-t border-border">
                              <span className="font-semibold text-foreground">Maintained by:</span> Mark Angelo Doctolero
                            </p>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-1 flex items-end justify-start min-h-screen overflow-hidden pb-40 md:pb-32">
          {/* Background Image */}
          <div className="absolute inset-0 -z-20">
            {heroImage ? (
              <Image
                src={heroImage}
                alt="Hero Background"
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
            )}
          </div>

          {/* Dark Overlay with Gradient */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

          <div className="container flex flex-col items-start text-left px-4 md:px-8 relative z-10 max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 leading-[1.1] max-w-4xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Internship Programs</span>
            </h1>

            <p className="mt-6 md:mt-8 max-w-xl md:max-w-2xl text-sm sm:text-base md:text-lg text-white/80 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 drop-shadow-md">
              Streamline the entire internship process for students, coordinators, and companies.
              Track hours, manage reports, and ensure compliance in one unified platform.
            </p>

            <div className="mt-8 md:mt-12 flex flex-col w-full sm:w-auto sm:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-10 md:h-12 px-6 text-sm md:text-base bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1">
                  Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-10 md:h-12 px-6 text-sm md:text-base border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all hover:-translate-y-1">
                  Access Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter systemName={systemName} />
    </div>
  )
}