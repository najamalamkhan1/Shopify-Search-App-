export async function apiFetch(
  endpoint,
  options = {}
) {
  const baseUrl =
    import.meta.env.VITE_API_URL ||
    "https://search-app-hcwsn.ondigitalocean.app";

  const response =
    await fetch(

      `${baseUrl}${endpoint}`,

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
