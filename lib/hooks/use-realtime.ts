'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// Re-export the payload type for consumers
export type { RealtimePostgresChangesPayload };

// Connection state for debugging and UI feedback
export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Helper to safely extract typed data from payload.new
export function getPayloadNew<T extends Record<string, unknown>>(
  payload: RealtimePostgresChangesPayload<T>,
): T | undefined {
  const data = payload.new;
  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    return data as T;
  }
  return undefined;
}

// Helper to safely extract typed data from payload.old
export function getPayloadOld<T extends Record<string, unknown>>(
  payload: RealtimePostgresChangesPayload<T>,
): Partial<T> | undefined {
  const data = payload.old;
  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    return data as Partial<T>;
  }
  return undefined;
}

interface SubscriptionConfig<T extends Record<string, unknown>> {
  channelName: string;
  table: string;
  schema?: string;
  event?: PostgresChangeEvent;
  filter?: string;
  onEvent: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useRealtimeSubscription<T extends Record<string, unknown>>(config: SubscriptionConfig<T> | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    if (!config) {
      setStatus('disconnected');
      return;
    }

    // Prevent duplicate subscriptions
    if (channelRef.current) {
      logger.log(`Realtime channel ${config.channelName} already exists, skipping duplicate subscription`);
      return;
    }

    const supabase = createClient();
    const { channelName, table, schema = 'public', event = '*', filter, onEvent } = config;

    setStatus('connecting');
    const channel = supabase.channel(channelName);

    const subscriptionConfig: {
      event: PostgresChangeEvent;
      schema: string;
      table: string;
      filter?: string;
    } = {
      event,
      schema,
      table,
    };

    if (filter) {
      subscriptionConfig.filter = filter;
    }

    channel
      .on(
        'postgres_changes',
        subscriptionConfig,
        onEvent as (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
      )
      .subscribe((status) => {
        if (isCleaningUpRef.current) return;

        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          logger.log(`Realtime subscription connected: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setStatus('error');
          logger.error(`Realtime subscription error: ${channelName}`, { status });
        }
      });

    channelRef.current = channel;

    return () => {
      isCleaningUpRef.current = true;
      setStatus('disconnected');

      if (channelRef.current) {
        logger.log(`Cleaning up realtime subscription: ${channelName}`);
        supabase.removeChannel(channelRef.current).then(() => {
          logger.log(`Realtime subscription removed: ${channelName}`);
        });
        channelRef.current = null;
      }

      isCleaningUpRef.current = false;
    };
  }, [config]);

  return { channel: channelRef.current, status };
}

// Helper for multiple subscriptions on same channel
interface MultiSubscriptionConfig<T extends Record<string, unknown>> {
  channelName: string;
  subscriptions: Array<{
    table: string;
    schema?: string;
    event?: PostgresChangeEvent;
    filter?: string;
    onEvent: (payload: RealtimePostgresChangesPayload<T>) => void;
  }>;
}

export function useMultiRealtimeSubscription<T extends Record<string, unknown>>(
  config: MultiSubscriptionConfig<T> | null,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    if (!config) {
      setStatus('disconnected');
      return;
    }

    // Prevent duplicate subscriptions
    if (channelRef.current) {
      logger.log(`Realtime channel ${config.channelName} already exists, skipping duplicate subscription`);
      return;
    }

    const supabase = createClient();
    const { channelName, subscriptions } = config;

    setStatus('connecting');
    let channel = supabase.channel(channelName);

    for (const sub of subscriptions) {
      const { table, schema = 'public', event = '*', filter, onEvent } = sub;

      const subscriptionConfig: {
        event: PostgresChangeEvent;
        schema: string;
        table: string;
        filter?: string;
      } = {
        event,
        schema,
        table,
      };

      if (filter) {
        subscriptionConfig.filter = filter;
      }

      channel = channel.on(
        'postgres_changes',
        subscriptionConfig,
        onEvent as (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
      );
    }

    channel.subscribe((subscribeStatus) => {
      if (isCleaningUpRef.current) return;

      if (subscribeStatus === 'SUBSCRIBED') {
        setStatus('connected');
        logger.log(`Multi-realtime subscription connected: ${channelName}`);
      } else if (subscribeStatus === 'CHANNEL_ERROR' || subscribeStatus === 'TIMED_OUT') {
        setStatus('error');
        logger.error(`Multi-realtime subscription error: ${channelName}`, { status: subscribeStatus });
      }
    });

    channelRef.current = channel;

    return () => {
      isCleaningUpRef.current = true;
      setStatus('disconnected');

      if (channelRef.current) {
        logger.log(`Cleaning up multi-realtime subscription: ${channelName}`);
        supabase.removeChannel(channelRef.current).then(() => {
          logger.log(`Multi-realtime subscription removed: ${channelName}`);
        });
        channelRef.current = null;
      }

      isCleaningUpRef.current = false;
    };
  }, [config]);

  return { channel: channelRef.current, status };
}
