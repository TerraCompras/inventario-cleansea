import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import ConfirmarRemito from "./ConfirmarRemito";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/confirmar/:token" element={<ConfirmarRemito />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
