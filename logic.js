class Logic {
    // Scene collection
    #entities = []; #sceneEntities = []; #selectedEntity = -1;

    // Game State
    #timestep = 16; #lastUpdate = 0; #running = false;

    // Mouse interaction
    #mouseX; #mouseY;

    // Cameras
    #viewport; #camera;

    // Physics
    #gravity = 0.8;

    // User input
    #currentKey = "";

    // Scripting
    #transpiler = false;

    constructor(resolution) { // Set camera properties
        this.#viewport = new Camera([0, 0], resolution);
        this.#camera = new Camera([0, 0], resolution);
    }

    Update(timestamp) {
        if (timestamp - this.#lastUpdate < this.#timestep || !this.#running) { return; } // Early exit
        this.#lastUpdate = timestamp;

        for (let entity of this.#entities) {
            if (!this.#transpiler) { // Using vailla Javascript
                if (entity.behavior.includes("function Update()")) { // Uses Update function
                    eval(entity.behavior + "\nUpdate()");
                }
                if (entity.behavior.includes("function KeyPress(") && this.#currentKey != "") { // Uses KeyPress function
                    eval(entity.behavior + "KeyPress('" + this.#currentKey + "')");
                }
            }
            else { // Using transpiler
                TranspileUpdate(entity);
            }
            if (entity.gravity) { entity.velocity.y += this.#gravity; }
            entity.Relocate(); // Update position of entity
            for (let index = this.#entities.indexOf(entity); index < this.#entities.length; index++) { // Check collisions with all other entities
                if (this.#entities[index] != entity) { this.CheckCollision(entity, this.#entities[index]); }
            }
        }

        // Reset user input
        this.#currentKey = "";
    }

    UpdateMouse(x, y) {
        this.#mouseX = x;
        this.#mouseY = y;
        if (!this.#running) { // Scene view
            this.#mouseX *= (1.25); // Scale based on X factor
            this.#mouseY *= (1.35); // Scale based on Y factor
            // Shift in relation to the scene camera
            this.#mouseX -= (-this.#viewport.position.x + this.#viewport.resolution.x / 2);
            this.#mouseY -= (-this.#viewport.position.y + this.#viewport.resolution.y / 2);
        }
        else {
            // Shift in relation to the game camera
            this.#mouseX -= (-this.#camera.position.x + this.#camera.resolution.x / 2);
            this.#mouseY -= (-this.#camera.position.y + this.#camera.resolution.y / 2);
        }
    }

    HandleClick() { // Called every time the user clicks
        if (!this.#running) { // Scene click
            let newSelection = false;
            for (let entity of this.#sceneEntities) { // Check for click on an entity
                let xCondition = (this.#mouseX >= entity.position.x - entity.width / 2 && this.#mouseX <= entity.position.x + entity.width / 2);
                let yCondition = (this.#mouseY >= entity.position.y - entity.height / 2 && this.#mouseY <= entity.position.y + entity.height / 2);
                if (xCondition && yCondition && this.#selectedEntity != this.#sceneEntities.indexOf(entity)) { // Within bounding box and not currently selected
                    newSelection = true;
                    this.#selectedEntity = this.#sceneEntities.indexOf(entity);
                    break;
                }
            }
            if (!newSelection) { this.#selectedEntity = -1; }
        }
    }

    Play() {
        this.#entities = this.#sceneEntities.slice(); // Cloned instances
        for (let index = 0; index < this.#entities.length; index++) {
            let entity = this.#entities[index];
            entity.LoadRenderer();
            if (!this.#transpiler) { // Using vanilla Javascript
                if (entity.behavior.includes("function Start()")) { // Uses Start() function
                    eval(entity.behavior + "\nStart()");
                } else { eval(entity.behavior); }
            }
            else { // Using transpiler
                TranspileStart(entity);
            }
        }
        this.#camera.position = new Vector(0, 0);
        this.#running = true;
    }

    Quit() {
        this.#running = false;
        this.#entities = [];
        while(game.children[0]) {
            game.removeChild(game.children[0]);
        }
    }

    CreateEntity(position, width, height, source) {
        if (this.#running) { return; }
        this.#sceneEntities.push(new Entity(position, width, height, source, "Object" + (this.#sceneEntities.length + 1)));
    }

    set keyInput(key) { this.#currentKey = key; }
    get entities() {
        if (this.#running) { return this.#entities; }
        else { return this.#sceneEntities; }
    }
    get selectedEntity() { return this.#selectedEntity; }
    get running() { return this.#running; }
    get mouseX() { return this.#mouseX; }
    get mouseY() { return this.#mouseY; }
    get viewport() { return this.#viewport; }
    get camera() { return this.#camera; }
}

class Vector { // 2D Vectors
    #x; #y;
    constructor(x = 0, y = 0) {
        this.#x = x;
        this.#y = y;
    }
    add(vector) {
        return new Vector(this.#x + vector.x, this.#y + vector.y);
    }
    subtract(vector) {
        return new Vector(this.#x - vector.x, this.#y - vector.y);
    }
    multiply(factor) {
        return new Vector(this.#x * factor, this.#y * factor);
    }
    get x() { return this.#x; }
    set x(value) { this.#x = value; }
    get y() { return this.#y; }
    set y(value) { this.#y = value; }
    get magnitude() { return Math.sqrt(this.#x ** 2 + this.#y ** 2); }
    get normalized() {
        return new Vector(-this.#y, this.#x).unit();
    }
    get unit() {
        if (this.magnitude == 0) { return new Vector(); }
        return new Vector(this.#x / this.magnitude, this.#y / this.magnitude);
    }
    static dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
}

// Basis for the game and viewport cameras
class Camera {
    position;
    resolution;

    constructor(position, resolution) {
        this.position = new Vector(position[0], position[1]);
        this.resolution = new Vector(resolution[0], resolution[1]);
    }
}

// Basis of every game object
class Entity {
    // Identity
    name; tag;

    // Graphics
    renderer; source;
    width; height;

    // Physics
    kinematic; gravity;
    mass; elasticity;
    position;
    velocity;
    acceleration;

    // Scripting
    behavior;

    constructor(position, width, height, source, name) {
        // Identity and transform
        this.position = position;
        this.width = width;
        this.height = height;
        this.source = source;
        this.name = name;

        // Default values
        this.kinematic = false;
        this.gravity = false;
        this.mass = 2;
        this.elasticity = 1;
        this.velocity = new Vector();
        this.acceleration = new Vector();
        this.tag = "Default";
        this.behavior = "function Start() {\n\n}\n\nfunction Update() {\n\n}\n\nfunction KeyPress(key) {\n\n}";

        // Renderer
        this.LoadRenderer();
    }

    async LoadRenderer() {
        await PIXI.Assets.load("Assets/Sprites/" + this.source);
        this.renderer = PIXI.Sprite.from("Assets/Sprites/" + this.source);
        this.renderer.width = this.width;
        this.renderer.height = this.height;
        if (!logic.running) {
            scene.stage.addChild(this.renderer);
        }
        else {
            game.stage.addChild(this.renderer);
        }
    }

    Relocate() { // Move the entity based on its current acceleration and velocity
        this.acceleration = this.acceleration.unit;
        this.velocity = this.velocity.add(this.acceleration);
        this.position = this.position.add(this.velocity);
    }

    Delete() {
        logic.entities.splice(logic.entities.indexOf(this), 1);
        if (logic.running) { game.stage.removeChild(this.renderer); }
        else { scene.stage.removeChild(this.renderer); }
    }
}