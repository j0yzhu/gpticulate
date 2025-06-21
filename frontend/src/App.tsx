import './App.css'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";

export default function App() {

  return (
    <>
        <Card>
            <div className="items-center justify-center">
                <CardHeader className="text-xl font-bold text-primary">
                    <CardTitle>Welcome to GPTiculate!</CardTitle>
                    <CardDescription>By Eli Chander, Joy Zhu</CardDescription>
                </CardHeader>
                <CardContent className="items-center justify-center text-lg">

                    <Button>Play</Button>
                </CardContent>
            </div>
        </Card>
    </>
  )
}

