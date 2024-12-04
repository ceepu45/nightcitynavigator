import { Button, IconButton, Group, Stack } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { LuZoomIn, LuZoomOut, LuSquare, LuCircle, LuLocate, LuLocateFixed } from "react-icons/lu";
import useStateStore from "@/stateStore";


export default function Controls() {
    const recording = useStateStore((state) => state.recording);
    const tracking = useStateStore((state) => state.tracking);
    const setRecording = useStateStore((state) => state.setRecording);
    const setTracking = useStateStore((state) => state.setTracking);
    const zoomIn = useStateStore((state) => state.zoomIn);
    const zoomOut = useStateStore((state) => state.zoomOut);
    // TODO settings button for navigation settings
    // TODO method to set "from" to "current location" widget. For now, always assume "from" current location.


    return (
        <>
            <Group attached
                zIndex="10"
                pos="absolute"
                top="10"
                right="10"
                orientation="vertical"
            >
                <IconButton
                    aria-label="Zoom In"
                    onClick={zoomIn}
                >
                    <LuZoomIn />
                </IconButton>
                <IconButton
                    aria-label="Zoom Out"
                    onClick={zoomOut}
                >
                    <LuZoomOut />
                </IconButton>
            </Group>
            <Stack gap="5"
                zIndex="10"
                pos="absolute"
                bottom="10"
                right="10"
            >
                <Tooltip content="Track location" openDelay={200} closeDelay={100}>
                    <IconButton
                        aria-label="Track location"
                        rounded="full"
                        onClick={() => setTracking(!tracking)}
                    >
                        {tracking ? <LuLocateFixed /> : <LuLocate />}
                    </IconButton>
                </Tooltip>
                <Tooltip content="Toggle Logging" openDelay={200} closeDelay={100}>
                    <IconButton
                        {...recording && { bg: "#f00" }}
                        aria-label="Toggle Logging"
                        rounded="full"
                        onClick={() => setRecording(!recording)}
                    >
                        {recording ? <LuSquare fill="#000" /> : <LuCircle fill="#d00" />}
                    </IconButton>
                </Tooltip>
            </Stack >
        </>
    );
}

