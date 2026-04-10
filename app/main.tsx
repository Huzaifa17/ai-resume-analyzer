import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Upload from "./routes/upload";
import Resume from "./routes/resume";
import Home from "./routes/home";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/resume/:id" element={<Resume />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);