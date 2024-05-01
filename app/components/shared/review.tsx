import Heading from '@/components/heading';

export default function Review() {
  return (
    <div>
      <Heading>Review</Heading>
      <p className="mt-2">Before the big move, there&apos;s one important last step.</p>
      <p className="mt-2">
        Since your video providers likely charge for moving and storing files, make sure you understand any costs
        you&apos;ll incur by migrating your videos.
      </p>
      <p className="mt-2">
        By using Truckload, you agree that you are responsible for the actions taken on each platform as part of the
        migration, including any fees your providers charge.
      </p>
      <p className="mt-2">Click &ldquo;Move Videos&rdquo; in the moving list to start your migration.</p>
    </div>
  );
}
