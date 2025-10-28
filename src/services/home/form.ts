import Axios from "@/utils/axios/Axios";

export const getProjectByNumber = async ({ number }: { number: string }) => {
    try {
        const response = await Axios.get("/projectByNo", { params: { number } });

        return response.data;
    } catch (error) {
        console.log("Error Fetching projects", error);
        return [];
    }
}

export const getProjectById = async (id: string) => {
    try {

        const response = await Axios.get(`/get-projectById/${id}?_id=${id}`);

        return response.data?.data;
    } catch (error) {
        console.error("Error fetching project details:", error);
        return null;
    }
};

export const getAllCategories = async () => {
    try {

        const response = await Axios.get("/getAllCategories");

        return response.data?.data;
    } catch (error) {
        console.error("Error Fetching Categories", error);
        return [];
    }
}

export const CreateComplaint = async (formData: FormData) => {
    try {
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        const res = await Axios.post("/create-complaint", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data;
    } catch (error) {
        console.error("Error Submitting Complaint:", error);
        throw error;
    }
};