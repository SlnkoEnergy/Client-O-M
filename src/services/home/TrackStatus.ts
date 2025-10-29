import Axios from "@/utils/axios/Axios";

export const getTicketDetail = async (raw) => {
  const response = await Axios.get(`/getTicketByNo`, {
    params: { raw },
  });
  return response.data;
};
