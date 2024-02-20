import { sriracha } from '@/_fonts';
import LogoMux from '@/components/platforms/mux/logo';
import LogoS3 from '@/components/platforms/s3/logo';
import useMigrationStore from '@/utils/store';

const PLATFORMS = {
  source: [
    {
      id: 's3',
      name: 'Amazon S3',
      description:
        'Amazon S3 is an object storage service that offers industry-leading scalability, data availability, security, and performance.',
      logo: LogoS3,
    },
  ],
  destination: [
    {
      id: 'mux',
      name: 'Mux',
      description: 'Mux is a video platform that takes the pain out of video encoding and streaming.',
      logo: LogoMux,
    },
  ],
};

export default function PlatformList({ type }: { type: 'source' | 'destination' }) {
  const setPlatform = useMigrationStore((state) => state.setPlatform);
  const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);

  const platforms = PLATFORMS[type];
  const isSource = type === 'source';
  const title = isSource ? 'Select a source' : 'Select a destination';
  const description = isSource
    ? 'Select the platform where your videos are currently stored'
    : 'Select the platform to where you are migrating your videos';

  return (
    <div>
      <h2 className={`text-xl text-primary uppercase ${sriracha.className}`}>{title}</h2>
      <p className="text-xs mb-4">{description}</p>

      <div className="grid grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`shadow rounded p-4 flex flex-col items-center cursor-pointer border-2 border-primary w-40 h-40`}
            onClick={() => setPlatform(type, { id: platform.id, type })}
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
