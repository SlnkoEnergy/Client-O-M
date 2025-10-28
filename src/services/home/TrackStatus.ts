import Axios from "@/utils/axios/Axios";

export const getTicketDetail = async (ticket_id) => {
  const response = await Axios.get(`http://localhost:8080/v1/getTicketByNo`, {
    params: { ticket_id }, // <-- use query param properly
  });
  return response.data;
};
