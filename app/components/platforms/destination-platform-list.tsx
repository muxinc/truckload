import { sriracha } from '@/_fonts';
import LogoMux from '@/components/platforms/mux/logo';

const DESTINATION_PLATFORMS = [
  {
    name: 'Mux',
    description: 'Mux is a video platform that takes the pain out of video encoding and streaming.',
    logo: LogoMux,
  },
];

export default function SourcePlatformList() {
  return (
    <div>
      <h2 className={`text-xl text-primary uppercase ${sriracha.className}`}>Select a destination</h2>
      <p className="text-xs mb-4">Select the platform to where you are migrating your videos</p>

      <div className="grid grid-cols-3">
        {DESTINATION_PLATFORMS.map((platform) => (
          <div
            key={platform.name}
            className="shadow rounded p-4 flex flex-col items-center cursor-pointer w-40 h-40 border-primary border-2"
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
