import axios from "./axiosInstance";

const BASE = "/ok-quality/penandaan-lokasi";

export async function getPenandaan(no_reg) {
  const res = await axios.get(`${BASE}/${no_reg}`);
  return res.data;
}

export async function savePenandaan(data) {
  const res = await axios.post(BASE, data);
  return res.data;
}
