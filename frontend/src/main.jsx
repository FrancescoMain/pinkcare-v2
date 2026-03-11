import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Inizializza i18next per le traduzioni
import "./i18n";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
