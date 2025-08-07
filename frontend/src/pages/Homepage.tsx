import '../App.css'
import {
    Card,
    CardContent,
    CardDescription, CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx"
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useState} from "react";
import {Badge} from "@/components/ui/badge.tsx";
import {XIcon} from "lucide-react";
import {Label} from "@/components/ui/label.tsx";
import SessionService from "@/services/session-service.ts";
import {useNavigate} from "react-router";

export default function Homepage() {

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl text-primary font-black text-center">
                    GPTiculate.
                </h1>
                <p className="text-lg text-muted-foreground text-center">
                    By Eli Chandler, Joy Zhu
                </p>
            </div>

            <div className="flex justify-center">
                <SetupCard/>
            </div>

        </div>
    );
}

function SelectionBadge({text, onClick}: { text: string, onClick: () => void }) {
    return (
        <Badge
            variant="outline"
            className="hover:bg-destructive"
            onClick={onClick}
        >
            {text}
            <XIcon/>
        </Badge>
    );
}

function SetupCard() {
    const [agesInput, setAgesInput] = useState<string>('');
    const [ages, setAges] = useState<number[]>([]);
    const [topicsInput, setTopicsInput] = useState<string>('');
    const [topics, setTopics] = useState<string[]>([]);

    const navigate = useNavigate();

    function removeAge(age: number) {
        setAges(ages.filter(a => a !== age));
    }

    function addAge() {
        const age = parseInt(agesInput);
        if (!isNaN(age) && !ages.includes(age)) {
            setAges([...ages, age]);
        }
        setAgesInput('');
    }

    function removeTopic(topic: string) {
        setTopics(topics.filter(t => t !== topic));
    }

    function addTopic() {
        if (topicsInput.trim() && !topics.includes(topicsInput)) {
            setTopics([...topics, topicsInput.trim()]);
        }
        setTopicsInput('');
    }

    async function handlePlay() {
        const session = await SessionService.createSession(
            ages,
            topics
        )

        // Redirect to the game page with the session ID
        navigate(`/game/${session.id}`, {});
    }

    return (
        <Card className="max-w-lg w-full">
            <CardHeader className="text-xl font-bold text-primary">
                <CardTitle>Set up game</CardTitle>
                <CardDescription>Select your options and hit play!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <Label
                    htmlFor="age-input"
                    className="text-sm font-medium text-muted-foreground"
                >
                    Age Groups
                </Label>
                <div className="flex flex-wrap gap-2">
                    {
                        ages.map((age) => (
                            <SelectionBadge
                                key={age}
                                text={age.toString()}
                                onClick={() => removeAge(age)}
                            />
                        ))
                    }
                </div>
                <form
                    className="flex flex-col gap-1"
                    onSubmit={(e) => {
                        e.preventDefault();
                        addAge();
                    }}
                >

                    <div className="flex gap-2 max-w-sm">
                        <Input
                            id="age-input"
                            value={agesInput}
                            onChange={(e) => setAgesInput(e.target.value)}
                            type="number"
                            placeholder="Add age group"
                        />
                        <Button
                            variant="outline"
                        >
                            Add
                        </Button>
                    </div>
                </form>
                <Label
                    htmlFor="topic-input"
                    className="text-sm font-medium text-muted-foreground"
                >
                    Topics
                </Label>
                <div className="flex flex-wrap gap-2">

                    {
                        topics.map((topic) => (
                            <SelectionBadge
                                key={topic}
                                text={topic}
                                onClick={() => removeTopic(topic)}
                            />
                        ))
                    }
                </div>

                <form
                    className="flex flex-col gap-1"
                    onSubmit={(e) => {
                        e.preventDefault();
                        addTopic();
                    }}
                >

                    <div className="flex gap-2 max-w-sm">
                        <Input
                            id="topic-input"
                            value={topicsInput}
                            onChange={(e) => setTopicsInput(e.target.value)}
                            type="text"
                            placeholder="Add topic"
                        />
                        <Button
                            variant="outline"
                        >
                            Add
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <Button
                    size="lg"
                    onClick={handlePlay}
                    disabled={ages.length === 0 || topics.length === 0}
                >Play</Button>
            </CardFooter>
        </Card>
    );
}

