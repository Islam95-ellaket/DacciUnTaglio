// Upload diretto al browser -> Cloudinary (senza passare dal nostro server:
// il file non tocca né Render né MongoDB, salviamo solo l'URL nel servizio).
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_SIZE_MB = 5;

// Carica il file su Cloudinary e restituisce l'URL https dell'immagine.
export const uploadImageToCloudinary = async (file) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Upload immagini non configurato: mancano le variabili Cloudinary."
    );
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Immagine troppo grande (massimo ${MAX_SIZE_MB} MB).`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Caricamento dell'immagine fallito.");
  }
  return data.secure_url;
};
