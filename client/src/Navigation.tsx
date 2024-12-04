import { Stack, Box, Button, IconButton, Card, Input, Field, defineStyle } from "@chakra-ui/react";
import { LuArrowLeft } from "react-icons/lu";
import useStateStore from "@/stateStore";

function SearchInput({ label }: { label: string }) {
    return (
        <Field.Root>
            <Input className="peer" placeholder="" />
            <Field.Label css={floatingStyles}>{label}</Field.Label>
        </Field.Root>
    );
}

function DirectionInput({ onNavigate }: { onNavigate: () => void }) {
    return (
        <Card.Root
            zIndex="10"
            width="sm"
            pos="absolute"
            top="5"
            left="5"
        >
            <Card.Body gap="2">
                <Card.Title>Navigation</Card.Title>
                <Stack gap="5">
                    <SearchInput label="Destination" />
                    <Button onClick={onNavigate}>Navigate</Button>
                </Stack>
            </Card.Body>
        </Card.Root>
    );
}

function LiveNavigation({ onBack }: { onBack: () => void }) {
    return (
        <Card.Root
            zIndex="10"
            width="sm"
            pos="absolute"
            top="5"
            left="5"
        >
            <Box>
                <IconButton
                    size="sm"
                    pos="absolute"
                    top="5"
                    right="5"
                    onClick={onBack}
                ><LuArrowLeft /></IconButton>
            </Box>
            <Card.Body gap="2">
                <Card.Title>
                    Navigation
                </Card.Title>
                <Card.Description>Directions to go here</Card.Description>
            </Card.Body>
        </Card.Root>
    );
}

export default function Navigation() {
    const navigating = useStateStore((state) => state.navigating);
    const setNavigating = useStateStore((state) => state.setNavigating);
    // TODO settings button for navigation settings
    // TODO method to set "from" to "current location" widget. For now, always assume "from" current location.
    // TODO switch to live directions when a destination is entered

    if (navigating) {
        return (
            <LiveNavigation onBack={() => setNavigating(false)} />
        );
    } else {
        return (
            <DirectionInput onNavigate={() => setNavigating(true)} />
        );
    }

}

const floatingStyles = defineStyle({
    pos: "absolute",
    bg: "bg",
    px: "0.5",
    top: "-3",
    insetStart: "2",
    fontWeight: "normal",
    pointerEvents: "none",
    transition: "position",
    _peerPlaceholderShown: {
        color: "fg.muted",
        top: "2.5",
        insetStart: "3",
    },
    _peerFocusVisible: {
        color: "fg",
        top: "-3",
        insetStart: "2",
    },
});
