class Logic {
    #sceneEntities = []; #gameEntities = [];
    #selectedEntity = -1;

    // Game State
    #timestep = 16; #lastUpdate = 0; #running = false;

    // Mouse interaction
    #mouseX; #mouseY;

    // Cameras
    #viewport; #camera;

    // Physics
    #gravity = 0.5;

    // Scripting
    #transpiler = false;
    #currentKey = "";

    constructor() { // Set camera properties
        this.#viewport = new Camera([0, 0], [scene.canvas.width, scene.canvas.height]);
        this.#camera = new Camera([0, 0], [game.canvas.width, game.canvas.height]);
    }

    Update(timestamp) {
        if (timestamp - this.#lastUpdate < this.#timestep || !this.#running) { return; } // Early exit
        this.#lastUpdate = timestamp;

        for (let entity of this.#gameEntities) {
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
        }

        // Reset user input
        this.#currentKey = "";
    }

    UpdateMouse(x, y) { // Mouse movement
        this.#mouseX = x;
        this.#mouseY = y;
        if (!this.#running) { // Scene view
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

    Playtest() {
        for (let entity of this.#sceneEntities) { // Cloned instances
            const clone = entity.Clone();
            this.#gameEntities.push(clone);
        }
        this.#camera.position = new Vector2(0, 0);
        this.#running = true;
        for (let index = 0; index < this.#gameEntities.length; index++) {

            let entity = this.#gameEntities[index];

            // Start Method
            if (!this.#transpiler) { // Using vanilla Javascript
                if (entity.behavior.includes("function Start()")) {
                    eval(entity.behavior + "\nStart()");
                } else { eval(entity.behavior); }
            }
            else { // Using transpiler
                TranspileStart(entity);
            }
        }
    }

    Quit() {
        this.#running = false;
        this.#gameEntities = [];
        try { while (scene.stage.children[0]) { scene.stage.removeChild(scene.stage.children[0]); }
        } catch { }
        try { while (game.stage.children[0]) { game.stage.removeChild(game.stage.children[0]); }
        } catch { }
        for (let entity of this.#sceneEntities) {
            entity.LoadRenderer();
        }
    }

    CreateEntity(position, width, height, source) {
        if (this.#running) { return; }
        const entity = new Entity(position, width, height, source, "Object" + (this.#sceneEntities.length + 1));
        this.#sceneEntities.push(entity);
    }

    async SaveProject() {
        let projectID = window.location.href.split("/");
        projectID = projectID[projectID.length - 1];
    
        let data = {};
        let entityData = [];
        for (let entity of this.#sceneEntities) {
            entityData.push(entity.toJSON());
        }
        data["entities"] = entityData;

        await fetch("/save", {
            method: "POST", headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                project: data,
                projectID: projectID
            })
        });
    }
    
    async LoadProject() {
        let projectID = window.location.href.split("/");
        projectID = projectID[projectID.length - 1];
    
        let data;
    
        await fetch("/load", {
            method: "POST", headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                projectID: projectID
            })
        }).then((res) => res.json()).then((res) => data = res);

        try { // Clear the screen and current entities
            while (scene.stage.children[0]) { scene.stage.removeChild(scene.stage.children[0]); }
        } catch { }

        this.#sceneEntities = [];
        for (let entityData of data.entities) {
            this.#sceneEntities.push(Entity.fromJSON(entityData));
        }
    }

    async LoadAssets() {
        let projectID = window.location.href.split("/");
        projectID = projectID[projectID.length - 1];

        let data;

        await fetch("/files", {
            method: "POST", headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                projectID: projectID
            })
        }).then((res) => res.json()).then((res) => data = res);

        const files = document.getElementById("files");
        while (files.firstChild) {
            files.removeChild(files.lastChild);
        }
        for (let file of data.files) {
            let element = document.createElement("a");
            element.classList.add("file");

            element.style.backgroundImage = `url('${projectID}/file/${file}')`;
            element.addEventListener("click", () => {
                if (this.#selectedEntity != -1) {
                    let entity = this.#sceneEntities[this.#selectedEntity]
                    entity.source = file;
                    scene.stage.removeChild(entity.renderer);
                    entity.LoadRenderer();
                }
            });

            files.appendChild(element);
        }
    }

    set currentKey(value) { this.#currentKey = value; }
    get sceneEntities() { return this.#sceneEntities; }
    get gameEntities() { return this.#gameEntities; }
    get selectedEntity() { return this.#selectedEntity; }
    get running() { return this.#running; }
    get mouseX() { return this.#mouseX; }
    get mouseY() { return this.#mouseY; }
    get viewport() { return this.#viewport; }
    get camera() { return this.#camera; }
    get transpiler() { return this.#transpiler; }
}

class Vector2 { // 2D Vectors
    x; y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(vector) {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }
    subtract(vector) {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }
    multiply(factor) {
        return new Vector2(this.x * factor, this.y * factor);
    }
    get magnitude() { return Math.sqrt(this.x ** 2 + this.y ** 2); }
    get normalized() {
        return new Vector2(-this.y, this.x).unit();
    }
    get unit() {
        if (this.magnitude == 0) { return new Vector2(); }
        return new Vector2(this.x / this.magnitude, this.y / this.magnitude);
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
        this.position = new Vector2(position[0], position[1]);
        this.resolution = new Vector2(resolution[0], resolution[1]);
    }
}

class Entity { // Basis of every game object
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
        this.velocity = new Vector2();
        this.acceleration = new Vector2();
        this.tag = "Default";
        this.color = [Random(0, 255), Random(0, 255), Random(0, 255)];
        if (logic.transpiler) { this.behavior = "def Start():\n\n\n\def Update():\n\n\n\nfunction KeyPress(key):\n\n"; }
        else { this.behavior = "function Start() {\n\n}\n\nfunction Update() {\n\n}\n\nfunction KeyPress(key) {\n\n}"; }

        // Render to the canvas
        this.LoadRenderer();
    }

    Clone() { // Returns a deep copy
        let clone = new Entity(this.position, this.width, this.height, this.source, this.name);
        clone.kinematic = this.kinematic;
        clone.gravity = this.gravity;
        clone.mass = this.mass;
        clone.elasticity = this.elasticity;
        clone.velocity = this.velocity;
        clone.acceleration = this.acceleration;
        clone.tag = this.tag;
        clone.color = this.color;
        clone.behavior = this.behavior;
        return clone;
    }

    toJSON() {
        let data = {};
        data.position = this.position;
        data.width = this.width;
        data.height = this.height;
        data.source = this.source;
        data.name = this.name;
        data.kinematic = this.kinematic;
        data.gravity = this.gravity;
        data.mass = this.mass;
        data.elasticity = this.elasticity;
        data.velocity = this.velocity;
        data.acceleration = this.acceleration;
        data.tag = this.tag;
        data.color = this.color;
        data.behavior = this.behavior;
        return data;
    }

    static fromJSON(data) {
        let entity = new Entity(new Vector2(data.position.x, data.position.y), data.width, data.height, data.source, data.name);
        entity.kinematic = data.kinematic;
        entity.gravity = data.gravity;
        entity.mass = data.mass;
        entity.elasticity = data.elasticity;
        entity.velocity = new Vector2(data.velocity.x, data.velocity.y);
        entity.acceleration = new Vector2(data.acceleration.x, data.acceleration.y);
        entity.tag = data.tag;
        entity.color = data.color;
        entity.behavior = data.behavior;
        return entity;
    }

    async LoadRenderer() {
        await PIXI.Assets.load("file/" + this.source);
        this.renderer = PIXI.Sprite.from("file/" + this.source);
        this.renderer.width = this.width;
        this.renderer.height = this.height;
        this.renderer.x = this.position.x - this.width / 2;
        this.renderer.y = this.position.y - this.height / 2;
        this.renderer.tint = [this.color[0] / 255, this.color[1] / 255, this.color[2] / 255];
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
        if (logic.running) {
            logic.gameEntities.splice(logic.entities.indexOf(this), 1);
            game.stage.removeChild(this.renderer);
        }
        else {
            logic.sceneEntities.splice(logic.entities.indexOf(this), 1);
            scene.stage.removeChild(this.renderer);
        }
    }
}