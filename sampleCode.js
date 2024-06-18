function Start() {
    entity.velocity = new Vector2();
}

function Update() {
    logic.camera.position = logic.camera.position.add(entity.position.subtract(logic.camera.position).multiply(0.05));
    if (entity.position.y > 60) {
        entity.position.y = 60;
        entity.velocity.y = 0;
    }
}

function KeyPress(key) {
    if (key == "w") {
        entity.velocity.y = -10;
    }
    if (key == "s") {
        entity.velocity.y = 10;
    }
    if (key == "a") {
        entity.velocity.x = -10;
    }
    if (key == "d") {
        entity.velocity.x = 10;
    }
}