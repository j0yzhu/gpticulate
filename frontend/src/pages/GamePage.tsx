import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx"
import {Button} from "@/components/ui/button.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {useEffect, useState} from "react";
import {useParams} from "react-router";
import SessionService, {type CardDto} from "@/services/session-service.ts";


export default function GamePage() {
    const {gameId} = useParams<{ gameId: string }>();

    const [count, setCount] = useState(0);
    const [leftCard, setLeftCard] = useState<CardDto | null>(null);
    const [rightCard, setRightCard] = useState<CardDto | null>(null);

    useEffect(() => {
        const populateCards = async () => {
            setLeftCard(await SessionService.getCard(gameId!))
            setRightCard(await SessionService.getCard(gameId!))
        }

        populateCards();
    }, []);

    const leftOnNext = async () => {
        const newCard = await SessionService.getCard(gameId!);
        setLeftCard(newCard);
        setCount((count) => count + 1);
    }

    const rightOnNext = async () => {
        const newCard = await SessionService.getCard(gameId!);
        setRightCard(newCard);
        setCount((count) => count + 1);
    }

    return (
        <div className="flex flex-col max-w-7xl mx-auto p-4 gap-6">
            <TimerBar/>
            <div className="flex flex-row items-center gap-4">
                {
                    leftCard && rightCard &&
                    <>
                        <Deck card={leftCard} onNext={leftOnNext}/>
                        <Deck card={rightCard} onNext={rightOnNext}/>
                    </>
                }

            </div>
            <ScoreBoard score={count}/>
        </div>
    );
}

const Deck = ({onNext, card}: { onNext: () => void, card: CardDto }) => {

    return (
        <Card className="max-w-2xl w-full">
            <CardHeader className="text-xl font-bold text-primary justify-center">
                <CardTitle>GPTiculate</CardTitle>
            </CardHeader>
            <CardContent className="items-center justify-center text-lg">
                <p style={{color: "#46A2DA"}}>OBJECT: {card.object}</p>
                <Separator/>
                <p style={{color: "#008000"}}>NATURE: {card.nature}</p>
                <Separator/>
                <p style={{color: "#FDD128"}}>PERSON: {card.person}</p>
                <Separator/>
                <p style={{color: "#FFA500"}}>ACTION: {card.action}</p>
                <Separator/>
                <p style={{color: "#00008B"}}>WORLD: {card.world}</p>
                <Separator/>
                <p style={{color: "#FF0000"}}>RANDOM: {card.random}</p>
                <div className="flex justify-center mt-4">
                    <Button className="w-full max-w-xs text-lg font-bold"
                            onClick={onNext}>Next</Button>
                </div>
            </CardContent>
        </Card>
    );
}


const TimerBar = () => {
    const [timeLeft, setTimeLeft] = useState(60); // seconds
    const percentage = ((60 - timeLeft) / 60) * 100;

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    return (
        <div className="w-full mt-4 space-y-2">
            <div className="text-center text-xl font-semibold text-muted-foreground">
                {timeLeft}s
            </div>
            <div className="w-full h-3 bg-gray-200 rounded">
                <div
                    className="h-full bg-primary rounded transition-all duration-1000"
                    style={{width: `${percentage}%`}}
                />
            </div>
        </div>
    );
};

const ScoreBoard = ({score}: { score: number }) => {
    return (
        <div className="flex justify-center mt-4">
            <Card className="max-w-xs w-full">
                <CardHeader className="text-xl font-bold text-primary text-center">
                    Score:
                </CardHeader>
                <CardContent className="text-center text-2xl font-semibold">
                    {score}
                </CardContent>
            </Card>
        </div>
    );
}