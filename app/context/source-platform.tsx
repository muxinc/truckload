'use client';

// the responsibility of the SourcePlatformContext is to keep
// localstorage `in-n-out-video:source-platform` and clientstate in sync
import { createContext, useContext } from 'react';

import useLocalStorageState from '@/utils/useLocalStorageState';

type SourcePlatform = {
  name: 's3' | null;
};

export const platformValidator = (value: unknown): value is SourcePlatform => typeof value === 'object';

type SetSourcePlatformPropertyFn = (id: string, key: string) => void;
type SourcePlatformContextValue = {
  sourcePlatform: SourcePlatform;
  setSourcePlatformProperty: SetSourcePlatformPropertyFn;
};
type DefaultValue = undefined;
type ContextValue = SourcePlatformContextValue | DefaultValue;

export const SourcePlatformContext = createContext<ContextValue>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

const SourcePlatformProvider = ({ children }: ProviderProps) => {
  const [sourcePlatform, setSourcePlatform] = useLocalStorageState<SourcePlatform>({
    initialValue: { name: 's3' },
    key: 'source-platform',
    validator: platformValidator,
  });

  const setSourcePlatformProperty: SetSourcePlatformPropertyFn = (id, key) => {
    setSourcePlatform({ ...sourcePlatform, [id]: key });
  };

  /* Finally, we wrap this all up in a provider to give it to our children */
  const value = {
    sourcePlatform,
    setSourcePlatformProperty,
  };
  return <SourcePlatformContext.Provider value={value}>{children}</SourcePlatformContext.Provider>;
};

export const useSourcePlatformContext = () => useContext(SourcePlatformContext) as SourcePlatformContextValue;
export default SourcePlatformProvider;
