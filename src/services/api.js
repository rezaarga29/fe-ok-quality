import axios from "axios";
let env = import.meta.env;

export async function getChaperones(configs) {
  const response = await axios.get(env.VITE_API_URL + "/admission-chaperones", configs);

  return await response.data.data;
}

export async function getVisitors(configs) {
  const response = await axios.get(env.VITE_API_URL + "/nurse-visitors", configs);

  return await response.data.data;
}

export async function postChaperone(data, configs) {
  return await axios.post(
    env.VITE_API_URL + "/admission-chaperones",
    data,
    configs
  );
}

export async function postVisitor(data, configs) {
  return await axios.post(env.VITE_API_URL + "/nurse-visitors", data, configs);
}
