import clsx from 'clsx';

import LogoMux from '@/components/platforms/mux/logo';
import LogoS3 from '@/components/platforms/s3/logo';
import useMigrationStore from '@/utils/store';
import { DestinationPlatform, SourcePlatform } from '@/utils/store';

type Platforms = {
  source: Array<Omit<SourcePlatform, 'type'>>;
  destination: Array<Omit<DestinationPlatform, 'type'>>;
};

const PLATFORMS: Platforms = {
  source: [
    {
      id: 's3',
      name: 'Amazon S3',
      logo: LogoS3,
    },
  ],
  destination: [
    {
      id: 'mux',
      name: 'Mux',
      logo: LogoMux,
    },
  ],
};

export default function PlatformList({ type }: { type: 'source' | 'destination' }) {
  const setPlatform = useMigrationStore((state) => state.setPlatform);
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);

  const platforms = PLATFORMS[type];
  const isSource = type === 'source';
  const title = isSource ? 'Select a source' : 'Select a destination';
  const description = isSource
    ? 'Select the platform where your videos are currently stored'
    : 'Select the platform to where you are migrating your videos';

  return (
    <div>
      <h2 className={`text-xl text-primary uppercase}`}>{title}</h2>
      <p className="text-xs mb-4">{description}</p>

      <div className="grid grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={clsx({
              'border-primary': sourcePlatform?.id === platform.id,
              'border-slate-200': sourcePlatform?.id !== platform.id,
              'shadow rounded p-4 flex flex-col items-center cursor-pointer border-2 w-40 h-40': true,
            })}
            onClick={() => {
              const platformWithType = { ...platform, type };
              if (type === 'source') {
                setPlatform('source', platformWithType as SourcePlatform);
              } else {
                setPlatform('destination', platformWithType as DestinationPlatform);
              }
              setCurrentStep(isSource ? 'set-source-credentials' : 'set-destination-credentials');
            }}
          >
            <div className="h-20 w-20 flex items-center justify-center">
              <platform.logo />
            </div>
            <h3 className="font-semibold text-slate-700 text-sm">{platform.name}</h3>
            {/* <p className='text-sm'>{platform.description}</p> */}
          </div>
        ))}
      </div>
    </div>
  );
}
