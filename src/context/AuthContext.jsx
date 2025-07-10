import React, { createContext, useState, useEffect } from "react";
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("users")) {
      localStorage.setItem(
        "users",
        JSON.stringify([
          { username: "admin", password: "adminpassword", role: "admin", color: "gray" },
          { username: "bacon", password: "bacon123", role: "tattooist", color: "red" },
          { username: "tyson", password: "tyson123", role: "tattooist", color: "blue" },
          { username: "celine", password: "celine123", role: "tattooist", color: "pink" },
        ])
      );
    }
  }, []);

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem("users"));
    const found = users.find((u) => u.username === username && u.password === password);
    if (found) setUser(found);
    else alert("Ungültige Anmeldedaten");
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
