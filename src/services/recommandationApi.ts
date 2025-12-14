const API_URL = import.meta.env.VITE_API_URL;


export async function getRecommendations(profile: any) {
  const response = await fetch(`${API_URL}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error("Erreur API");
  }

  return response.json();
}
