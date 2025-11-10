import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { login, logout } from "../../store/user/authSlice";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const signIn = (userData: any , redirectPath:string = "/dashboard") => {
    dispatch(login(userData));
    localStorage.setItem("token", userData.token);
    navigate(redirectPath);
  };

  const signOut = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/sign-in");
  };

  return { user, isAuthenticated, signIn, signOut };
};
