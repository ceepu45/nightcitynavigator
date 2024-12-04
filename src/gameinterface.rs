use std::cell::LazyCell;
use std::mem;

use chrono::{DateTime, Utc};
use proj4rs::Proj;
use tokio::net::UdpSocket;

const CENTER_OFFSET_LAT: f64 = 0.0;
const CENTER_OFFSET_LON: f64 = 0.0;
const METERS_PER_COORD: f64 = 1.0;

struct Projections {
    wgs: Proj,
    mercator: Proj,
}

thread_local! {
static PROJECTIONS: LazyCell<Projections> = LazyCell::new(|| Projections {
    wgs: Proj::from_proj_string("+proj=longlat +datum=WGS84 +no_defs +type=crs").unwrap(),
    mercator: Proj::from_proj_string("+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs").unwrap(),
});
}

#[derive(Debug)]
#[repr(C)]
struct LocationInfo {
    pub seconds: u32,
    pub nanos: u32,
    pub loc_type: u32,

    pub x: f32,
    pub y: f32,
    pub z: f32,

    pub i: f32,
    pub j: f32,
    pub k: f32,
    pub r: f32,
}

const PACKET_SIZE: usize = mem::size_of::<LocationInfo>();
const _: () = assert!(PACKET_SIZE == 40, "Unexpected length of LocationInfo");

impl LocationInfo {
    pub fn from_bytes(bytes: [u8; mem::size_of::<Self>()]) -> Self {
        // SAFETY:
        //  - LocationInfo is repr(C), and consists only of u32 and f32 values, which are valid for
        //  all bits.
        //  - Sizes are guarenteed to be equal.
        unsafe { mem::transmute::<_, Self>(bytes) }
    }
}

#[derive(Debug, serde::Serialize, Clone, Copy)]
pub struct GpsPoint {
    pub timestamp: DateTime<Utc>,
    pub lat: f64,
    pub lon: f64,
    pub alt: f64,
    pub heading: f64,
}

impl GpsPoint {
    fn from_game_location(game_loc: &LocationInfo) -> anyhow::Result<Self> {
        let timestamp = DateTime::from_timestamp(game_loc.seconds as i64, game_loc.nanos)
            .ok_or_else(|| anyhow::anyhow!("Invalid timestamp"))?;

        let mut points = (
            game_loc.x as f64 * METERS_PER_COORD,
            game_loc.y as f64 * METERS_PER_COORD,
            game_loc.z as f64 * METERS_PER_COORD,
        );

        PROJECTIONS.with(|proj| {
            proj4rs::transform::transform(&proj.mercator, &proj.wgs, &mut points).unwrap();
        });

        // Get heading (yaw) from quaternion
        let siny_cosp = 2.0 * (game_loc.r * game_loc.k + game_loc.i * game_loc.j);
        let cosy_cosp = 1.0 - 2.0 * (game_loc.j * game_loc.j + game_loc.i * game_loc.i);
        let heading = f64::atan2(siny_cosp as _, cosy_cosp as _);

        Ok(GpsPoint {
            timestamp,
            lat: (points.1 - CENTER_OFFSET_LAT).to_degrees(),
            lon: (points.0 - CENTER_OFFSET_LON).to_degrees(),
            alt: points.2,
            heading,
        })
    }
}

/// Main task for interfacing with the game logic.
pub async fn udp_updater(state_lock: crate::StateLock) -> anyhow::Result<()> {
    let socket = UdpSocket::bind("127.0.0.1:52077").await?;

    let mut buf = [0; PACKET_SIZE];

    loop {
        let (len, _src) = socket.recv_from(&mut buf).await?;

        if len != PACKET_SIZE {
            tracing::warn!("Unexpected packet length: {len}");
            continue;
        }

        let game_location = LocationInfo::from_bytes(buf);
        let point = GpsPoint::from_game_location(&game_location)?;

        let mut state = state_lock.lock().await;
        match game_location.loc_type {
            0 => state.player_location = Some(point),
            t => tracing::warn!("Recieved unrecognized location type: {t}"),
        }

        state.logging.send_point(point).await?;
    }
}
