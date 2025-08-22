"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { api } from "@/services/api";
import AuthEntry from "@/components/AuthEntry";

/**
 * Landing con animación (Framer Motion) + AuthEntry.
 * - Logo centrado
 * - Fade-in + parallax sutil con blobs
 * - Si hay sesión → botón "Entrar" (redirige a /privado)
 * - Si no hay sesión → muestra <AuthEntry /> (redirige a /api/auth/login)
 *
 * Requisitos:
 * 1) `npm i framer-motion`
 * 2) `/public/logo-celcol.svg` existente (ajustá `logoSrc` si cambia)
 * 3) Endpoint liviano de sesión: GET /api/auth/me → 200 cuando hay sesión
 *
 * Colocar como `src/app/page.tsx`.
 */
export default function LandingPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  // Chequeo liviano de sesión; si no existe el endpoint, cae en false
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(api("/api/auth/me"), { credentials: "include" });
        if (!cancelled) setHasSession(res.ok);
      } catch {
        if (!cancelled) setHasSession(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Parallax sutil con el mouse
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-30, 30], [8, -8]);
  const rotateY = useTransform(mx, [-30, 30], [-8, 8]);

  const onPointerMove = (e: React.PointerEvent) => {
    const t = e.currentTarget as HTMLElement;
    const rect = t.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    mx.set((relX / rect.width) * 60);
    my.set((relY / rect.height) * 60);
  };

  const logoSrc = "/logo-celcol.svg"; // Cambiá si tu archivo se llama distinto

  const subtitle = useMemo(
    () => <span className="text-slate-500/90">Gestión de taller aeronáutico</span>,
    []
  );

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-white to-slate-50"
      onPointerMove={onPointerMove}
    >
      {/* backdrops sutiles */}
      <motion.div
        aria-hidden
        style={{ rotateX, rotateY }}
        className="pointer-events-none absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-cyan-100 blur-3xl opacity-60"
      />
      <motion.div
        aria-hidden
        style={{ rotateX, rotateY }}
        className="pointer-events-none absolute -bottom-44 -left-44 h-[520px] w-[520px] rounded-full bg-sky-100 blur-3xl opacity-60"
      />

      <section className="container mx-auto px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="flex items-center justify-center">
            <Image
              src="/celcol-logo.webp"
              alt="Celcol"
              width={320}
              height={280}
              priority
              className="h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] select-none"
            />
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Celcol</h1>
          <p className="mt-2 text-base sm:text-lg">{subtitle}</p>

          <div className="mt-10">
            {hasSession ? (
              <button
                onClick={() => { window.location.href = '/api/auth/login' }}
                disabled={checking}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-6 py-3 text-white shadow-lg shadow-cyan-600/20 transition-transform hover:scale-[1.02] hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600/60 active:scale-[0.99]"
              >
                Entrar
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path d="M3.75 12a.75.75 0 0 1 .75-.75h11.19l-3.22-3.22a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H4.5a.75.75 0 0 1-.75-.75Z" />
                </svg>
              </button>
            ) : (
              <AuthEntry />
            )}
          </div>

          {/* Texto pequeño de estado (ayuda a debug pero no molesta) */}
          <p className="mt-4 text-xs text-slate-400">
            {hasSession === null ? "Detectando sesión…" : hasSession ? "Sesión activa" : "Sesión no iniciada"}
          </p>
        </motion.div>
      </section>
    </main>
  );
}
