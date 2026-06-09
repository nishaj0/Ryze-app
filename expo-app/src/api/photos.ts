import client from "./client";
import { ProgressPhoto } from "../types";

export const uploadPhoto = async (uri: string, type: string, date?: string, notes?: string) => {
  const formData = new FormData();
  const filename = uri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const fileType = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("photo", {
    uri,
    name: filename,
    type: fileType,
  } as any);
  formData.append("type", type);
  if (date) formData.append("date", date);
  if (notes) formData.append("notes", notes);

  const { data } = await client.post("/photos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as { photo: ProgressPhoto };
};

export const getPhotos = async (type?: string) => {
  const { data } = await client.get("/photos", { params: { type } });
  return data as { photos: ProgressPhoto[] };
};

export const deletePhoto = async (id: string) => {
  await client.delete(`/photos/${id}`);
};
