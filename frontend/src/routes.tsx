import {
    createBrowserRouter
} from "react-router";

import Layout from "@/layout.tsx";
import App from "@/App.tsx";
import Homepage from "@/pages/Homepage.tsx";

export const router = createBrowserRouter([
    {
        element: <App/>,
        children: [
            {
                element: <Layout/>,
                children: [
                    {
                        path: "/",
                        element: <Homepage/>
                    }
                ]
            }
        ]
    },
]);