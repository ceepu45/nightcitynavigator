mod gameinterface;
mod gpslogging;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::extract::{Query, State};
use axum::Json;
use axum::{routing::get, Router};
use clap::Parser;
use tokio::sync::Mutex;
use tower_http::services::ServeDir;

use gameinterface::GpsPoint;
use gpslogging::GpsLogger;

#[derive(Debug)]
struct AppState {
    pub player_location: Option<GpsPoint>,
    pub logging: GpsLogger,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            player_location: None,
            logging: GpsLogger::new(),
        }
    }
}

type StateLock = Arc<Mutex<AppState>>;

#[derive(Parser, Debug)]
struct Args {
    #[arg(default_value = "0.0.0.0:3000")]
    address: SocketAddr,
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    tracing_subscriber::fmt::init();

    let args = Args::parse();

    let state_lock = Arc::new(Mutex::new(AppState::new()));

    let serve_root = ServeDir::new("client/dist");
    let api = Router::new()
        .route("/location", get(location))
        .route("/logging", get(logging))
        .with_state(state_lock.clone());

    let app = Router::new().nest("/api", api).fallback_service(serve_root);

    // Spawn game interface thread
    let interface_thread = tokio::spawn(gameinterface::udp_updater(state_lock.clone()));

    println!("listening on http://{}", args.address);

    let listener = tokio::net::TcpListener::bind(args.address).await.unwrap();

    let result = axum::serve(listener, app).await;

    interface_thread.abort();

    result
}

async fn location(State(state): State<StateLock>) -> Json<Option<GpsPoint>> {
    let state = state.lock().await;
    Json(state.player_location)
}

#[derive(serde::Deserialize)]
struct LoggingQuery {
    pub on: bool,
}
async fn logging(
    State(state): State<StateLock>,
    params: Option<Query<LoggingQuery>>,
) -> &'static str {
    let mut state = state.lock().await;

    let on = if let Some(params) = params {
        if params.on {
            state.logging.start();
        } else {
            state.logging.stop();
        }
        params.on
    } else {
        state.logging.active()
    };

    if on {
        "true"
    } else {
        "false"
    }
}
