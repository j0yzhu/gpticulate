import '../App.css'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx"
import {Button} from "@/components/ui/button.tsx";

export default function Homepage() {

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl text-primary font-black text-center">
                    GPTiculate.
                </h1>
                <p className="text-lg text-muted-foreground text-center">
                    By Eli Chander, Joy Zhu
                </p>
            </div>


        </div>
    );
}

function SetupCard() {
    const [ages, setAges] = React.useState<number[]>([]);
    const [topics, setTopics] = React.useState<string[]>([]);

    return (
        <Card className="max-w-lg">
            <CardHeader className="text-xl font-bold text-primary">
                <CardTitle>Set up game</CardTitle>
                <CardDescription>Select your options and hit play!</CardDescription>
            </CardHeader>
            <CardContent className="items-center justify-center text-lg">

                <Button>Play</Button>
            </CardContent>
        </Card>
    );
}

