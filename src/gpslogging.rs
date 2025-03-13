use chrono::Utc;
use tokio::fs::File;
use tokio::io::{AsyncWriteExt, BufWriter};
use tokio::sync::mpsc;
use tokio::time::{Duration, Instant};

use crate::gameinterface::GpsPoint;

const LOGGING_PERIOD_MS: u64 = 500;

#[derive(Debug)]
pub struct GpsLogger(Option<mpsc::Sender<GpsPoint>>);

impl GpsLogger {
    pub fn new() -> Self {
        GpsLogger(None)
    }

    pub fn start(&mut self) {
        // Do nothing if the logging thread already exists.
        if self.0.is_none() {
            // Create logging thread and channel.
            let (tx, rx) = mpsc::channel(32);

            tokio::spawn(async move {
                let mut last_updated = Instant::now();
                if let Err(e) = logging_task(rx, &mut last_updated).await {
                    tracing::error!("Logging failed: {e}");
                }
            });
            self.0 = Some(tx);
        }
    }

    pub fn stop(&mut self) {
        // Drop the sender to stop the logging task.
        self.0 = None;
    }

    pub fn active(&self) -> bool {
        self.0.is_some()
    }

    pub async fn send_point(&mut self, point: GpsPoint) -> anyhow::Result<()> {
        if let Some(tx) = self.0.as_mut() {
            tx.send(point).await?;
        }

        Ok(())
    }
}

async fn logging_task(
    mut rx: mpsc::Receiver<GpsPoint>,
    last_updated: &mut Instant,
) -> anyhow::Result<()> {
    // Make sure the logs directory exists.
    std::fs::create_dir_all("logs/")?;

    // Create a file base on the current time.
    let filename = format!("logs/log-{}.csv", Utc::now().format("%FT%H-%M-%S%.f"));
    let inner = File::create(filename).await?;
    let mut file = BufWriter::new(inner);
    file.write_all(b"utc_d,utc_t,lat,lon,alt,head\n").await?;

    tracing::debug!("Starting log file");

    while let Some(msg) = rx.recv().await {
        let now = Instant::now();
        if (now - *last_updated) > Duration::from_millis(LOGGING_PERIOD_MS) {
            *last_updated = now;
            let utc_d = msg.timestamp.format("%Y/%m/%d");
            let utc_t = msg.timestamp.format("%H:%M:%S%.f");
            file.write_all(
                format!(
                    "{},{},{},{},{},{}\n",
                    utc_d, utc_t, msg.lat, msg.lon, msg.alt, msg.heading,
                )
                .as_bytes(),
            )
            .await?;
        }
    }

    file.flush().await?;

    tracing::debug!("Logging terminated");

    Ok(())
}
