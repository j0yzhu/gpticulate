import {Link, Outlet} from "react-router";
import {ModeToggle} from "@/components/ui/mode-toggle.tsx";

function NavBar() {
    return (
        <div className="w-full bg-background/80 backdrop-blur px-4 py-2 flex items-center justify-between border-b">
            <Link to={"/"} className="flex flex-row items-center gap-2">
                <span className="text-2xl font-semibold">GPTiculate.</span>
            </Link>

            <ModeToggle/>
        </div>
    );
}

export default function Layout() {
    return (
        <>
            <div className="min-h-screen">
                <header className="fixed top-0 w-full z-50">
                    <NavBar/>
                </header>

                <main className="pt-16 px-4">
                    <Outlet/>
                </main>
            </div>

            {/*<footer>*/}
            {/*    <FooterBar/>*/}
            {/*</footer>*/}
        </>
    );
}