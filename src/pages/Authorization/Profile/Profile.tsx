import { useEffect } from "react";
import apiClient from "../../../shared/utils/services/response";

const Profile = () => {
  const token = localStorage.getItem("access");
  useEffect(() => {
    getUser();
  }, []);
  const getUser = async () => {
    try {
      const response = await apiClient.get(
        "http://127.0.0.1:8000/users/api/profile/default/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };
  return <div></div>;
};

export default Profile;
