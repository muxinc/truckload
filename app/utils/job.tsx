export async function createJob(jobId: string): Promise<Response> {
  return fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_URL}/party/${jobId}`, {
    method: 'POST',
    body: JSON.stringify({ id: jobId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateJobStatus(jobId: string, eventType: string, data: any): Promise<Response> {
  return fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_URL}/party/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify({ id: jobId, type: eventType, data }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
