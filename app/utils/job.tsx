export async function createJob(jobId: string): Promise<Response> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_URL}/party/${jobId}`, {
    method: 'POST',
    body: JSON.stringify({ id: jobId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to create job in PartyKit: ${response.status}`);
  }

  return response;
}

export async function updateJobStatus(jobId: string, eventType: string, data: any): Promise<Response> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_URL}/party/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify({ id: jobId, type: eventType, data }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to update job in PartyKit: ${response.status}`);
  }

  return response;
}
