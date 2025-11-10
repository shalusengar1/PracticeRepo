import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 

export default ProtectedRoute;
