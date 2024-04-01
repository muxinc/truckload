import clsx from 'clsx';

import LogoCloudflare from '@/components/platforms/cloudflare/logo.svg';
import LogoMux from '@/components/platforms/mux/logo.svg';
import LogoS3 from '@/components/platforms/s3/logo.svg';
import useMigrationStore from '@/utils/store';
import { DestinationPlatform, SourcePlatform } from '@/utils/store';
import Image from 'next/image';
import Heading from '../heading';

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
    {
      id: 'cloudflare-stream',
      name: 'Cloudflare Stream',
      logo: LogoCloudflare,
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
      <Heading>{title}</Heading>
      <p className="text-xs mb-4">{description}</p>

      <div className="flex flex-wrap gap-4">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={clsx({
              'border-primary': sourcePlatform?.id === platform.id,
              'border-slate-200': sourcePlatform?.id !== platform.id,
              'rounded p-4 flex flex-col items-center cursor-pointer border-2 w-40 h-40': true,
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
            <div className="h-20 w-20 flex items-center justify-center relative">
              <Image src={platform.logo} fill alt={`${platform.name} logo`} />
            </div>
            <h3 className="font-semibold text-slate-700 text-sm">{platform.name}</h3>
            {/* <p className='text-sm'>{platform.description}</p> */}
          </div>
        ))}
      </div>
    </div>
  );
}
