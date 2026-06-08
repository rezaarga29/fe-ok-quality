import axios from "./axiosInstance";

export async function getDokterList() {
  const res = await axios.get("/dokter");
  return res.data;
}
