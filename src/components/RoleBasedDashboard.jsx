import React from "react";

function RoleBasedDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.Role;

  if (role === "admin") {
    return <div>Admin Dashboard</div>;
  }

  return <div>Access Denied</div>;
}

export default RoleBasedDashboard;
