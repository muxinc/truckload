import clsx from 'clsx';

export default function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={clsx({
        'text-white uppercase text-center text-xl flex items-center justify-center mb-2': true,
      })}
      style={{
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_2" x="0px" y="0px" width="400px" height="82px" viewBox="0 0 400 82" enable-background="new 0 0 400 82" xml:space="preserve"><polygon fill="%23B81F37" points="0,0 400,0 371.598,40.402 400,82 0,82 26.339,42.567 "/></svg>')`,
        backgroundSize: '200px 41px',
        width: '200px',
        height: '41px',
      }}
    >
      {children}
    </div>
  );
}
