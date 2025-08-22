// src/app/login/page.tsx
'use client';
import { useEffect } from 'react';

export default function LoginRedirect() {
  useEffect(() => { window.location.href = '/api/auth/login' }, []);
  return null;
}
