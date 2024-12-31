interface TripSummary {
    time: number
    length: number
    has_toll: boolean
    has_highway: boolean
    has_ferry: boolean
    has_time_restrictions?: boolean
    min_lat: number
    min_lon: number
    max_lat: number
    max_lon: number
    level_changes: unknown
}


enum ManeuverType {
    None = 0,
    Start = 1,
    StartRight = 2,
    StartLeft = 3,
    Destination = 4,
    DestinationRight = 5,
    DestinationLeft = 6,
    Becomes = 7,
    Continue = 8,
    SlightRight = 9,
    Right = 10,
    SharpRight = 11,
    UturnRight = 12,
    UturnLeft = 13,
    SharpLeft = 14,
    Left = 15,
    SlightLeft = 16,
    RampStraight = 17,
    RampRight = 18,
    RampLeft = 19,
    ExitRight = 20,
    ExitLeft = 21,
    StayStraight = 22,
    StayRight = 23,
    StayLeft = 24,
    Merge = 25,
    RoundaboutEnter = 26,
    RoundaboutExit = 27,
    FerryEnter = 28,
    FerryExit = 29,
    Transit = 30,
    TransitTransfer = 31,
    TransitRemainOn = 32,
    TransitConnectionStart = 33,
    TransitConnectionTransfer = 34,
    TransitConnectionDestination = 35,
    PostTransitConnectionDestination = 36,
    MergeRight = 37,
    MergeLeft = 38,
    ElevatorEnter = 39,
    StepsEnter = 40,
    EscalatorEnter = 41,
    BuildingEnter = 42,
    BuildingExit = 43,
}

interface Maneuver {
    type: ManeuverType,
    instruction: string,
    verbal_transition_alert_instruction: string
    verbal_pre_transition_instruction: string
    verbal_post_transition_instruction: string
    street_names: string[]
    begin_street_names?: string[]
    time: number
    length: number
    begin_shape_index: number
    end_shape_index: number
    toll: boolean
    highway: boolean
    rough: boolean
    gate: boolean
    ferry: boolean
    sign: unknown
    roundabout_exit_count: number
    depart_instruction: string
    verbal_depart_instruction: string
    arrive_instruction: string
    verbal_arrive_instruction: string
    transit_info: unknown
    verbal_multi_cue: boolean
    travel_mode: "drive" | "pedestrian" | "bicycle" | "transit"
    travel_type: string
    bss_maneuver_type?: string
}

interface TripLeg {
    summary: TripSummary
    shape: string
    maneuvers: Maneuver[]
}

export interface Trip {
    status: number
    status_message: string
    units: "kilometers" | "miles"
    lanuage: string

    location: Array<unknown>
    warnings?: Array<unknown>

    summary: TripSummary
    legs: TripLeg[]
}

export interface RouteResponse {
    id?: string
    trip: Trip
}
