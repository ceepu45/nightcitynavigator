import { Stack, Box, Button, IconButton, Card, Input, InputProps, Field, defineStyle } from "@chakra-ui/react";
import { Alert } from "@/components/ui/alert";
import { LuArrowLeft, LuSearch } from "react-icons/lu";
import useStateStore from "@/stateStore";

interface SearchInputProps extends InputProps {
    label: string
}
function SearchInput({ label, ...input }: SearchInputProps) {
    return (
        <Field.Root>
            <Input className="peer" placeholder="" {...input} />
            <Field.Label css={floatingStyles}>{label}</Field.Label>
        </Field.Root>
    );
}

function DirectionInput() {
    const requestGeocodingLookup = useStateStore((state) => state.requestGeocodingLookup);
    const requestDirections = useStateStore((state) => state.requestDirections);
    const searchText = useStateStore((state) => state.dest_search);
    const updateSearchBox = useStateStore((state) => state.updateSearchBox);
    const destValid = useStateStore((state) => state.destination != null);
    const playerValid = useStateStore((state) => state.playerValid);

    const navValid = destValid && playerValid;

    const showWarning = destValid && !playerValid;

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
                    <Stack gap="3" direction="row">
                        <SearchInput
                            label="Destination"
                            value={searchText}
                            onChange={(e) => updateSearchBox(e.target.value)}
                            onKeyDown={e => (e.key === "Enter") && requestGeocodingLookup(searchText)}
                        />
                        <IconButton onClick={() => requestGeocodingLookup(searchText)}><LuSearch /></IconButton>
                    </Stack>
                    {showWarning && <Alert status="error" title="Waiting for player position" />}
                    <Button disabled={!navValid} onClick={requestDirections}>Navigate</Button>
                </Stack>
            </Card.Body>
        </Card.Root>
    );
}

function LiveNavigation() {
    const exitNavigation = useStateStore((state) => state.exitNavigation);
    const maneuver = useStateStore((state) => state.navRoute ? state.navRoute.maneuvers[state.currentManeuver] : null);


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
                    onClick={exitNavigation}
                ><LuArrowLeft /></IconButton>
            </Box>
            <Card.Body gap="2">
                <Card.Title>
                    Navigation
                </Card.Title>
                <Card.Description>{maneuver && (maneuver.verbal_transition_alert_instruction ?? maneuver.instruction)}</Card.Description>
            </Card.Body>
        </Card.Root>
    );
}

export default function Navigation() {
    const navigating = useStateStore((state) => state.navRoute != null);
    // TODO settings button for navigation settings
    // TODO method to set "from" to "current location" widget. For now, always assume "from" current location.
    // TODO switch to live directions when a destination is entered

    if (navigating) {
        return (
            <LiveNavigation />
        );
    } else {
        return (
            <DirectionInput />
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
