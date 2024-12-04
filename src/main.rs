mod types;

use axum::Json;
use axum::{routing::get, Router};
use std::net::SocketAddr;
use tower_http::services::ServeDir;
use types::Person;

#[tokio::main]
async fn main() {
    let serve_root = ServeDir::new("client/dist");
    let api = Router::new().route("/people", get(get_people));

    let app = Router::new().nest("/api", api).fallback_service(serve_root);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn get_people() -> Json<Vec<Person>> {
    let people = vec![
        Person {
            name: "Person A".into(),
            age: 36,
            favorite_food: Some("Pizza".into()),
        },
        Person {
            name: "Person B".into(),
            age: 5,
            favorite_food: Some("Broccoli".into()),
        },
        Person {
            name: "Person C".into(),
            age: 5,
            favorite_food: None,
        },
    ];

    Json(people)
}
