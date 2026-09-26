/** Helpers for turning photos picked from the user's device into the same kind
 * of data URL the camera produces, so the editor can treat both the same way. */

export const MAX_UPLOAD_PHOTOS = 4;

const MAX_FILE_BYTES = 30 * 1024 * 1024; // refuse absurdly large originals before decoding
const MAX_SIDE = 1600; // strip cells are 640×480, so this is plenty and keeps saves small

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Couldn't read "${file.name}". Try a JPG or PNG.`));
    };
    img.src = url;
  });
}

/** Decodes an image file, scales it down so its longest side is ≤ 1600px, and
 * returns it as a JPEG data URL. Browsers apply EXIF rotation when drawing an
 * <img>, so phone photos come out the right way up. Not mirrored, unlike camera shots. */
export async function fileToPhotoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" isn't an image.`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.name}" is too large (max 30 MB).`);

  const img = await loadImageFromFile(file);
  if (!img.naturalWidth || !img.naturalHeight) throw new Error(`Couldn't read "${file.name}".`);

  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#ffffff"; // transparent PNGs would otherwise turn black in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}
