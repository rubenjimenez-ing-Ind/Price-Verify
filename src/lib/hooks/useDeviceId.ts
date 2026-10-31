'use client';

import { useEffect, useState } from 'react';
import { getOrCreateDeviceId } from '@/lib/deviceId';

export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  return deviceId;
}
