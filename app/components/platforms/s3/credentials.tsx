'use client';

import { useState } from 'react';

export default async function Credentials() {
  const [accessKeyId, setAccessKeyId] = useState<string | null>(null);
  const [secretAccessKey, setSecretAccessKey] = useState<string | null>(null);
  return (
    <>
      <h2>Amazon S3 Credentials</h2>
      <p>Access Key ID</p>
      <input type="text" onChange={(e) => setAccessKeyId(e.target.value)} />
      <p>Secret Access Key</p>
      <input type="text" onChange={(e) => setSecretAccessKey(e.target.value)} />
    </>
  );
}
