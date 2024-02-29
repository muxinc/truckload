import useMigrationStore from '@/utils/store';

export default function VideoFilter() {
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const setAssetFilter = useMigrationStore((state) => state.setAssetFilter);
  return (
    <div>
      <div className="mb-4">
        <h2 className={`text-primary uppercase font-bold text-lg`}>Select your videos</h2>
        <p className="text-xs">What exactly do you want to transfer?</p>
      </div>

      <div className="flex gap-4">
        <button
          className="p-4 border-primary border-2 rounded text-slate-600 text-base h-28 w-56"
          onClick={() => {
            setAssetFilter([]);
            setCurrentStep('select-destination');
          }}
        >
          Move everything. All of it.
        </button>
        <button className="text-gray-300 disabled cursor-not-allowed">Let me choose which videos</button>
      </div>
    </div>
  );
}
