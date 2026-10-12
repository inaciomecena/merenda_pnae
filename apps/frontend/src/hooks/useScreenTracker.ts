import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getScreenByPath } from '../config/screens.config';

/** Identifica a tela atual para suporte, auditoria visual e título do navegador. */
export function useScreenTracker(customScreenCode?: string) {
  const location = useLocation();
  const definition = getScreenByPath(location.pathname);
  const screenCode = customScreenCode || definition.code;

  useEffect(() => {
    document.body.setAttribute('data-screen-code', screenCode);
    document.title = `${definition.label} | Plataforma PNAE`;
    return () => document.body.removeAttribute('data-screen-code');
  }, [definition.label, screenCode]);

  return { screenCode, screenLabel: definition.label };
}

export function useScreenCode(screenCode: string) {
  useEffect(() => {
    document.body.setAttribute('data-screen-code', screenCode);
    return () => document.body.removeAttribute('data-screen-code');
  }, [screenCode]);
  return { screenCode };
}
