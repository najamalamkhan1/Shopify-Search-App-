export async function apiFetch(
  endpoint,
  options = {}
) {

  const response =
    await fetch(

      `${import.meta.env.VITE_API_URL}${endpoint}`,

      {
        headers: {
          "Content-Type":
            "application/json"
        },

        ...options
      }

    );

  if (!response.ok) {

    throw new Error(
      `API Error: ${response.status}`
    );

  }

  return response.json();

}