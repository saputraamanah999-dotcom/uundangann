// src/hooks/useGuestFromUrl.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { SITE_ID } from '../lib/firebase/client';
import { Guest } from '../types/invitation';

export function useGuestFromUrl() {
  const [guestName, setGuestName] = useState<string>('');
  const [guestInfo, setGuestInfo] = useState<Guest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to') || '';

    if (!toParam) {
      setGuestName('Bapak/Ibu/Saudara/i');
      setLoading(false);
      return;
    }

    // Treat 'toParam' as either a raw name (with spaces/pluses) or a slug
    const cleanTo = toParam.trim();
    const isSlug = /^[a-z0-9-]+$/.test(cleanTo);

    const logVisit = async (slug: string) => {
      try {
        await supabase.from('visit_logs').insert({
          site_id: SITE_ID,
          guest_slug: slug,
          user_agent: navigator.userAgent
        });
      } catch (e) {
        console.warn("Could not write visit log to Supabase:", e);
      }
    };

    if (isSlug) {
      // 1. Try to fetch from Supabase 'guests' table using slug
      const fetchGuestAndLog = async () => {
        try {
          const { data, error } = await supabase
            .from('guests')
            .select('*')
            .eq('site_id', SITE_ID)
            .eq('slug', cleanTo)
            .maybeSingle();

          if (data) {
            setGuestInfo(data as Guest);
            setGuestName(data.name);
          } else {
            // Fallback: format slug to Title Case
            const formattedName = cleanTo
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setGuestName(formattedName);
          }
          await logVisit(cleanTo);
        } catch (err) {
          console.warn("Supabase guest fetch error, falling back:", err);
          // Fallback to title case of slug
          const formattedName = cleanTo
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setGuestName(formattedName);
        } finally {
          setLoading(false);
        }
      };

      fetchGuestAndLog();
    } else {
      // 2. Direct raw name (e.g. ?to=I+Wayan+Sudarsa)
      setGuestName(cleanTo);
      setLoading(false);
      // Log visit as raw name
      logVisit(cleanTo.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  }, []);

  return { guestName, guestInfo, loading };
}
